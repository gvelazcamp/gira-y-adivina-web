import Foundation

struct AhorcadoCategory: Decodable {
    let id: String
    let nombre: String
    let emoji: String
}

struct AhorcadoWord: Decodable {
    let categoria: String
    let palabra: String
}

private struct AhorcadoBank: Decodable {
    let categories: [AhorcadoCategory]
    let words: [AhorcadoWord]

    enum CodingKeys: String, CodingKey {
        case categories = "AHORCADO_CATEGORIAS"
        case words = "AHORCADO_DATOS"
    }
}

struct AhorcadoGame {
    enum Stage: Equatable { case spin, playing, reveal, finished }
    enum LetterResult: Equatable { case ignored, hit, miss, roundEnded }

    static let alphabet = "ABCDEFGHIJKLMNOPQRSTUVYZ"
    private let bank: AhorcadoBank
    private var usedThisGame = Set<String>()
    private(set) var word: AhorcadoWord
    private(set) var number = 0
    private(set) var points = 0
    private(set) var won = 0
    private(set) var errors = 0
    private(set) var used = Set<Character>()
    private(set) var stage: Stage = .spin

    var category: AhorcadoCategory? { bank.categories.first { $0.id == word.categoria } }
    var isSolved: Bool { word.palabra.allSatisfy { used.contains($0) } }

    init?() {
        guard let url = Bundle.main.url(forResource: "ahorcado", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let bank = try? JSONDecoder().decode(AhorcadoBank.self, from: data),
              let first = bank.words.first else { return nil }
        self.bank = bank
        self.word = first
        nextWord()
    }

    mutating func beginWord() {
        if stage == .spin { stage = .playing }
    }

    mutating func tryLetter(_ text: String) -> LetterResult {
        guard stage == .playing, text.count == 1, let letter = text.first,
              Self.alphabet.contains(letter), !used.contains(letter) else { return .ignored }
        used.insert(letter)
        if word.palabra.contains(letter) {
            if isSolved { endWord(wonWord: true); return .roundEnded }
            return .hit
        }
        errors += 1
        if errors >= 6 { endWord(wonWord: false); return .roundEnded }
        return .miss
    }

    mutating func nextWord() {
        guard number < 5 else {
            stage = .finished
            let best = UserDefaults.standard.integer(forKey: "gya_tvos_ahorcado_record")
            if points > best { UserDefaults.standard.set(points, forKey: "gya_tvos_ahorcado_record") }
            return
        }
        var old = Set(UserDefaults.standard.stringArray(forKey: "gya_tvos_ahorcado_usadas") ?? [])
        var available = bank.words.filter { !old.contains($0.palabra) && !usedThisGame.contains($0.palabra) }
        if available.isEmpty {
            old = usedThisGame
            available = bank.words.filter { !usedThisGame.contains($0.palabra) }
        }
        guard let chosen = available.randomElement() else { stage = .finished; return }
        word = chosen
        number += 1
        old.insert(chosen.palabra)
        usedThisGame.insert(chosen.palabra)
        UserDefaults.standard.set(Array(old), forKey: "gya_tvos_ahorcado_usadas")
        used.removeAll()
        errors = 0
        stage = .spin
    }

    var phoneState: [String: Any] {
        if stage == .finished {
            return ["pantalla": "fin", "juego": "ahorcado", "resumen": "\(points) puntos"]
        }
        return ["pantalla": "ahorcado", "usadas": used.map(String.init),
                "puede": stage == .playing, "letras": Self.alphabet]
    }

    private mutating func endWord(wonWord: Bool) {
        stage = .reveal
        if wonWord {
            won += 1
            points += 150 + 20 * (6 - errors)
        }
    }
}
