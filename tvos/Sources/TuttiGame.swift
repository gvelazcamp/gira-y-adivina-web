import Foundation

struct TuttiPending {
    let kind: String
    let requester: String
    let player: String
    let index: Int

    var phoneState: [String: Any] {
        ["tipo": kind, "solicita": requester, "a": player, "i": index]
    }
}

struct TuttiRound {
    let letter: String
    let scores: [String: Int]

    var phoneState: [String: Any] { ["letra": letter, "puntos": scores] }
}

/// Tutti Frutti for native tvOS. The television owns the game state;
/// all participating phones submit answers through the existing MQTT room.
struct TuttiGame {
    enum Stage: String {
        case playing = "jugando"
        case cut = "cortada"
        case validating = "validando"
        case result = "resultado"
        case finished = "fin"
    }

    private static let alphabet = Array("ABCDEFGHIJLMNOPRSTUV").map(String.init)
    private static let defaultCategories = [
        "Nombre", "Apellido", "País o ciudad", "Comida", "Animal", "Cosa"
    ]
    private static let categoryKeys: [String: String] = [
        "Nombre": "nombre", "Apellido": "apellido", "País o ciudad": "lugar",
        "Comida": "comida", "Animal": "animal", "Cosa": "cosa"
    ]

    let players: [TVPlayer]
    let categories = defaultCategories
    private let bank: [String: Set<String>]

    private(set) var stage: Stage = .playing
    private(set) var round = 0
    private(set) var letter = ""
    private(set) var remaining = 90.0
    private(set) var winner: String?
    private(set) var progress = [String: Bool]()
    private(set) var submitted = [String: [String]]()
    private(set) var marks = [String: [Bool]]()
    private(set) var bonus = [String: Int]()
    private(set) var canceled = Set<String>()
    private(set) var pending = [String: TuttiPending]()
    private(set) var resolved = Set<String>()
    private(set) var totals = [String: Int]()
    private(set) var roundWins = [String: Int]()
    private(set) var history = [TuttiRound]()

    private var cutElapsed = 0.0
    private var validateElapsed = 0.0

    init?(players: [TVPlayer]) {
        guard players.count >= 2,
              let url = Bundle.main.url(forResource: "tutti", withExtension: "json"),
              let contents = try? Data(contentsOf: url),
              let json = try? JSONDecoder().decode([String: [String: String]].self, from: contents),
              let lists = json["listas"] else { return nil }

        self.players = players
        bank = lists.mapValues { text in
            Set(text.split(separator: ",").map { Self.normalize(String($0)) })
        }
        for player in players {
            totals[player.pid] = 0
            roundWins[player.pid] = 0
        }
        startRound()
    }

    var leader: String? {
        players.sorted {
            let leftWins = roundWins[$0.pid, default: 0], rightWins = roundWins[$1.pid, default: 0]
            return leftWins == rightWins ?
                totals[$0.pid, default: 0] > totals[$1.pid, default: 0] : leftWins > rightWins
        }.first?.pid
    }

    var orderedPlayers: [TVPlayer] {
        players.sorted {
            let wins0 = roundWins[$0.pid, default: 0], wins1 = roundWins[$1.pid, default: 0]
            return wins0 == wins1 ?
                totals[$0.pid, default: 0] > totals[$1.pid, default: 0] : wins0 > wins1
        }
    }

    var hasPending: Bool { !pending.isEmpty }

    var scores: [String: [Int]] {
        var result = Dictionary(uniqueKeysWithValues:
            players.map { ($0.pid, Array(repeating: 0, count: categories.count)) })
        for index in categories.indices {
            let valid = players.filter { player in
                let key = Self.key(player.pid, index)
                let word = submitted[player.pid]?[index] ?? ""
                return !word.isEmpty && !canceled.contains(key) &&
                    ((marks[player.pid]?[index] ?? false) || bonus[key, default: 0] > 0)
            }
            for player in valid {
                let word = Self.normalize(submitted[player.pid]?[index] ?? "")
                let duplicate = valid.contains { other in
                    other.pid != player.pid &&
                        Self.normalize(submitted[other.pid]?[index] ?? "") == word
                }
                let key = Self.key(player.pid, index)
                let approved = marks[player.pid]?[index] ?? false
                result[player.pid]?[index] = !approved && bonus[key] != nil ? bonus[key]! :
                    (valid.count == 1 ? 20 : (duplicate ? 5 : 10))
            }
        }
        return result
    }

