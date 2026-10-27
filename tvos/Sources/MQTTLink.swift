import Foundation

/// MQTT 3.1.1 over WebSocket. The web clients already use these public brokers.
@MainActor
final class MQTTLink {
    let url: URL
    let topic: String
    var onReady: (() -> Void)?
    var onPayload: ((Data) -> Void)?
    var onClosed: (() -> Void)?

    private var session: URLSession?
    private var socket: URLSessionWebSocketTask?
    private var pingTask: Task<Void, Never>?
    private var buffer = [UInt8]()
    private(set) var ready = false
    private var active = false
    private let clientID = "gya-tvos-" + String(UUID().uuidString.prefix(12))

    init(url: URL, topic: String) {
        self.url = url
        self.topic = topic
    }

    func connect() {
        guard !active else { return }
        active = true
        open()
    }

    func close() {
        active = false
        ready = false
        pingTask?.cancel()
        pingTask = nil
        socket?.cancel(with: .goingAway, reason: nil)
        socket = nil
        session?.invalidateAndCancel()
        session = nil
    }

    private func open() {
        guard active else { return }
        ready = false
        buffer.removeAll()
        let session = URLSession(configuration: .default)
        let socket = session.webSocketTask(with: url, protocols: ["mqtt"])
        self.session = session
        self.socket = socket
        socket.resume()
        Task {
            do {
                try await socket.send(.data(Data(connectPacket())))
                while active, self.socket === socket {
                    let message = try await socket.receive()
                    if case .data(let data) = message { consume(data) }
                }
            } catch {
                guard active, self.socket === socket else { return }
                ready = false
                pingTask?.cancel()
                onClosed?()
                socket.cancel(with: .goingAway, reason: nil)
                session.invalidateAndCancel()
                self.socket = nil
                self.session = nil
                try? await Task.sleep(nanoseconds: 3_000_000_000)
                open()
            }
        }
    }

    func publish(_ payload: Data) {
        guard ready, let socket else { return }
        let body = utf(topic) + [UInt8](payload)
        let packet = Data([0x30] + remaining(body.count) + body)
        Task { try? await socket.send(.data(packet)) }
    }

    private func consume(_ data: Data) {
        buffer.append(contentsOf: data)
        while buffer.count >= 2 {
            var length = 0
            var multiplier = 1
            var index = 1
            var complete = false
            while index < buffer.count, index <= 4 {
                let byte = Int(buffer[index])
                length += (byte & 127) * multiplier
                index += 1
                if byte & 128 == 0 { complete = true; break }
                multiplier *= 128
            }
            if !complete { return }
            guard length <= 1_000_000 else { buffer.removeAll(); return }
            if buffer.count < index + length { return }
            let type = buffer[0] >> 4
            let body = Array(buffer[index..<(index + length)])
            buffer.removeFirst(index + length)
            switch type {
            case 2: // CONNACK
                if body.count >= 2, body[1] == 0 { subscribe() }
            case 9: // SUBACK
                ready = true
                onReady?()
                pingTask?.cancel()
                pingTask = Task {
                    while !Task.isCancelled, active {
                        try? await Task.sleep(nanoseconds: 20_000_000_000)
                        guard !Task.isCancelled, active, let socket = self.socket else { return }
                        try? await socket.send(.data(Data([0xC0, 0x00])))
                    }
                }
            case 3: // PUBLISH (the web client uses QoS 0)
                guard body.count >= 2 else { continue }
                let topicLength = Int(body[0]) * 256 + Int(body[1])
                guard body.count >= 2 + topicLength else { continue }
                let receivedTopic = String(decoding: body[2..<(2 + topicLength)], as: UTF8.self)
                if receivedTopic == topic { onPayload?(Data(body[(2 + topicLength)...])) }
            default: break
            }
        }
    }

    private func subscribe() {
        guard let socket else { return }
        let body: [UInt8] = [0, 1] + utf(topic) + [0]
        let packet = Data([0x82] + remaining(body.count) + body)
        Task { try? await socket.send(.data(packet)) }
    }

    private func connectPacket() -> [UInt8] {
        let body: [UInt8] = utf("MQTT") + [4, 2, 0, 30] + utf(String(clientID))
        return [0x10] + remaining(body.count) + body
    }

    private func utf(_ text: String) -> [UInt8] {
        let bytes = [UInt8](text.utf8)
        return [UInt8((bytes.count >> 8) & 255), UInt8(bytes.count & 255)] + bytes
    }

    private func remaining(_ length: Int) -> [UInt8] {
        var n = length
        var result = [UInt8]()
        repeat {
            var byte = UInt8(n % 128)
            n /= 128
            if n > 0 { byte |= 128 }
            result.append(byte)
        } while n > 0
        return result
    }
}
