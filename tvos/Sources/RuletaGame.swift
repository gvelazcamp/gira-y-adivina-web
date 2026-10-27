import Foundation

struct RuletaPhrase: Decodable {
    let c: String
    let t: String
    let p: String?
}
private struct RuletaBank: Decodable { let phrases: [RuletaPhrase] }

struct RuletaSegment {
    let value: Int
    let kind: String

    var title: String {
        switch kind {
        case "QUIEBRA": return "QUIEBRA"
        case "PIERDE": return "PIERDE TURNO"
        case "COMODIN": return "COMODÍN"
        case "X2": return "x2"
        default: return "$\(value)"
        }
    }
}

/// Native Sala TV host. Rules are based on the site's 24-segment Ruleta:
/// 3 normal rounds, a toss-up after round 2, and a TV bonus after round 3.
/// Account/shop powerups and online rankings remain exclusively in the web game.
struct RuletaGame {
    enum Stage: String {
        case spin = "girar", spinning = "girando", consonant = "consonante", vowel = "vocal"
        case passing = "pasando", roundEnd = "ronda_fin"
        case toss = "tossup", tossEnd = "toss_fin"
        case bonus = "bonus_resolver", bonusEnd = "bonus_fin"
        case finished = "fin"
    }

    static let wheel: [RuletaSegment] = [
        .init(value: 500, kind: ""), .init(value: 150, kind: ""), .init(value: 900, kind: ""),
        .init(value: 0, kind: "COMODIN"), .init(value: 400, kind: ""),
        .init(value: 0, kind: "PIERDE"), .init(value: 600, kind: ""),
        .init(value: 200, kind: ""), .init(value: 750, kind: ""),
        .init(value: 300, kind: ""), .init(value: 0, kind: "QUIEBRA"),
        .init(value: 350, kind: ""), .init(value: 1000, kind: ""),
        .init(value: 250, kind: ""), .init(value: 450, kind: ""),
        .init(value: 0, kind: "X2"), .init(value: 0, kind: "PIERDE"),
        .init(value: 550, kind: ""), .init(value: 300, kind: ""),
        .init(value: 800, kind: ""), .init(value: 200, kind: ""),
        .init(value: 0, kind: "QUIEBRA"), .init(value: 650, kind: ""), .init(value: 400, kind: "")
    ]
    static let vowels = Set("AEIOU")
    static let alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"

    let players: [TVPlayer]
    private let bank: [RuletaPhrase]
    private var seen = Set<String>()
    private(set) var stage: Stage = .spin
    private(set) var round = 0
    private(set) var turn = 0
    private(set) var phrase = ""
    private(set) var category = ""
    private(set) var opened = Set<Character>()
    private(set) var used = Set<Character>()
    private(set) var money = [String: Int]()
    private(set) var roundMoney = [String: Int]()
    private(set) var roundsWon = [String: Int]()
    private(set) var currentValue = 0
    private(set) var doubleNext = false
    private(set) var message = ""
    private(set) var segmentIndex: Int?
    private(set) var wheelAngle = 0.0
    private(set) var lastPrize = ""
    private(set) var turnRemaining = 25.0
    private(set) var specialRemaining = 0.0
    private(set) var blocked = Set<String>()
    private(set) var submittedBonus = Set<String>()
    private(set) var bonusWinners = Set<String>()
    private var pendingIndex = 0
    private var wait = 0.0
    private var badLast = false
    private var spinCount = 0
    private var tossPlayed = false
    private var finished = false

    var currentPlayer: TVPlayer { players[turn] }
    var hasVowel: Bool {
        phrase.contains { Self.vowels.contains($0) && !used.contains($0) }
    }
    var consonantsLeft: Int {
        Set(phrase.filter { $0.isLetter && !Self.vowels.contains($0) }).subtracting(used).count
    }
    var maskedRows: [[String]] {
        // A square is used per letter, while spaces/punctuation remain visible.
        phrase.split(separator: " ", omittingEmptySubsequences: false).map { word in
            word.map { character in
                (!character.isLetter || opened.contains(character)) ? String(character) : " "
            }
        }
    }
    var fullMask: String {
        phrase.map { c in
            !c.isLetter || opened.contains(c) ? String(c) : "_"
        }.joined()
    }
    var endRanking: [TVPlayer] {
        players.sorted { a, b in
            let sa = money[a.pid, default: 0], sb = money[b.pid, default: 0]
            return sa == sb ? roundsWon[a.pid, default: 0] > roundsWon[b.pid, default: 0] : sa > sb
        }
    }

