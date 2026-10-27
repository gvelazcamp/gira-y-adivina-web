import Foundation

struct CienCategory: Decodable {
    let id: String
    let nombre: String
    let icono: String
}

struct CienAnswer: Decodable {
    let texto: String
    let puntos: Int
    let alias: [String]
}

struct CienQuestion: Decodable {
    let id: String
    let categoria: String
    let pregunta: String
    let respuestas: [CienAnswer]
}

private struct CienBank: Decodable {
    let categories: [CienCategory]
    let questions: [CienQuestion]

    enum CodingKeys: String, CodingKey {
        case categories = "CIEN_CATEGORIAS"
        case questions = "CIEN_PREGUNTAS"
    }
}

/// Reglas de la Sala TV web: tres preguntas, cada una vale x1/x2/x3.
struct CienGame {
    enum Stage: Equatable { case playing, reveal, finished }
    enum AnswerResult: Equatable { case ignored, correct, repeated, wrong, roundEnded }

    private let bank: CienBank
    private var usedThisGame = Set<String>()
    private(set) var roundIndex = 0
    private(set) var score = 0
    private(set) var errors = 0
    private(set) var opened = Set<Int>()
    private(set) var stage: Stage = .playing
    private(set) var question: CienQuestion
    private(set) var lastMessage = ""

    var category: CienCategory? { bank.categories.first { $0.id == question.categoria } }
    var multiplier: Int { roundIndex + 1 }
    var roundNumber: Int { roundIndex + 1 }

    init?() {
        guard let url = Bundle.main.url(forResource: "cien", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let bank = try? JSONDecoder().decode(CienBank.self, from: data),
              let first = bank.questions.first else { return nil }
        self.bank = bank
        self.question = first
        chooseQuestion()
    }

    mutating func answer(_ input: String) -> AnswerResult {
        guard stage == .playing else { return .ignored }
        let value = Self.normalized(input)
        guard !value.isEmpty else { return .ignored }
        let index = question.respuestas.firstIndex { answer in
            ([answer.texto] + answer.alias).contains { candidate in
                let other = Self.normalized(candidate)
                return !other.isEmpty && Self.sameWord(value, other)
            }
        }
        if let index {
            if opened.contains(index) {
                lastMessage = "\(question.respuestas[index].texto) ya está"
                return .repeated
            }
            opened.insert(index)
            score += question.respuestas[index].puntos * multiplier
            lastMessage = "¡\(question.respuestas[index].texto)! +\(question.respuestas[index].puntos * multiplier)"
            if opened.count == question.respuestas.count { endRound(); return .roundEnded }
            return .correct
        }
        errors += 1
        lastMessage = "✘ \(input.prefix(24))"
        if errors >= 3 { endRound(); return .roundEnded }
        return .wrong
    }

    mutating func nextRound() {
        guard stage == .reveal else { return }
        roundIndex += 1
        if roundIndex >= 3 {
            stage = .finished
            let old = UserDefaults.standard.integer(forKey: "gya_tvos_cien_record")
            if score > old { UserDefaults.standard.set(score, forKey: "gya_tvos_cien_record") }
        } else {
            chooseQuestion()
            stage = .playing
        }
    }

    var phoneState: [String: Any] {
        if stage == .finished {
            return ["pantalla": "fin", "juego": "cien", "resumen": "\(score) puntos"]
        }
        return ["pantalla": "cien", "puede": stage == .playing, "pregunta": question.pregunta]
    }

    private mutating func endRound() {
        stage = .reveal
        opened = Set(question.respuestas.indices)
    }

    private mutating func chooseQuestion() {
        var old = Set(UserDefaults.standard.stringArray(forKey: "gya_tvos_cien_usadas") ?? [])
        var available = bank.questions.filter { !old.contains($0.id) && !usedThisGame.contains($0.id) }
        if available.isEmpty {
            old = usedThisGame
            available = bank.questions.filter { !usedThisGame.contains($0.id) }
        }
        guard let chosen = available.randomElement() else { return }
        question = chosen
        old.insert(chosen.id)
        usedThisGame.insert(chosen.id)
        UserDefaults.standard.set(Array(old), forKey: "gya_tvos_cien_usadas")
        opened.removeAll()
        errors = 0
        lastMessage = ""
    }

    private static func normalized(_ text: String) -> String {
        text.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "es_UY"))
            .uppercased().filter { $0.isLetter || $0.isNumber }
    }

    private static func forms(_ text: String) -> Set<String> {
        var values: Set<String> = [text]
        if text.count > 4 && text.hasSuffix("CES") { values.insert(String(text.dropLast(3)) + "Z") }
        if text.count > 3 && text.hasSuffix("ES") {
            values.insert(String(text.dropLast(2)))
            values.insert(String(text.dropLast()))
        } else if text.count > 2 && text.hasSuffix("S") {
            values.insert(String(text.dropLast()))
        }
        return values
    }

    private static func sameWord(_ a: String, _ b: String) -> Bool {
        !forms(a).isDisjoint(with: forms(b))
    }
}
