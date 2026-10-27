import SwiftUI
import UIKit

private enum Theme {
    static let night = Color(red: 0.09, green: 0.04, blue: 0.16)
    static let violet = Color(red: 0.21, green: 0.09, blue: 0.35)
    static let gold = Color(red: 0.96, green: 0.70, blue: 0.02)
    static let aqua = Color(red: 0.22, green: 0.84, blue: 0.75)
    static let cream = Color(red: 0.97, green: 0.94, blue: 0.89)
}

@main
struct GiraYAdivinaTVApp: App {
    @StateObject private var host = TVHost()

    var body: some Scene {
        WindowGroup {
            TVRoot(host: host)
                .onAppear { UIApplication.shared.isIdleTimerDisabled = true }
                .onDisappear { UIApplication.shared.isIdleTimerDisabled = false; host.stop() }
        }
    }
}

private struct TVRoot: View {
    @ObservedObject var host: TVHost

    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.violet, Theme.night], startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            switch host.screen {
            case .home: home
            case .menu: menu
            case .cien:
                if let game = host.cien { CienView(host: host, game: game) }
            case .ahorcado:
                if let game = host.ahorcado { AhorcadoView(host: host, game: game) }
            case .rosco:
                if let game = host.rosco { RoscoView(host: host, game: game) }
            case .tutti:
                if let game = host.tutti { TuttiView(host: host, game: game) }
            case .ruleta:
                if let game = host.ruleta { RuletaView(host: host, game: game) }
            }
        }
        .foregroundColor(Theme.cream)
        .onExitCommand(perform: host.back)
    }

    private var home: some View {
        VStack(spacing: 32) {
            Text("GIRÁ Y ADIVINÁ")
                .font(.system(size: 86, weight: .black, design: .rounded))
                .foregroundColor(Theme.gold)
            Text("RIOPLATENSE")
                .font(.system(size: 35, weight: .bold, design: .rounded))
            Text("La tele muestra el juego. Cada participante responde desde su celular.")
                .font(.system(size: 31))
                .multilineTextAlignment(.center)
            Button("📺  Sala TV") { host.start() }
                .font(.system(size: 34, weight: .bold))
                .padding(.horizontal, 32)
            Text("Necesitás internet en la tele y en los celulares.")
                .font(.system(size: 24))
                .foregroundColor(Theme.aqua)
        }
        .padding(80)
    }

    private var menu: some View {
        VStack(spacing: 25) {
            HStack(alignment: .top, spacing: 36) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("SALA TV")
                        .font(.system(size: 58, weight: .black, design: .rounded))
                        .foregroundColor(Theme.gold)
                    Text("En cada celular: girayadivina.com/tele")
                        .font(.system(size: 29, weight: .semibold))
                        .foregroundColor(Theme.aqua)
                    Text(host.connectedBrokers > 0 ? "Conectada · \(host.connectedBrokers) servidores" : "Conectando con la sala…")
                        .font(.system(size: 23))
                }
                Spacer()
                VStack(spacing: 4) {
                    Text("CÓDIGO")
                        .font(.system(size: 24, weight: .bold))
                    Text(host.code)
                        .font(.system(size: 80, weight: .black, design: .monospaced))
                        .tracking(5)
                        .foregroundColor(Theme.gold)
                }
                .padding(.horizontal, 32)
                .padding(.vertical, 15)
                .background(Theme.night.opacity(0.8), in: RoundedRectangle(cornerRadius: 20))
            }
            HStack(spacing: 36) {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Jugadores conectados")
                        .font(.system(size: 29, weight: .bold))
                    if host.players.isEmpty {
                        Text("Esperando celulares…")
                            .font(.system(size: 25))
                            .foregroundColor(Theme.aqua)
                    }
                    ForEach(host.players) { player in
                        Text((player.pid == host.controllerPID ? "🎮  " : "📱  ") + player.name)
                            .font(.system(size: 27, weight: .semibold))
                    }
                    Spacer()
                }
                .frame(maxWidth: 400, maxHeight: .infinity, alignment: .topLeading)
                .padding(28)
                .background(Theme.night.opacity(0.6), in: RoundedRectangle(cornerRadius: 22))
                VStack(alignment: .leading, spacing: 20) {
                    Text("Elegí un juego con el control remoto")
                        .font(.system(size: 30, weight: .bold))
                    Button("🍖  100 Rioplatenses") { host.startCien() }
                        .font(.system(size: 32, weight: .bold))
                    Button("🪢  Ahorcado") { host.startAhorcado() }
                        .font(.system(size: 32, weight: .bold))
                    Button("🔤  El Rosco") { host.startRosco() }
                        .font(.system(size: 32, weight: .bold))
                    Button("🍓  Tutti Frutti") { host.startTutti() }
                        .font(.system(size: 32, weight: .bold))
                    Button("🎡  La Ruleta") { host.startRuleta() }
                        .font(.system(size: 32, weight: .bold))
                    Text("Puzzle: en preparación para tvOS")
                        .font(.system(size: 23))
                        .foregroundColor(Theme.aqua)
                    if !host.errorMessage.isEmpty {
                        Text(host.errorMessage).foregroundColor(.red)
                    }
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(28)
                .background(Theme.night.opacity(0.6), in: RoundedRectangle(cornerRadius: 22))
            }
            Text("Menú del control: volver. El celular con 🎮 también puede elegir el juego.")
                .font(.system(size: 22))
                .foregroundColor(Theme.aqua)
        }
        .padding(64)
    }
}