    init?(players: [TVPlayer]) {
        guard players.count >= 2,
              let url = Bundle.main.url(forResource: "ruleta", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let bank = try? JSONDecoder().decode(RuletaBank.self, from: data),
              !bank.phrases.isEmpty else { return nil }
        self.players = Array(players.prefix(6))
        self.bank = bank.phrases
        for player in self.players {
            money[player.pid] = 0
            roundMoney[player.pid] = 0
            roundsWon[player.pid] = 0
        }
        turn = Int.random(in: 0..<self.players.count)
        startNormalRound()
    }

    /// One caller/timer at 0.2-second intervals; returns whether the broadcast must run.
    mutating func tick(_ seconds: Double) -> Bool {
        switch stage {
        case .spin, .consonant, .vowel:
            turnRemaining = max(0, turnRemaining - seconds)
            if turnRemaining <= 0 {
                message = "\(currentPlayer.name) se quedó sin tiempo."
                passing()
                return true
            }
        case .spinning:
            wait -= seconds
            if wait <= 0 { applySpin(); return true }
        case .passing:
            wait -= seconds
            if wait <= 0 { nextTurn(); return true }
        case .roundEnd:
            wait -= seconds
            if wait <= 0 { nextAfterRound(); return true }
        case .toss:
            specialRemaining = max(0, specialRemaining - seconds)
            if specialRemaining <= 0 {
                revealAll()
                message = "Se terminó la Prueba de Velocidad."
                stage = .tossEnd
                wait = 3
                return true
            }
            if Int(specialRemaining * 5) % 4 == 0 {
                // Reveal 1 new letter approximately every 0.8 seconds.
                let hidden = Set(phrase.filter { $0.isLetter }).subtracting(opened)
                if let c = hidden.randomElement() {
                    opened.insert(c)
                    return true
                }
            }
        case .tossEnd:
            wait -= seconds
            if wait <= 0 { startNormalRound(); return true }
        case .bonus:
            specialRemaining = max(0, specialRemaining - seconds)
            if specialRemaining <= 0 || submittedBonus.count == players.count {
                revealAll()
                stage = .bonusEnd
                wait = 3.5
                message = bonusWinners.isEmpty ? "Nadie acertó la Ronda Bonus." :
                    "¡Bonus! \(bonusWinners.count) jugador(es) ganaron $2000."
                return true
            }
        case .bonusEnd:
            wait -= seconds
            if wait <= 0 { stage = .finished; finished = true; return true }
        case .finished: break
        }
        return false
    }

    mutating func act(_ event: [String: Any], pid: String) -> Bool {
        guard players.contains(where: { $0.pid == pid }),
              let action = event["a"] as? String else { return false }
        let isCurrent = currentPlayer.pid == pid

        if stage == .toss, action == "resolver",
           !blocked.contains(pid), let text = event["txt"] as? String {
            guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
            if Self.normalize(text) == Self.normalize(phrase) {
                let reward = max(300, Int((300 + 1200 * (specialRemaining / 20)) / 50) * 50)
                money[pid, default: 0] += reward
                roundsWon[pid, default: 0] += 1
                turn = players.firstIndex(where: { $0.pid == pid }) ?? turn
                revealAll()
                stage = .tossEnd
                wait = 3.5
                message = "¡\(currentPlayer.name) ganó $\(reward) en Velocidad!"
            } else {
                blocked.insert(pid)
                message = "\(players.first(where: { $0.pid == pid })?.name ?? "Jugador") no acertó."
            }
            return true
        }
        if stage == .bonus, action == "resolver",
           !submittedBonus.contains(pid), let text = event["txt"] as? String {
            guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
            submittedBonus.insert(pid)
            if Self.normalize(text) == Self.normalize(phrase) {
                money[pid, default: 0] += 2000
                bonusWinners.insert(pid)
                message = "¡\(players.first(where: { $0.pid == pid })?.name ?? "Jugador") acertó el bonus!"
            }
            return true
        }

        guard isCurrent else { return false }
        if action == "girar", stage == .spin {
            guard consonantsLeft > 0 else {
                message = "No quedan consonantes. Comprá una vocal o resolvé."
                return true
            }
            spin()
            return true
        }
        if action == "comprar_vocal", stage == .spin,
           roundMoney[pid, default: 0] >= 250, hasVowel {
            roundMoney[pid, default: 0] -= 250
            stage = .vowel
            turnRemaining = 25
            message = "Vocal comprada por $250. Elegí una."
            return true
        }
        if action == "letra", (stage == .consonant || stage == .vowel),
           let text = event["l"] as? String, text.count == 1,
           let letter = Self.normalize(text).first,
           Self.alphabet.contains(letter), !used.contains(letter) {
            let isVowel = Self.vowels.contains(letter)
            guard (stage == .vowel) == isVowel else { return false }
            used.insert(letter)
            let hits = phrase.filter { $0 == letter }.count
            if hits > 0 {
                opened.insert(letter)
                if !isVowel {
                    roundMoney[pid, default: 0] += currentValue * hits * (doubleNext ? 2 : 1)
                    doubleNext = false
                }
                message = "¡Hay \(hits) \(letter)! Seguís jugando."
                if fullyOpened() { winRound(); return true }
                stage = .spin
                currentValue = 0
                turnRemaining = 25
            } else {
                doubleNext = false
                message = "No hay \(letter). Pasa el turno."
                passing()
            }
            return true
        }
        if action == "resolver",
           [Stage.spin, .consonant, .vowel].contains(stage),
           let answer = event["txt"] as? String,
           !answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if Self.normalize(answer) == Self.normalize(phrase) {
                revealAll()
                winRound()
            } else {
                message = "No era la frase. Pasa el turno."
                passing()
            }
            return true
        }
        return false
    }

