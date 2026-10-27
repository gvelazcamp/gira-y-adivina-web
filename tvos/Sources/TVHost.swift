import Combine
import Foundation

struct TVPlayer: Identifiable {
    let pid: String
    var name: String
    var id: String { pid }
}

@MainActor
final class TVHost: ObservableObject {
    enum Screen: Equatable { case home, menu, cien, ahorcado, rosco, tutti, ruleta, puzzle }

    @Published private(set) var screen: Screen = .home
    @Published private(set) var code = ""
    @Published private(set) var players = [TVPlayer]()
    @Published private(set) var controllerPID: String?
    @Published private(set) var connectedBrokers = 0
    @Published private(set) var cien: CienGame?
    @Published private(set) var ahorcado: AhorcadoGame?
    @Published private(set) var rosco: RoscoGame?
    @Published private(set) var tutti: TuttiGame?
    @Published private(set) var ruleta: RuletaGame?
    @Published private(set) var puzzle: PuzzleGame?
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
    private var tuttiTick: Task<Void, Never>?
    private var ruletaTick: Task<Void, Never>?
    private var puzzleTick: Task<Void, Never>?
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
                guard !Task.isCancelled else { return }
                if var game = self.rosco {
                    game.tick(2.5)
                    self.rosco = game
                }
            }
        }
    }

    func back() {
        switch screen {
        case .cien, .ahorcado, .rosco, .tutti, .ruleta, .puzzle: showMenu()
        case .menu: stop()
        case .home: break
        }
    }

    func stop() {
        heartbeat?.cancel(); heartbeat = nil
        nextRoundTask?.cancel(); nextRoundTask = nil
        spinTask?.cancel(); spinTask = nil
        tuttiTick?.cancel(); tuttiTick = nil
        ruletaTick?.cancel(); ruletaTick = nil
        puzzleTick?.cancel(); puzzleTick = nil
        links.forEach { $0.close() }; links.removeAll()
        connectedBrokers = 0
        players.removeAll()
        controllerPID = nil
        cien = nil
        ahorcado = nil
        rosco = nil
        tutti = nil
        ruleta = nil
        puzzle = nil
        screen = .home
    }

    func showMenu() {
        nextRoundTask?.cancel(); nextRoundTask = nil
        spinTask?.cancel(); spinTask = nil
        tuttiTick?.cancel(); tuttiTick = nil
        ruletaTick?.cancel(); ruletaTick = nil
        puzzleTick?.cancel(); puzzleTick = nil
        if var active = puzzle { active.pauseAndSave() }
        cien = nil
        ahorcado = nil
        rosco = nil
        tutti = nil
        ruleta = nil
        puzzle = nil
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

    func startRosco() {
        guard screen == .menu else { return }
        guard let game = RoscoGame() else { errorMessage = "No se pudo cargar El Rosco"; return }
        rosco = game
        screen = .rosco
        errorMessage = ""
        broadcast()
    }


    func startTutti() {
        guard screen == .menu else { return }
        guard players.count >= 2 else {
            errorMessage = "Tutti Frutti necesita al menos 2 celulares"
            return
        }
        guard let game = TuttiGame(players: players) else {
            errorMessage = "No se pudieron cargar los datos de Tutti Frutti"
            return
        }
        tutti = game
        screen = .tutti
        errorMessage = ""
        broadcast()
        tuttiTick?.cancel()
        tuttiTick = Task { [weak self] in
            var ticks = 0
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 500_000_000)
                guard !Task.isCancelled, let self, self.screen == .tutti,
                      var game = self.tutti else { return }
                let changedStage = game.tick(0.5)
                self.tutti = game
                ticks += 1
                if changedStage || ticks % 2 == 0 { self.broadcast() }
            }
        }
    }


    func startRuleta() {
        guard screen == .menu else { return }
        guard (2...6).contains(players.count) else {
            errorMessage = "La Ruleta necesita de 2 a 6 celulares."
            return
        }
        guard let game = RuletaGame(players: players) else {
            errorMessage = "No se pudo cargar el banco original de frases."
            return
        }
        ruleta = game
        screen = .ruleta
        errorMessage = ""
        broadcast()
        ruletaTick?.cancel()
        ruletaTick = Task { [weak self] in
            var ticks = 0
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 200_000_000)
                guard !Task.isCancelled, let self, self.screen == .ruleta,
                      var game = self.ruleta else { return }
                let changed = game.tick(0.2)
                self.ruleta = game
                ticks += 1
                if changed || ticks % 5 == 0 { self.broadcast() }
            }
        }
    }

    var puzzleOwnerName: String {
        guard let pid = puzzle?.owner else { return "Alguien" }
        return players.first(where: { $0.pid == pid })?.name ?? "Alguien"
    }

    func startPuzzle() {
        guard screen == .menu else { return }
        guard !players.isEmpty else {
            errorMessage = "Conectá al menos un celular para jugar Puzzle."
            return
        }
        puzzle = PuzzleGame()
        screen = .puzzle
        errorMessage = ""
        broadcast()
        puzzleTick?.cancel()
        puzzleTick = Task { [weak self] in
            var ticks = 0
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 500_000_000)
                guard !Task.isCancelled, let self, self.screen == .puzzle,
                      var game = self.puzzle else { return }
                let changed = game.tick(0.5)
                self.puzzle = game
                ticks += 1
                if changed || ticks % 5 == 0 { self.broadcast() }
            }
        }
    }

    /// Used both by the tvOS remote and by MQTT gestures from phones.
    func puzzleAction(_ action: String, _ fields: [String: Any] = [:]) {
        guard screen == .puzzle, var game = puzzle else { return }
        let pid = controllerPID ?? players.first?.pid ?? ""
        var event = fields
        event["a"] = action
        if game.act(event, pid: pid, controller: pid) {
            puzzle = game
            broadcast()
        }
    }

    func passRosco() {
        guard screen == .rosco, var game = rosco else { return }
        game.pass()
        rosco = game
        broadcast()
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
            if screen == .tutti, let game = tutti,
               !game.players.contains(where: { $0.pid == pid }) { return }
            controllerPID = pid
            broadcast()
        case "accion":
            guard players.contains(where: { $0.pid == pid }) else { return }
            let action = object["a"] as? String ?? ""
            let wheelTurn = screen == .ruleta &&
                (ruleta?.currentPlayer.pid == pid) &&
                !["menu", "otra", "elegir"].contains(action)
            let wheelShared = screen == .ruleta &&
                (ruleta?.stage == .toss || ruleta?.stage == .bonus) &&
                action == "resolver" &&
                (ruleta?.players.contains(where: { $0.pid == pid }) ?? false)
            let participatingPuzzle = screen == .puzzle &&
                ["pz_bajar", "pz_mover", "pz_soltar", "pz_girar", "pz_acercar",
                 "pz_alejar", "pz_encuadrar", "pz_guia", "pz_imagen"].contains(action)
            let participatingTutti = screen == .tutti &&
                (tutti?.players.contains(where: { $0.pid == pid }) ?? false) &&
                !["menu", "otra", "siguiente"].contains(action)
            guard pid == controllerPID || participatingTutti || participatingPuzzle || wheelTurn || wheelShared else { return }
            handleAction(object)
        default: break
        }
    }

    private func handleAction(_ object: [String: Any]) {
        guard let action = object["a"] as? String else { return }
        if action == "menu" { showMenu(); return }
        if action == "elegir", object["juego"] as? String == "cien" { startCien(); return }
        if action == "elegir", object["juego"] as? String == "ahorcado" { startAhorcado(); return }
        if action == "elegir", object["juego"] as? String == "rosco" { startRosco(); return }
        if action == "elegir", object["juego"] as? String == "tutti" { startTutti(); return }
        if action == "elegir", object["juego"] as? String == "ruleta" { startRuleta(); return }
        if action == "elegir", object["juego"] as? String == "puzzle" { startPuzzle(); return }
        if action == "otra", screen == .cien { showMenu(); startCien(); return }
        if action == "otra", screen == .ahorcado { showMenu(); startAhorcado(); return }
        if action == "otra", screen == .rosco { showMenu(); startRosco(); return }
        if action == "otra", screen == .tutti, tutti?.stage == .finished { showMenu(); startTutti(); return }
        if action == "otra", screen == .ruleta, ruleta?.stage == .finished { showMenu(); startRuleta(); return }
        if screen == .puzzle, var game = puzzle, let pid = object["pid"] as? String {
            if game.act(object, pid: pid, controller: controllerPID) {
                puzzle = game
                broadcast()
            }
            return
        }
        if screen == .ruleta, var game = ruleta, let pid = object["pid"] as? String {
            if game.act(object, pid: pid) {
                ruleta = game
                broadcast()
            }
            return
        }
        if screen == .tutti, var game = tutti {
            if game.act(object, controllerPID: controllerPID) {
                tutti = game
                broadcast()
            }
            return
        }
        if action == "pasar", screen == .rosco {
            passRosco()
            return
        }
        if action == "responder", screen == .rosco, let text = object["txt"] as? String, var game = rosco {
            game.answer(String(text.prefix(40)))
            rosco = game
            broadcast()
            return
        }
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
            ["id": "rosco", "nombre": "El Rosco", "ok": true],
            ["id": "ahorcado", "nombre": "Ahorcado", "ok": true],
            ["id": "ruleta", "nombre": "La Ruleta", "ok": true],
            ["id": "tutti", "nombre": "Tutti Frutti", "ok": true],
            ["id": "puzzle", "nombre": "Puzzle", "ok": true]
        ]
        let cell: [String: Any]
        switch screen {
        case .cien: cell = cien?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .ahorcado: cell = ahorcado?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .rosco: cell = rosco?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .tutti: cell = tutti?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .ruleta: cell = ruleta?.phoneState ?? ["pantalla": "menu", "juegos": games]
        case .puzzle: cell = puzzle?.phoneState(players: players) ?? ["pantalla": "menu", "juegos": games]
        case .home, .menu: cell = ["pantalla": "menu", "juegos": games]
        }
        let message: [String: Any] = [
            "t": "estado", "pid": String(tvPID), "s": sequence + 1, "cod": code,
            "fase": screen == .menu ? "menu" : "juego",
            "juego": screen == .cien ? "cien" as Any : (screen == .ahorcado ? "ahorcado" as Any : (screen == .rosco ? "rosco" as Any : (screen == .tutti ? "tutti" as Any : (screen == .ruleta ? "ruleta" as Any : (screen == .puzzle ? "puzzle" as Any : NSNull()))))),
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
