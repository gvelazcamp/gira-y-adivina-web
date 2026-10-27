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
                    Text("Rosco · Ahorcado · Ruleta · Tutti Frutti · Puzzle: en preparación para tvOS")
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