    var phoneState: [String: Any] {
        let playerStates: [[String: Any]] = players.map { player in
            [
                "pid": player.pid, "n": player.name,
                "tot": money[player.pid, default: 0],
                "ronda": roundMoney[player.pid, default: 0],
                "rg": roundsWon[player.pid, default: 0]
            ]
        }
        let stageForPhone = stage.rawValue
        return [
            "pantalla": "ruleta_nativa", "fase": stageForPhone,
            "r": round, "cat": category, "mask": fullMask,
            "turno": turn, "jug": playerStates, "valor": currentValue,
            "usadas": used.map(String.init).sorted(),
            "cons": consonantsLeft, "hayVoc": hasVowel,
            "seg": (stage == .toss || stage == .bonus ? Int(ceil(specialRemaining)) :
                        Int(ceil(turnRemaining))),
            "mensaje": message,
            "doble": doubleNext,
            "bloqueados": Array(blocked),
            "bonusListos": Array(submittedBonus),
            "premio": lastPrize,
            "puede": !finished
        ]
    }

    private mutating func choosePhrase() {
        let all = bank.filter { !seen.contains($0.t) }
        if all.isEmpty { seen.removeAll() }
        let pool = all.isEmpty ? bank : all
        let chosen = pool.randomElement() ?? bank[0]
        seen.insert(chosen.t)
        phrase = chosen.t.folding(options: [.diacriticInsensitive, .caseInsensitive],
                                    locale: Locale(identifier: "es_UY")).uppercased()
        category = chosen.c
        opened.removeAll()
        used.removeAll()
        currentValue = 0
        doubleNext = false
        segmentIndex = nil
        lastPrize = ""
    }

    private mutating func startNormalRound() {
        round += 1
        choosePhrase()
        for p in players { roundMoney[p.pid] = 0 }
        turnRemaining = 25
        stage = .spin
        message = "Ronda \(round)/3 · Juega \(currentPlayer.name). ¡Girá!"
    }