    func score(for pid: String) -> Int { (scores[pid] ?? []).reduce(0, +) }
    func isCanceled(_ pid: String, _ index: Int) -> Bool { canceled.contains(Self.key(pid, index)) }
    func isDoubtful(_ pid: String, _ index: Int) -> Bool {
        let word = submitted[pid]?[index] ?? ""
        return !word.isEmpty && !(marks[pid]?[index] ?? false) &&
            bonus[Self.key(pid, index)] == nil && !isCanceled(pid, index)
    }
    func isPending(_ pid: String, _ index: Int) -> Bool {
        pending.values.contains { $0.player == pid && $0.index == index }
    }

    /// Called every half-second by the TV host. Returns true on stage transitions.
    mutating func tick(_ seconds: Double) -> Bool {
        switch stage {
        case .playing:
            remaining = max(0, remaining - seconds)
            if remaining == 0 {
                cut(winner: nil, words: nil)
                return true
            }
        case .cut:
            cutElapsed += seconds
            if cutElapsed >= 4.2 || (players.allSatisfy { submitted[$0.pid] != nil } && cutElapsed >= 1.7) {
                stage = .validating
                validateElapsed = 0
                return true
            }
        case .validating:
            validateElapsed += seconds
            if validateElapsed >= 1.0 {
                validate()
                return true
            }
        case .result, .finished: break
        }
        return false
    }

    /// A participant may submit and appeal without holding the menu controller.
    mutating func act(_ message: [String: Any], controllerPID: String?) -> Bool {
        guard let pid = message["pid"] as? String,
              players.contains(where: { $0.pid == pid }),
              let action = message["a"] as? String else { return false }
        if action == "siguiente", pid == controllerPID, stage == .result, pending.isEmpty {
            closeRound()
            return true
        }
        guard let requestRound = message["r"] as? Int, requestRound == round else { return false }

        if action == "progreso", stage == .playing {
            let complete = message["completo"] as? Bool ?? false
            if progress[pid] != complete {
                progress[pid] = complete
                return true
            }
            return false
        }
        if action == "basta", stage == .playing,
           let words = message["respuestas"] as? [String] {
            let cleaned = clean(words)
            guard cleaned.allSatisfy({ !$0.isEmpty }) else { return false }
            cut(winner: pid, words: cleaned)
            return true
        }
        if action == "respuesta", stage == .cut, submitted[pid] == nil,
           let words = message["respuestas"] as? [String] {
            submitted[pid] = clean(words)
            return true
        }
        guard stage == .result,
              let index = message["i"] as? Int, categories.indices.contains(index),
              let affected = message["aid"] as? String,
              players.contains(where: { $0.pid == affected }) else {
            // A decision specifies the pending ID, not its category and player.
            if action == "decidir", stage == .result { return decide(message, voter: pid) }
            return false
        }
        let key = Self.key(affected, index)

        if action == "apelar", affected == pid,
           !(submitted[pid]?[index] ?? "").isEmpty,
           isDoubtful(pid, index), !isPending(pid, index),
           !resolved.contains("apelar:" + key) {
            pending["apelar:" + key] = TuttiPending(kind: "apelar", requester: pid,
                                                    player: pid, index: index)
            return true
        }
        if action == "anular", affected != pid, score(for: affected) > 0,
           (scores[affected]?[index] ?? 0) > 0, !isPending(affected, index),
           !resolved.contains("anular:" + key) {
            pending["anular:" + key] = TuttiPending(kind: "anular", requester: pid,
                                                    player: affected, index: index)
            return true
        }
        if action == "devolver", pid == controllerPID, canceled.contains(key) {
            canceled.remove(key)
            resolved.remove("anular:" + key)
            return true
        }
        if action == "decidir" { return decide(message, voter: pid) }
        return false
    }

