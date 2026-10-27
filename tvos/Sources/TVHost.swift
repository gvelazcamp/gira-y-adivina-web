import Combine
import Foundation

struct TVPlayer: Identifiable {
    let pid: String
    var name: String
    var id: String { pid }
}

@MainActor
final class TVHost: ObservableObject {
    enum Screen: Equatable { case home, menu, cien, ahorcado }

    @Published private(set) var screen: Screen = .home
    @Published private(set) var code = ""
    @Published private(set) var players = [TVPlayer]()
    @Published private(set) var controllerPID: String?
    @Published private(set) var connectedBrokers = 0
    @Published private(set) var cien: CienGame?
    @Published private(set) var ahorcado: AhorcadoGame?
    @Published private(set) var errorMessage = ""

    private let brokerURLs = [
        "wss://broker.emqx.io:8084/mqtt",
        "wss://broker.hivemq.com:8884/mqtt",
        "wss://test.mosquitto.org:8081/mqtt",
        "wss://mqtt.eclipseprojects.io:443/mqtt"
    ]
    private let tvPID = "tv" + String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(8))
    private var links = [MQTTLink]()
    private var heartbeat: Task<Void, Never>?
    private var nextRoundTask: Task<Void, Never>?
    private var spinTask: Task<Void, Never>?
    private var sequence = 0
    private var recentMessages = [String: Date]()

    var controllerName: String {
        players.first { $0.pid == controllerPID }?.name ?? "Nadie todavía"
    }

    func start() {
        guard screen == .home else { return }
        code = Self.roomCode()
        screen = .menu
        errorMessage = ""
        let topic = "gya/tele/\(code)"
        links = brokerURLs.compactMap { value in
            guard let url = URL(string: value) else { return nil }
            let link = MQTTLink(url: url, topic: topic)
            link.onReady = { [weak self] in self?.brokerChanged(); self?.broadcast() }
            link.onClosed = { [weak self] in self?.brokerChanged() }
            link.onPayload = { [weak self] data in self?.receive(data) }
            return link
        }
        links.forEach { $0.connect() }
        heartbeat = Task { [weak self] in
            while !Task.isCancelled {
                guard let self, self.screen != .home else { return }
                self.broadcast()
                try? await Task.sleep(nanoseconds: 2_500_000_000)
            }
        }
    }

    func back() {
        switch screen {
        case .cien, .ahorcado: showMenu()
        case .menu: stop()
        case .home: break
        }
    }

    func stop() {
        heartbeat?.cancel(); heartbeat = nil
        nextRoundTask?.cancel(); nextRoundTask = nil
        spinTask?.cancel(); spinTask = nil
        links.forEach { $0.close() }; links.removeAll()
        connectedBrokers = 0
        players.removeAll()
        controllerPID = nil
        cien = nil
        ahorcado = nil
        screen = .home
    }

    func showMenu() {
        nextRoundTask?.cancel(); nextRoundTask = nil
        spinTask?.cancel(); spinTask = nil
        cien = nil
        ahorcado = nil
        screen = .menu
        broadcast()
    }

    func startCien() {
        guard screen == .menu else { return }
        guard let game = CienGame() else { errorMessage = "No se pudo cargar 100 Rioplatenses"; return }
        cien = game
        screen = .cien
        errorMessage = ""
        broadcast()
    }

    func startAhorcado() {
        guard screen == .menu else { return }
        guard let game = AhorcadoGame() else { errorMessage = "No se pudo cargar Ahorcado"; return }
        ahorcado = game
        screen = .ahorcado
        errorMessage = ""
        broadcast()
        beginAhorcadoAfterSpin()
    }

    private func beginAhorcadoAfterSpin() {
        spinTask?.cancel()
        spinTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 1_800_000_000)
            guard !Task.isCancelled, let self, var game = self.ahorcado else { return }
            game.beginWord()
            self.ahorcado = game
            self.broadcast()
        }
    }

    private func brokerChanged() {
        connectedBrokers = links.filter(\.ready).count
    }

    private func receive(_ data: Data) {
        guard let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let pid = object["pid"] as? String, pid != String(tvPID), pid.count <= 80 else { return }
        let seq = object["s"] as? Int ?? 0
        let key = "\(pid):\(seq):\(object["t"] as? String ?? "")"
        let now = Date()
        if let previous = recentMessages[key], now.timeIntervalSince(previous) < 2 { return }
        recentMessages[key] = now
        if recentMessages.count > 200 {
            recentMessages = recentMessages.filter { now.timeIntervalSince($0.value) < 5 }
        }
        switch object["t"] as? String {
        case "hola":
            let raw = (object["n"] as? String ?? "Jugador").trimmingCharacters(in: .whitespacesAndNewlines)
            let name = String(raw.prefix(14)).isEmpty ? "Jugador" : String(raw.prefix(14))
            if let index = players.firstIndex(where: { $0.pid == pid }) {
                players[index].name = name
            } else if players.count < 8 {
                players.append(TVPlayer(pid: pid, name: name))
            }
            if controllerPID == nil || !players.contains(where: { $0.pid == controllerPID }) {
                controllerPID = players.first?.pid
            }
            broadcast()
        case "chau":
            players.removeAll { $0.pid == pid }
            if controllerPID == pid { controllerPID = players.first?.pid }
            broadcast()
        case "tomar":
            guard players.contains(where: { $0.pid == pid }) else { return }
            controllerPID = pid
            broadcast()
        case "accion":
            guard pid == controllerPID, players.contains(where: { $0.pid == pid }) else { return }
            handleAction(object)
        default: break
        }
    }

    private func handleAction(_ object: [String: Any]) {
        guard let action = object["a"] as? String else { return }
        if action == "menu" { showMenu(); return }
        if action == "elegir", object["juego"] as? String == "cien" { startCien(); return }
        if action == "elegir", object["juego"] as? String == "ahorcado" { startAhorcado(); return }
        if action == "otra", screen == .cien { showMenu(); startCien(); return }
        if action == "otra", screen == .ahorcado { showMenu(); startAhorcado(); return }
        if action == "letra", screen == .ahorcado, let letter = object["l"] as? String, var game = ahorcado {
            let result = game.tryLetter(letter)
            ahorcado = game
            if result != .ignored { broadcast() }
            if result == .roundEnded {
                nextRoundTask?.cancel()
                nextRoundTask = Task { [weak self] in
                    try? await Task.sleep(nanoseconds: 3_000_000_000)
                    guard !Task.isCancelled, let self, var next = self.ahorcado else { return }
                    next.nextWord()
                    self.ahorcado = next
                    self.broadcast()
                    if next.stage == .spin { self.beginAhorcadoAfterSpin() }
                }
            }
            return
        }
        if action == "responder", screen == .cien, let text = object["txt"] as? String, var game = cien {
            let result = game.answer(String(text.prefix(40)))
            cien = game
            if result != .ignored { broadcast() }
            if result == .roundEnded {
                nextRoundTask?.cancel()
                nextRoundTask = Task { [weak self] in
                    try? await Task.sleep(nanoseconds: 4_500_000_000)
                    guard !Task.isCancelled, let self, var next = self.cien else { return }
                    next.nextRound()
                    self.cien = next
                    self.broadcast()
                }
            }
        }
    }

    private func broadcast() {
        guard screen != .home else { return }
        let games: [[String: Any]] = [
            ["id": "cien", "nombre": "100 Rioplatenses", "ok": true],
            ["id": "rosco", "nombre": "El Rosco", "ok": false],
            ["id": "ahorcado", "nombre": "Ahorcado", "ok": true],
            ["id": "ruleta", "nombre": "La Ruleta", "ok": false],
            ["id": "tutti", "nombre": "Tutti Frutti", "ok": false],
            ["id": "puzzle", "nombre": "Puzzle", "ok": false]
        ]
        let cell: [String: Any]
        switch screen {
        case .cien: cell = cien?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .ahorcado: cell = ahorcado?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .home, .menu: cell = ["pantalla": "menu", "juegos": games]
        }
        let message: [String: Any] = [
            "t": "estado", "pid": String(tvPID), "s": sequence + 1, "cod": code,
            "fase": screen == .menu ? "menu" : "juego",
            "juego": screen == .cien ? "cien" as Any : (screen == .ahorcado ? "ahorcado" as Any : NSNull()),
            "jug": players.map { ["pid": $0.pid, "n": $0.name] },
            "mando": controllerPID.map { $0 as Any } ?? NSNull(), "cel": cell
        ]
        sequence += 1
        guard JSONSerialization.isValidJSONObject(message),
              let data = try? JSONSerialization.data(withJSONObject: message) else { return }
        links.forEach { $0.publish(data) }
    }

    private static func roomCode() -> String {
        let alphabet = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
        if let old = UserDefaults.standard.string(forKey: "gya_tele_codigo"),
           old.count == 5, old.allSatisfy({ alphabet.contains($0) }) { return old }
        let fresh = String((0..<5).compactMap { _ in alphabet.randomElement() })
        UserDefaults.standard.set(fresh, forKey: "gya_tele_codigo")
        return fresh
    }
}
