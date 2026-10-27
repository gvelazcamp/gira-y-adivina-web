import Foundation

struct RoscoItem: Decodable {
    let letra: String
    let palabra: String
    let definicion: String
    let categoria: String
    let nivel: Int
    let alternativas: [String]
}

private struct RoscoBank: Decodable {
    let items: [RoscoItem]

    enum CodingKeys: String, CodingKey { case items = "ROSCO_DATOS" }
}

struct RoscoGame {
    enum Stage: Equatable { case playing, finished }
    enum Mark: Equatable { case pending, correct, wrong }

    private static let letters = Array("ABCDEFGHIJLMNOPQRSTUVYZ").map { String($0) }
    private(set) var items: [RoscoItem]
    private(set) var marks: [Mark]
    private(set) var current = 0
    private(set) var remaining = 160.0
    private(set) var stage: Stage = .playing
    private(set) var lastMessage = ""

    var currentItem: RoscoItem { items[current] }
    var correctCount: Int { marks.filter { $0 == .correct }.count }
    var wrongCount: Int { marks.filter { $0 == .wrong }.count }
    var clock: String {
        let seconds = max(0, Int(ceil(remaining)))
        return "\(seconds / 60):\(String(format: "%02d", seconds % 60))"
    }
    var rule: String {
        let first = Self.normalized(currentItem.palabra).first.map { String($0) } ?? ""
        return (first == currentItem.letra ? "Empieza con la " : "Contiene la ") + currentItem.letra
    }

    init?() {
        guard let url = Bundle.main.url(forResource: "rosco", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let bank = try? JSONDecoder().decode(RoscoBank.self, from: data) else { return nil }
        var seen = Set(UserDefaults.standard.stringArray(forKey: "gya_tvos_rosco_usadas") ?? [])
        let selectedLetters = Array(Self.letters.filter { letter in
            bank.items.contains { $0.letra == letter }
        }.shuffled().prefix(20)).sorted()
        guard selectedLetters.count == 20 else { return nil }
        var selected = [RoscoItem]()
        for letter in selectedLetters {
            let all = bank.items.filter { $0.letra == letter }
            var available = all.filter { !seen.contains($0.palabra) }
            if available.isEmpty {
                all.forEach { seen.remove($0.palabra) }
                available = all
            }
            let easy = available.filter { $0.nivel <= 2 }
            guard let item = (easy.isEmpty ? available : easy).randomElement() else { return nil }
            selected.append(item)
            seen.insert(item.palabra)
        }
        UserDefaults.standard.set(Array(seen), forKey: "gya_tvos_rosco_usadas")
        items = selected
        marks = Array(repeating: .pending, count: selected.count)
    }

    mutating func pass() {
        guard stage == .playing else { return }
        lastMessage = "Pasó \(currentItem.letra) ⏭"
        advance()
    }

    mutating func answer(_ input: String) {
        guard stage == .playing else { return }
        let value = Self.normalized(input)
        guard !value.isEmpty else { return }
        let item = currentItem
        let answers = [item.palabra] + item.alternativas
        let base = Self.normalized(item.palabra)
        let suffix = value.hasPrefix(base) ? String(value.dropFirst(base.count)) : ""
        let expanded = suffix.count > 0 && suffix.count <= 12 &&
            suffix.range(of: "^(DEL?|DELA|DELOS|DELAS)[A-Z]{3,}$", options: .regularExpression) != nil
        let correct = answers.contains { Self.normalized($0) == value } || expanded
        marks[current] = correct ? .correct : .wrong
        lastMessage = correct ? "¡Bien! \(item.palabra) ✓" : "Era \(item.palabra)"
        advance()
    }

    mutating func tick(_ seconds: Double) {
        guard stage == .playing else { return }
        remaining = max(0, remaining - seconds)
        if remaining == 0 { finish() }
    }

    var phoneState: [String: Any] {
        if stage == .finished {
            return ["pantalla": "fin", "juego": "rosco", "resumen": "\(correctCount) aciertos"]
        }
        return ["pantalla": "rosco", "letra": currentItem.letra, "regla": rule]
    }

    private mutating func advance() {
        guard let next = marks.indices.first(where: { $0 > current && marks[$0] == .pending }) ??
                marks.indices.first(where: { marks[$0] == .pending }) else {
            finish()
            return
        }
        current = next
    }

    private mutating func finish() {
        stage = .finished
        let best = UserDefaults.standard.integer(forKey: "gya_tvos_rosco_record")
        if correctCount > best { UserDefaults.standard.set(correctCount, forKey: "gya_tvos_rosco_record") }
    }

    private static func normalized(_ value: String) -> String {
        value.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "es_UY"))
            .uppercased().filter { !$0.isWhitespace }
    }
}