    var phoneState: [String: Any] {
        let roster = players.map { ["pid": $0.pid, "n": $0.name] }
        var state: [String: Any] = [
            "pantalla": "tutti", "fase": stage.rawValue, "r": round,
            "letra": letter, "cats": categories, "jug": roster,
            "ganador": winner.map { $0 as Any } ?? NSNull(),
            "resta": Int(ceil(remaining * 1000)),
            "recibidas": Dictionary(uniqueKeysWithValues: submitted.keys.map { ($0, true) })
        ]
        if stage == .result {
            state["respuestas"] = submitted
            state["marcas"] = marks
            state["extra"] = bonus
            state["anuladas"] = Dictionary(uniqueKeysWithValues: canceled.map { ($0, true) })
            state["pendientes"] = pending.mapValues { $0.phoneState }
            state["resueltas"] = Dictionary(uniqueKeysWithValues: resolved.map { ($0, true) })
            state["puntos"] = scores
            state["totales"] = totals
            state["ganadas"] = roundWins
        } else if stage == .finished {
            state["totales"] = totals
            state["ganadas"] = roundWins
            state["historial"] = history.map { $0.phoneState }
        }
        return state
    }

    private mutating func startRound() {
        round += 1
        var used = UserDefaults.standard.stringArray(forKey: "gya_tf_letras_usadas") ?? []
        var available = Self.alphabet.filter { !used.contains($0) }
        if available.isEmpty { used.removeAll(); available = Self.alphabet }
        letter = available.randomElement() ?? "A"
        used.append(letter)
        UserDefaults.standard.set(used, forKey: "gya_tf_letras_usadas")
        remaining = 90
        stage = .playing
        winner = nil
        cutElapsed = 0
        validateElapsed = 0
        progress.removeAll()
        submitted.removeAll()
        marks.removeAll()
        bonus.removeAll()
        canceled.removeAll()
        pending.removeAll()
        resolved.removeAll()
    }

    private mutating func cut(winner pid: String?, words: [String]?) {
        guard stage == .playing else { return }
        winner = pid
        stage = .cut
        cutElapsed = 0
        if let pid, let words {
            submitted[pid] = words
            progress[pid] = true
        }
    }

    private mutating func validate() {
        for player in players {
            let answers = submitted[player.pid] ??
                Array(repeating: "", count: categories.count)
            marks[player.pid] = categories.map { category in
                let index = categories.firstIndex(of: category) ?? 0
                let normalized = Self.normalize(answers[index])
                let bankKey = Self.categoryKeys[category] ?? ""
                return !normalized.isEmpty && (bank[bankKey]?.contains(normalized) ?? false)
            }
        }
        stage = .result
    }

    private mutating func closeRound() {
        let current = scores
        var roundScores = [String: Int]()
        for player in players {
            roundScores[player.pid] = (current[player.pid] ?? []).reduce(0, +)
        }
        history.append(TuttiRound(letter: letter, scores: roundScores))
        let best = roundScores.values.max() ?? 0
        for player in players {
            let value = roundScores[player.pid] ?? 0
            totals[player.pid, default: 0] += value
            if best > 0 && value == best { roundWins[player.pid, default: 0] += 1 }
        }
        if round == 3 {
            stage = .finished
        } else {
            startRound()
        }
    }

    private mutating func decide(_ message: [String: Any], voter: String) -> Bool {
        guard let id = message["id"] as? String,
              let petition = pending[id], petition.requester != voter else { return false }
        let key = Self.key(petition.player, petition.index)
        if petition.kind == "apelar" {
            guard let score = message["p"] as? Int, [0, 5, 10, 20].contains(score) else { return false }
            bonus[key] = score
        } else {
            guard let annul = message["v"] as? Bool else { return false }
            if annul { canceled.insert(key) }
        }
        pending.removeValue(forKey: id)
        resolved.insert(id)
        return true
    }

    private func clean(_ words: [String]) -> [String] {
        categories.indices.map { index in
            guard words.indices.contains(index) else { return "" }
            let filtered = String(words[index].unicodeScalars.filter {
                !CharacterSet.controlCharacters.contains($0)
            }.map(Character.init).prefix(30))
                .trimmingCharacters(in: .whitespacesAndNewlines)
            let normalized = Self.normalize(filtered)
            return normalized.count >= 2 && normalized.hasPrefix(letter) ? filtered : ""
        }
    }

    private static func key(_ pid: String, _ index: Int) -> String { "\(pid)|\(index)" }
    private static func normalize(_ word: String) -> String {
        word.folding(options: [.diacriticInsensitive, .caseInsensitive],
                     locale: Locale(identifier: "es_UY")).uppercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
