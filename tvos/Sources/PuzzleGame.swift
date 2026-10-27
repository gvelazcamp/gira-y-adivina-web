import Foundation

struct PuzzlePicture: Identifiable {
    let slug: String
    let category: String
    var id: String { slug }
    var name: String { slug.replacingOccurrences(of: "-", with: " ").capitalized }
}

/// Native tvOS tile-puzzle prototype sharing the original Sala TV phone protocol.
/// Puzzle pieces are rectangular tiles (rather than the browser's interlocking curves).
struct PuzzleGame {
    enum Stage: String { case config, juego, fin }
    static let catalogs: [String: [String]] = [
        "dibujo": ["dragon", "granja", "golosinas"],
        "aventura": ["piratas", "egipto", "vikingos"],
        "heroe": ["princesa-hielo", "chica-rayo", "super-veloz"],
        "ciudad": ["montevideo", "colonia", "buenos-aires"],
        "gigante": ["mercado-puerto", "valle-dragones", "biblioteca-magica"]
    ]
    static let categoryOrder = ["dibujo", "aventura", "heroe", "ciudad", "gigante"]
    static let sizes = [12, 25, 49, 70, 100, 150, 300, 500, 1000]
    private static let saveKey = "gya_tvos_puzzle_saved_v1"

    private(set) var stage: Stage = .config
    private(set) var category = "dibujo"
    private(set) var imageIndex = 0
    private(set) var count = 25
    private(set) var rotationEnabled = true
    private(set) var tileAtSlot = [Int]()
    private(set) var turns = [Int]()
    private(set) var owner: String?
    private(set) var selectedSlot: Int?
    private(set) var hoverSlot: Int?
    private(set) var elapsed = 0.0
    private(set) var zoom = 1.0
    private(set) var showGuide = false
    private(set) var showReference = false
    private(set) var saved = false
    private(set) var moves = 0
    private var ownerSilence = 0.0
    private var lastSlot: Int?
    private var persistElapsed = 0.0

    var imageList: [String] { Self.catalogs[category] ?? [] }
    var slug: String { imageList.indices.contains(imageIndex) ? imageList[imageIndex] : "dragon" }
    var validSizes: [Int] {
        if category == "gigante" { return [500, 1000] }
        if category == "aventura" { return [49, 70, 100, 150, 300] }
        return [12, 25, 49, 70, 100, 150, 300]
    }
    var columns: Int {
        switch count {
        case 12: return 4
        case 25: return 5
        case 49: return 7
        case 70: return 10
        case 100: return 10
        case 150: return 15
        case 300: return 20
        case 500: return 25
        case 1000: return 40
        default: return 5
        }
    }
    var rows: Int { count / columns }
    var solved: Int {
        guard tileAtSlot.count == count, turns.count == count else { return 0 }
        return tileAtSlot.indices.filter { $0 == tileAtSlot[$0] && turns[tileAtSlot[$0]] % 4 == 0 }.count
    }
    var percent: Int { count > 0 ? Int((Double(solved) / Double(count) * 100).rounded()) : 0 }
    var isComplete: Bool { solved == count && count > 0 && stage == .fin }
    var state: [String: Any] {
        ["n": stage == .config ? 0 : count, "pct": percent,
         "tiempo": Int(elapsed * 1000), "ganado": stage == .fin]
    }
    func phoneState(players: [TVPlayer]) -> [String: Any] {
        let name = players.first(where: { $0.pid == owner })?.name ?? "Alguien"
        return [
            "pantalla": "puzzle",
            "fase": stage.rawValue,
            "cat": category,
            "lista": imageList,
            "indice": imageIndex,
            "n": count,
            "rot": rotationEnabled,
            "guardado": saved,
            "listo": true,
            "estado": state,
            "dueno": owner.map { $0 as Any } ?? NSNull(),
            "nombreDueno": name,
            "jug": players.map { ["pid": $0.pid, "n": $0.name] }
        ]
    }

    init() {
        saved = UserDefaults.standard.data(forKey: Self.saveKey) != nil
    }