private struct RoscoView: View {
    @ObservedObject var host: TVHost
    let game: RoscoGame

    var body: some View {
        VStack(spacing: 28) {
            HStack {
                Text("EL ROSCO RIOPLATENSE")
                    .font(.system(size: 50, weight: .black, design: .rounded))
                    .foregroundColor(Theme.gold)
                Spacer()
                Text("⏱ \(game.clock)   ✓ \(game.correctCount)   ✘ \(game.wrongCount)")
                    .font(.system(size: 31, weight: .bold))
            }
            if game.stage == .finished {
                Spacer()
                Text("🏆 \(game.correctCount) de \(game.items.count) aciertos")
                    .font(.system(size: 77, weight: .black))
                    .foregroundColor(Theme.gold)
                Text("Desde el celular con 🎮 podés jugar otra vez.")
                    .font(.system(size: 30))
                Spacer()
            } else {
                HStack(spacing: 42) {
                    ZStack {
                        Circle().stroke(Theme.gold.opacity(0.45), lineWidth: 6)
                            .frame(width: 495, height: 495)
                        ForEach(0..<game.items.count, id: \.self) { index in
                            let angle = Double(index) * 2 * Double.pi / Double(game.items.count) - Double.pi / 2
                            Text(game.items[index].letra)
                                .font(.system(size: 29, weight: .black))
                                .frame(width: 66, height: 66)
                                .background(game.marks[index] == .correct ? Theme.aqua :
                                            (game.marks[index] == .wrong ? Color.red : Theme.violet), in: Circle())
                                .overlay(Circle().stroke(index == game.current ? Theme.gold : Theme.cream.opacity(0.4), lineWidth: index == game.current ? 5 : 1))
                                .position(x: CGFloat(310 + 247 * cos(angle)), y: CGFloat(310 + 247 * sin(angle)))
                        }
                        VStack(spacing: 8) {
                            Text(game.currentItem.letra)
                                .font(.system(size: 106, weight: .black, design: .rounded))
                                .foregroundColor(Theme.gold)
                            Text(game.rule)
                                .font(.system(size: 25, weight: .bold))
                        }
                    }
                    .frame(width: 620, height: 620)
                    VStack(alignment: .leading, spacing: 28) {
                        Text("🎮 Juega \(host.controllerName)")
                            .font(.system(size: 29, weight: .bold))
                            .foregroundColor(Theme.aqua)
                        Text(game.currentItem.definicion)
                            .font(.system(size: 47, weight: .bold, design: .rounded))
                            .frame(maxWidth: .infinity, minHeight: 230, alignment: .leading)
                        Text(game.lastMessage)
                            .font(.system(size: 29, weight: .semibold))
                            .foregroundColor(Theme.gold)
                        Text("Respondé o pasá desde el celular")
                            .font(.system(size: 25))
                        Button("⏭ Pasar") { host.passRosco() }
                            .font(.system(size: 29, weight: .bold))
                        Spacer()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            HStack {
                Spacer()
                Button("Menú de juegos") { host.showMenu() }
            }
        }
        .padding(60)
    }
}

private struct CienView: View {
    @ObservedObject var host: TVHost
    let game: CienGame

    var body: some View {
        VStack(spacing: 25) {
            HStack {
                Text("\(game.category?.icono ?? "🍖")  100 RIOPLATENSES")
                    .font(.system(size: 44, weight: .black, design: .rounded))
                    .foregroundColor(Theme.gold)
                Spacer()
                Text("Ronda \(game.roundNumber)/3  ·  x\(game.multiplier)  ·  ⭐ \(game.score)")
                    .font(.system(size: 29, weight: .bold))
            }
            if game.stage == .finished {
                Spacer()
                Text("🏆 ¡\(game.score) puntos!")
                    .font(.system(size: 88, weight: .black))
                    .foregroundColor(Theme.gold)
                Text("Desde el celular con 🎮 podés jugar otra vez.")
                    .font(.system(size: 30))
                Spacer()
            } else {
                Text(game.question.pregunta)
                    .font(.system(size: 48, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, minHeight: 125)
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 20), GridItem(.flexible(), spacing: 20)], spacing: 18) {
                    ForEach(0..<game.question.respuestas.count, id: \.self) { index in
                        let answer = game.question.respuestas[index]
                        HStack {
                            Text(game.opened.contains(index) ? answer.texto : "\(index + 1)")
                            Spacer()
                            if game.opened.contains(index) { Text("\(answer.puntos)") }
                        }
                        .font(.system(size: 29, weight: .bold))
                        .padding(.horizontal, 24)
                        .frame(height: 75)
                        .background(game.opened.contains(index) ? Theme.aqua.opacity(0.2) : Theme.night,
                                    in: RoundedRectangle(cornerRadius: 15))
                        .overlay(RoundedRectangle(cornerRadius: 15).stroke(Theme.gold.opacity(0.7), lineWidth: 2))
                    }
                }
                HStack {
                    Text(String(repeating: "✘ ", count: game.errors))
                        .font(.system(size: 54, weight: .black))
                        .foregroundColor(.red)
                    Spacer()
                    Text(game.stage == .reveal ? "Siguiente pregunta en un momento…" : game.lastMessage)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(Theme.aqua)
                }
            }
            HStack {
                Text("🎮 \(host.controllerName) escribe lo que dice el grupo")
                    .font(.system(size: 25))
                Spacer()
                Button("Menú de juegos") { host.showMenu() }
            }
        }
        .padding(60)
    }
}

private struct AhorcadoView: View {
    @ObservedObject var host: TVHost
    let game: AhorcadoGame