    private mutating func spin() {
        var index = Int.random(in: 0..<Self.wheel.count)
        let bad = Self.wheel[index].kind == "PIERDE" || Self.wheel[index].kind == "QUIEBRA"
        if bad && (spinCount == 0 || badLast) {
            let safe = Self.wheel.indices.filter {
                Self.wheel[$0].kind != "PIERDE" && Self.wheel[$0].kind != "QUIEBRA"
            }
            index = safe.randomElement() ?? 0
        }
        badLast = ["PIERDE", "QUIEBRA"].contains(Self.wheel[index].kind)
        spinCount += 1
        pendingIndex = index
        segmentIndex = nil
        lastPrize = ""
        let sector = 360.0 / Double(Self.wheel.count)
        let current = wheelAngle.truncatingRemainder(dividingBy: 360)
        let destination = (360 - (Double(index) + 0.5) * sector)
        wheelAngle += 360 * 5 + ((destination - current + 360).truncatingRemainder(dividingBy: 360))
        stage = .spinning
        wait = 3
        message = "¡La ruleta está girando!"
    }

    private mutating func applySpin() {
        segmentIndex = pendingIndex
        let segment = Self.wheel[pendingIndex]
        lastPrize = segment.title
        switch segment.kind {
        case "QUIEBRA":
            roundMoney[currentPlayer.pid] = 0
            message = "¡QUIEBRA! \(currentPlayer.name) pierde el dinero de la ronda."
            passing()
        case "PIERDE":
            message = "¡PIERDE TURNO! Sigue otro jugador."
            passing()
        case "COMODIN":
            let unrevealed = Set(phrase.filter { $0.isLetter }).subtracting(opened)
            let consonants = unrevealed.filter { !Self.vowels.contains($0) }
            if let letter = (consonants.isEmpty ? Array(unrevealed) : Array(consonants)).randomElement() {
                opened.insert(letter)
                used.insert(letter)
                message = "¡COMODÍN! Se reveló la \(letter)."
                if fullyOpened() { winRound(); return }
            }
            stage = .spin
            turnRemaining = 25
        case "X2":
            doubleNext = true
            stage = .spin
            turnRemaining = 25
            message = "¡x2! La próxima consonante acertada paga doble. Volvé a girar."
        default:
            currentValue = segment.value
            stage = .consonant
            turnRemaining = 25
            message = "Salió $\(currentValue). Elegí una consonante."
        }
    }

    private mutating func passing() {
        stage = .passing
        wait = 1.5
        currentValue = 0
        doubleNext = false
    }
    private mutating func nextTurn() {
        turn = (turn + 1) % players.count
        stage = .spin
        turnRemaining = 25
        message = "Le toca a \(currentPlayer.name)."
    }
    private mutating func winRound() {
        let pid = currentPlayer.pid
        let reward = roundMoney[pid, default: 0]
        money[pid, default: 0] += reward
        roundsWon[pid, default: 0] += 1
        stage = .roundEnd
        wait = 3.5
        message = "¡\(currentPlayer.name) resolvió la frase y ganó $\(reward)!"
    }
    private mutating func nextAfterRound() {
        if round == 2 && !tossPlayed {
            tossPlayed = true
            choosePhrase()
            stage = .toss
            specialRemaining = 20
            blocked.removeAll()
            message = "¡PRUEBA DE VELOCIDAD! Todos pueden resolver."
        } else if round >= 3 {
            choosePhrase()
            opened = Set("RSTLNE")
            used = Set("RSTLNE")
            specialRemaining = 20
            stage = .bonus
            submittedBonus.removeAll()
            bonusWinners.removeAll()
            message = "¡RONDA BONUS! Todos resuelven con R, S, T, L, N y E."
        } else {
            startNormalRound()
        }
    }
    private mutating func revealAll() {
        opened.formUnion(phrase.filter { $0.isLetter })
    }
    private func fullyOpened() -> Bool {
        Set(phrase.filter { $0.isLetter }).isSubset(of: opened)
    }
    private static func normalize(_ text: String) -> String {
        // Same accent-insensitive comparison used by the web game; spaces and punctuation
        // do not confer an advantage to longer/shorter answers.
        text.folding(options: [.diacriticInsensitive, .caseInsensitive],
                     locale: Locale(identifier: "es_UY")).uppercased()
            .filter { $0.isLetter || $0.isNumber }
    }
}
