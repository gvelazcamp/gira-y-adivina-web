import SwiftUI

private enum TuttiPalette {
    static let gold = Color(red: 0.96, green: 0.70, blue: 0.02)
    static let aqua = Color(red: 0.22, green: 0.84, blue: 0.75)
    static let cream = Color(red: 0.97, green: 0.94, blue: 0.89)
    static let violet = Color(red: 0.21, green: 0.09, blue: 0.35)
    static let dark = Color(red: 0.09, green: 0.04, blue: 0.16)
}

struct TuttiView: View {
    @ObservedObject var host: TVHost
    let game: TuttiGame

    var body: some View {
        VStack(spacing: 20) {
            HStack {
                Text("TUTTI FRUTTI")
                    .font(.system(size: 52, weight: .black, design: .rounded))
                    .foregroundColor(TuttiPalette.gold)
                Spacer()
                Text("RONDA \(game.round) DE 3")
                    .font(.system(size: 31, weight: .bold))
            }
            Group {
                switch game.stage {
                case .playing: playing
                case .cut: waiting(title: game.winner == nil ? "¡TIEMPO!" : "¡BASTA!",
                                   detail: game.winner.flatMap { id in
                                       game.players.first(where: { $0.pid == id })?.name
                                   }.map { "\($0) terminó primero" } ?? "Se terminó el tiempo")
                case .validating: waiting(title: "Revisando respuestas…",
                                          detail: "Preparando los resultados de esta letra")
                case .result: results
                case .finished: finished
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            HStack(spacing: 30) {
                Text(footer)
                    .font(.system(size: 23, weight: .medium))
                    .foregroundColor(TuttiPalette.aqua)
                Spacer()
                Button("Menú de juegos") { host.showMenu() }
                    .font(.system(size: 26, weight: .bold))
            }
        }
        .padding(54)
        .foregroundColor(TuttiPalette.cream)
    }

    private var footer: String {
        switch game.stage {
        case .playing: return "Cada jugador escribe en su celular. Las palabras son privadas hasta terminar."
        case .cut, .validating: return "Los celulares están enviando y revisando las respuestas."
        case .result: return game.hasPending ?
            "Hay apelaciones o anulaciones pendientes de votación." :
            "El celular con 🎮 puede pasar a la siguiente letra."
        case .finished: return "Desde el celular con 🎮 podés jugar otra vez."
        }
    }

    private var playing: some View {
        VStack(spacing: 18) {
            Spacer(minLength: 0)
            HStack(alignment: .center, spacing: 100) {
                VStack(spacing: 4) {
                    Text("LETRA").font(.system(size: 33, weight: .black))
                    Text(game.letter)
                        .font(.system(size: 245, weight: .black, design: .rounded))
                        .foregroundColor(TuttiPalette.gold)
                }
                VStack(spacing: 0) {
                    Text("TIEMPO").font(.system(size: 32, weight: .black))
                    Text("\(Int(ceil(game.remaining)))")
                        .font(.system(size: 230, weight: .black, design: .monospaced))
                        .foregroundColor(game.remaining <= 10 ? .red : TuttiPalette.aqua)
                        .contentTransition(.numericText())
                    Text("SEGUNDOS").font(.system(size: 29, weight: .bold))
                }
            }
            Spacer(minLength: 0)
            Text("COMPLETARON SUS CATEGORÍAS")
                .font(.system(size: 27, weight: .black))
                .foregroundColor(TuttiPalette.gold)
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 235), spacing: 14)], spacing: 13) {
                ForEach(game.players) { player in
                    HStack {
                        Text(player.name).lineLimit(1)
                        Spacer(minLength: 8)
                        Text(game.progress[player.pid] == true ? "✓" : "·")
                            .foregroundColor(game.progress[player.pid] == true ?
                                TuttiPalette.aqua : TuttiPalette.cream)
                    }
                    .font(.system(size: 26, weight: .bold))
                    .padding(18)
                    .background(TuttiPalette.dark, in: RoundedRectangle(cornerRadius: 14))
                }
            }
            Spacer(minLength: 0)
        }
    }

    private func waiting(title: String, detail: String) -> some View {
        VStack(spacing: 36) {
            Spacer()
            Text(title)
                .font(.system(size: 115, weight: .black, design: .rounded))
                .foregroundColor(TuttiPalette.gold)
            Text(detail)
                .font(.system(size: 42, weight: .bold))
                .multilineTextAlignment(.center)
            Spacer()
        }
    }

    private var results: some View {
        VStack(spacing: 14) {
            Text("LETRA \(game.letter) · PALABRAS Y PUNTAJES")
                .font(.system(size: 34, weight: .black))
                .foregroundColor(TuttiPalette.aqua)

            ScrollView(.horizontal) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 5) {
                        headerCell("CATEGORÍA", width: 200)
                        ForEach(game.players) { player in
                            headerCell(player.name + (game.winner == player.pid ? " 🏁" : ""), width: 205)
                        }
                    }
                    ForEach(game.categories.indices, id: \.self) { index in
                        HStack(spacing: 5) {
                            Text(game.categories[index])
                                .font(.system(size: 25, weight: .bold))
                                .frame(width: 200, height: 70)
                                .background(TuttiPalette.violet, in: RoundedRectangle(cornerRadius: 10))
                            ForEach(game.players) { player in
                                answerCell(player, index: index)
                            }
                        }
                    }
                    HStack(spacing: 5) {
                        headerCell("TOTAL LETRA", width: 200)
                        ForEach(game.players) { player in
                            VStack(spacing: 2) {
                                Text("+\(game.score(for: player.pid))")
                                    .font(.system(size: 28, weight: .black))
                                    .foregroundColor(TuttiPalette.gold)
                                Text("Acum. \(game.totals[player.pid, default: 0] + game.score(for: player.pid))")
                                    .font(.system(size: 18))
                            }
                            .frame(width: 205, height: 75)
                            .background(TuttiPalette.dark, in: RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }
                .frame(maxHeight: .infinity, alignment: .top)
            }
            if game.hasPending {
                Text("⏳ \(game.pending.count) revisión(es) pendiente(s)")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(TuttiPalette.gold)
            }
        }
    }

    private func headerCell(_ value: String, width: CGFloat) -> some View {
        Text(value)
            .font(.system(size: 23, weight: .black))
            .lineLimit(1)
            .frame(width: width, height: 60)
            .background(TuttiPalette.violet, in: RoundedRectangle(cornerRadius: 10))
    }

    private func answerCell(_ player: TVPlayer, index: Int) -> some View {
        let answer = game.submitted[player.pid]?[index] ?? ""
        let points = game.scores[player.pid]?[index] ?? 0
        let canceled = game.isCanceled(player.pid, index)
        let pending = game.isPending(player.pid, index)
        let doubtful = game.isDoubtful(player.pid, index)
        return VStack(spacing: 3) {
            Text(answer.isEmpty ? "—" : answer)
                .font(.system(size: 22, weight: .bold))
                .lineLimit(1)
                .minimumScaleFactor(0.65)
            Text(canceled ? "Anulada" :
                 (pending ? "En revisión" :
                  (doubtful ? "Dudosa · +\(points)" : "+\(points)")))
                .font(.system(size: 17, weight: .semibold))
                .foregroundColor(canceled ? .red :
                                 (pending || doubtful ? TuttiPalette.gold : TuttiPalette.aqua))
        }
        .frame(width: 205, height: 70)
        .background(TuttiPalette.dark, in: RoundedRectangle(cornerRadius: 10))
    }

    private var finished: some View {
        VStack(spacing: 28) {
            Text("🏆 RESULTADO FINAL")
                .font(.system(size: 65, weight: .black))
                .foregroundColor(TuttiPalette.gold)
            VStack(spacing: 12) {
                ForEach(Array(game.orderedPlayers.enumerated()), id: \.element.pid) { index, player in
                    HStack(spacing: 20) {
                        Text(index == 0 ? "🥇" : (index == 1 ? "🥈" : (index == 2 ? "🥉" : " ")))
                            .frame(width: 80)
                        Text(player.name).frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(game.totals[player.pid, default: 0]) puntos")
                            .frame(width: 260, alignment: .trailing)
                        Text("\(game.roundWins[player.pid, default: 0]) rondas")
                            .frame(width: 220, alignment: .trailing)
                    }
                    .font(.system(size: 34, weight: .bold))
                    .padding(14)
                    .background(index == 0 ? TuttiPalette.violet : TuttiPalette.dark,
                                in: RoundedRectangle(cornerRadius: 14))
                }
            }
            Spacer(minLength: 0)
            Text("LETRAS: " + game.history.map(\.letter).joined(separator: " · "))
                .font(.system(size: 29, weight: .medium))
        }
    }
}