    /// Allows a controller to change configuration without corrupting an in-progress save.
    mutating func act(_ m: [String: Any], pid: String, controller: String?) -> Bool {
        guard let action = m["a"] as? String else { return false }
        if stage == .config && pid == controller {
            switch action {
            case "pz_categoria":
                guard let cat = m["cat"] as? String, Self.catalogs[cat] != nil else { return false }
                category = cat
                imageIndex = 0
                if !validSizes.contains(count) { count = validSizes.first ?? 25 }
                return true
            case "pz_imagen_elegir":
                let delta = m["delta"] as? Int ?? 0
                guard !imageList.isEmpty else { return false }
                imageIndex = (imageIndex + delta % imageList.count + imageList.count) % imageList.count
                return true
            case "pz_piezas":
                guard let proposed = m["n"] as? Int, validSizes.contains(proposed) else { return false }
                count = proposed
                return true
            case "pz_rotacion":
                rotationEnabled = m["rot"] as? Bool ?? false
                return true
            case "pz_inicio":
                newGame()
                return true
            case "pz_continuar":
                return restore()
            default: return false
            }
        }
        if action == "pz_config", pid == controller, stage != .config {
            if stage == .juego { persist() }
            owner = nil
            selectedSlot = nil
            hoverSlot = nil
            stage = .config
            saved = UserDefaults.standard.data(forKey: Self.saveKey) != nil
            return true
        }
        guard stage == .juego else { return false }

        let x = (m["x"] as? NSNumber)?.doubleValue ?? 0.5
        let y = (m["y"] as? NSNumber)?.doubleValue ?? 0.5
        guard x.isFinite, y.isFinite else { return false }
        let slot = slotFor(x: x, y: y)
        switch action {
        case "pz_bajar":
            guard owner == nil, let slot else { return false }
            owner = pid
            ownerSilence = 0
            selectedSlot = slot
            hoverSlot = slot
            lastSlot = slot
            return true
        case "pz_mover":
            guard owner == pid else { return false }
            ownerSilence = 0
            if let slot { hoverSlot = slot }
            return true
        case "pz_soltar":
            guard owner == pid else { return false }
            let target = slot ?? hoverSlot
            if let from = selectedSlot, let target, from != target {
                tileAtSlot.swapAt(from, target)
                moves += 1
            }
            selectedSlot = nil
            hoverSlot = nil
            owner = nil
            ownerSilence = 0
            if let target { lastSlot = target }
            finishIfSolved()
            persist()
            return true
        case "pz_girar":
            guard owner == nil || owner == pid, rotationEnabled else { return false }
            guard let spot = selectedSlot ?? slot ?? lastSlot,
                  tileAtSlot.indices.contains(spot) else { return false }
            let tileID = tileAtSlot[spot]
            turns[tileID] = (turns[tileID] + 1) % 4
            lastSlot = spot
            moves += 1
            finishIfSolved()
            persist()
            return true
        case "pz_acercar":
            zoom = min(2.25, zoom + 0.25)
            return true
        case "pz_alejar":
            zoom = max(1, zoom - 0.25)
            return true
        case "pz_encuadrar":
            zoom = 1
            return true
        case "pz_guia":
            showGuide.toggle()
            return true
        case "pz_imagen":
            showReference.toggle()
            return true
        default: return false
        }
    }

    mutating func pauseAndSave() { if stage == .juego { persist() } }

    mutating func tick(_ seconds: Double) -> Bool {
        guard stage == .juego else { return false }
        elapsed += seconds
        persistElapsed += seconds
        if owner != nil {
            ownerSilence += seconds
            if ownerSilence > 5 {
                owner = nil
                selectedSlot = nil
                hoverSlot = nil
                ownerSilence = 0
                return true
            }
        }
        if persistElapsed > 10 {
            persistElapsed = 0
            persist()
        }
        return false
    }

    private mutating func newGame() {
        guard Self.sizes.contains(count), imageList.indices.contains(imageIndex) else { return }
        tileAtSlot = Array(0..<count).shuffled()
        if tileAtSlot == Array(0..<count) && count >= 2 { tileAtSlot.swapAt(0, 1) }
        turns = (0..<count).map { _ in rotationEnabled ? Int.random(in: 0..<4) : 0 }
        elapsed = 0
        zoom = 1
        owner = nil
        selectedSlot = nil
        hoverSlot = nil
        lastSlot = nil
        showGuide = false
        showReference = false
        moves = 0
        stage = .juego
        persist()
    }

    private func slotFor(x: Double, y: Double) -> Int? {
        // Phone touchpad maps to the native puzzle board, not to the whole TV.
        // Zoom magnifies about the board center.
        let px = ((x - 0.5) / zoom + 0.5)
        let py = ((y - 0.5) / zoom + 0.5)
        guard px >= 0, px < 1, py >= 0, py < 1 else { return nil }
        let col = min(columns - 1, Int(px * Double(columns)))
        let row = min(rows - 1, Int(py * Double(rows)))
        return row * columns + col
    }

    private mutating func finishIfSolved() {
        if solved == count {
            stage = .fin
            owner = nil
            selectedSlot = nil
            hoverSlot = nil
            UserDefaults.standard.removeObject(forKey: Self.saveKey)
            saved = false
        }
    }

    private mutating func persist() {
        guard stage == .juego else { return }
        let payload: [String: Any] = [
            "cat": category, "index": imageIndex, "n": count,
            "rot": rotationEnabled, "slots": tileAtSlot,
            "turns": turns, "elapsed": elapsed, "moves": moves
        ]
        guard JSONSerialization.isValidJSONObject(payload),
              let data = try? JSONSerialization.data(withJSONObject: payload) else { return }
        UserDefaults.standard.set(data, forKey: Self.saveKey)
        saved = true
    }

    private mutating func restore() -> Bool {
        guard let data = UserDefaults.standard.data(forKey: Self.saveKey),
              let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let cat = payload["cat"] as? String, let imgs = Self.catalogs[cat],
              let index = payload["index"] as? Int, imgs.indices.contains(index),
              let n = payload["n"] as? Int, Self.sizes.contains(n),
              let tiles = payload["slots"] as? [Int], tiles.count == n,
              Set(tiles) == Set(0..<n),
              let rotValues = payload["turns"] as? [Int], rotValues.count == n,
              rotValues.allSatisfy({ (0...3).contains($0) }) else { return false }
        category = cat
        imageIndex = index
        count = n
        rotationEnabled = payload["rot"] as? Bool ?? true
        tileAtSlot = tiles
        turns = rotValues
        elapsed = (payload["elapsed"] as? Double ?? 0).isFinite ?
            max(0, payload["elapsed"] as? Double ?? 0) : 0
        moves = max(0, payload["moves"] as? Int ?? 0)
        zoom = 1
        owner = nil
        selectedSlot = nil
        hoverSlot = nil
        stage = .juego
        saved = true
        return true
    }
}