    private var letters: String {
        game.word.palabra.map { letter in
            game.used.contains(letter) || game.stage == .reveal ? String(letter) : "＿"
        }.joined(separator: " ")
    }

    var body: some View {
        VStack(spacing: 28) {
            HStack {
                Text("AHORCADO RIOPLATENSE")
                    .font(.system(size: 48, weight: .black, design: .rounded))
                    .foregroundColor(Theme.gold)
                Spacer()
                Text("Palabra \(game.number)/5 · ⭐ \(game.points)")
                    .font(.system(size: 30, weight: .bold))
            }
            if game.stage == .finished {
                Spacer()
                Text("🏆 \(game.won) de 5 palabras")
                    .font(.system(size: 76, weight: .black))
                Text("⭐ \(game.points) puntos")
                    .font(.system(size: 52, weight: .bold))
                Spacer()
            } else if game.stage == .spin {
                Spacer()
                Text("🎡 Girando la categoría…")
                    .font(.system(size: 62, weight: .bold))
                    .foregroundColor(Theme.aqua)
                Spacer()
            } else {
                HStack(spacing: 48) {
                    Path { path in
                        path.move(to: CGPoint(x: 45, y: 305))
                        path.addLine(to: CGPoint(x: 245, y: 305))
                        path.move(to: CGPoint(x: 95, y: 305))
                        path.addLine(to: CGPoint(x: 95, y: 30))
                        path.addLine(to: CGPoint(x: 220, y: 30))
                        path.addLine(to: CGPoint(x: 220, y: 70))
                        if game.errors >= 1 { path.addEllipse(in: CGRect(x: 197, y: 70, width: 46, height: 46)) }
                        if game.errors >= 2 { path.move(to: CGPoint(x: 220, y: 116)); path.addLine(to: CGPoint(x: 220, y: 205)) }
                        if game.errors >= 3 { path.move(to: CGPoint(x: 220, y: 145)); path.addLine(to: CGPoint(x: 175, y: 178)) }
                        if game.errors >= 4 { path.move(to: CGPoint(x: 220, y: 145)); path.addLine(to: CGPoint(x: 265, y: 178)) }
                        if game.errors >= 5 { path.move(to: CGPoint(x: 220, y: 205)); path.addLine(to: CGPoint(x: 180, y: 260)) }
                        if game.errors >= 6 { path.move(to: CGPoint(x: 220, y: 205)); path.addLine(to: CGPoint(x: 260, y: 260)) }
                    }
                    .stroke(Theme.gold, style: StrokeStyle(lineWidth: 9, lineCap: .round, lineJoin: .round))
                    .frame(width: 310, height: 320)
                    VStack(spacing: 34) {
                        Text("\(game.category?.emoji ?? "❓")  \(game.category?.nombre ?? game.word.categoria)")
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(Theme.aqua)
                        Text(letters)
                            .font(.system(size: 52, weight: .black, design: .monospaced))
                            .minimumScaleFactor(0.55)
                            .lineLimit(1)
                        Text("Errores: \(game.errors)/6")
                            .font(.system(size: 30))
                            .foregroundColor(game.errors >= 5 ? .red : Theme.cream)
                        Text("Letras usadas: \(String(game.used.sorted()))")
                            .font(.system(size: 28))
                        if game.stage == .reveal {
                            Text(game.isSolved ? "¡La sacaron! ✓" : "Era \(game.word.palabra)")
                                .font(.system(size: 38, weight: .black))
                                .foregroundColor(game.isSolved ? Theme.aqua : .red)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
                Spacer()
            }
            HStack {
                Text("🎮 \(host.controllerName) elige la letra desde el celular")
                    .font(.system(size: 26))
                Spacer()
                Button("Menú de juegos") { host.showMenu() }
            }
        }
        .padding(60)
    }
}
