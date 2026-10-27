import SwiftUI

private enum WheelPalette {
    static let gold = Color(red: 0.96, green: 0.70, blue: 0.02)
    static let aqua = Color(red: 0.22, green: 0.84, blue: 0.75)
    static let cream = Color(red: 0.97, green: 0.94, blue: 0.89)
    static let night = Color(red: 0.09, green: 0.04, blue: 0.16)
    static let violet = Color(red: 0.21, green: 0.09, blue: 0.35)
    static let magenta = Color(red: 0.90, green: 0.10, blue: 0.49)
    static let wedge: [Color] = [
        gold, aqua, magenta, Color.orange, Color(red: 0.43, green: 0.25, blue: 0.88),
        Color(red: 0.20, green: 0.65, blue: 0.90)
    ]
}

private struct RuletaWedge: View {
    let index: Int
    let segment: RuletaSegment
    private let piece = 360.0 / Double(RuletaGame.wheel.count)

    private var fillColor: Color {
        switch segment.kind {
        case "QUIEBRA": return WheelPalette.night
        case "PIERDE": return WheelPalette.violet
        case "COMODIN": return Color(red: 0.06, green: 0.47, blue: 0.37)
        case "X2": return WheelPalette.gold
        default: return WheelPalette.wedge[index % WheelPalette.wedge.count]
        }
    }

    var body: some View {
        GeometryReader { geometry in
            let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
            let radius = min(geometry.size.width, geometry.size.height) * 0.48
            let begin = -Double.pi / 2 + (Double(index) * 2 * Double.pi / 24)
            let end = begin + 2 * Double.pi / 24
            let midpoint = (begin + end) / 2
            Path { path in
                path.move(to: center)
                path.addLine(to: CGPoint(x: center.x + radius * cos(begin),
                                         y: center.y + radius * sin(begin)))
                path.addArc(center: center, radius: radius,
                            startAngle: .radians(begin), endAngle: .radians(end),
                            clockwise: false)
                path.closeSubpath()
            }
            .fill(fillColor)
            Path { path in
                path.move(to: center)
                path.addLine(to: CGPoint(x: center.x + radius * cos(begin),
                                         y: center.y + radius * sin(begin)))
                path.addArc(center: center, radius: radius,
                            startAngle: .radians(begin), endAngle: .radians(end),
                            clockwise: false)
                path.closeSubpath()
            }
            .stroke(WheelPalette.gold.opacity(0.75), lineWidth: 1.5)

            Text(segment.kind.isEmpty ? "\(segment.value)" :
                 (segment.kind == "QUIEBRA" ? "QUIEBRA" :
                  segment.kind == "PIERDE" ? "PIERDE" : segment.kind))
                .font(.system(size: segment.kind.isEmpty ? 18 : 12, weight: .black))
                .foregroundColor(segment.kind == "QUIEBRA" ?
                    WheelPalette.gold : WheelPalette.night)
                .fixedSize()
                .rotationEffect(.radians(midpoint + Double.pi / 2))
                .position(x: center.x + radius * 0.76 * cos(midpoint),
                          y: center.y + radius * 0.76 * sin(midpoint))
        }
    }
}

struct RuletaView: View {
    @ObservedObject var host: TVHost
    let game: RuletaGame

    private var rows: [[Character]] {
        var result = [[Character]]()
        var current = ""
        for word in game.phrase.split(separator: " ") {
            let next = current.isEmpty ? String(word) : current + " " + word
            if next.count > 16 && !current.isEmpty {
                result.append(Array(current))
                current = String(word)
            } else {
                current = next
            }
        }
        if !current.isEmpty { result.append(Array(current)) }
        return result
    }

    var body: some View {
        VStack(spacing: 15) {
            HStack {
                Text("LA RULETA")
                    .font(.system(size: 50, weight: .black, design: .rounded))
                    .foregroundColor(WheelPalette.gold)
                Spacer()
                Text(game.category)
                    .font(.system(size: 27, weight: .bold))
                    .foregroundColor(WheelPalette.aqua)
                Spacer()
                Text(game.stage == .bonus || game.stage == .bonusEnd ? "RONDA BONUS" :
                     (game.stage == .toss || game.stage == .tossEnd ? "PRUEBA DE VELOCIDAD" :
                      "RONDA \(game.round) DE 3"))
                    .font(.system(size: 25, weight: .bold))
            }

            HStack(spacing: 42) {
                VStack(spacing: 5) {
                    wheel
                        .frame(width: 470, height: 470)
                    Text(game.lastPrize.isEmpty ? "GIRÁ LA RULETA" : game.lastPrize)
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(WheelPalette.gold)
                        .frame(height: 50)
                }
                .frame(width: 520)

                VStack(spacing: 20) {
                    Text(game.stage == .finished ? "RESULTADO FINAL" :
                         (game.stage == .toss ? "⚡ RESOLVÉ LA FRASE" :
                          (game.stage == .bonus ? "⭐ RONDA BONUS" :
                           "TURNO DE \(game.currentPlayer.name.uppercased())")))
                        .font(.system(size: 32, weight: .black))
                        .foregroundColor(WheelPalette.gold)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if game.stage == .finished {
                        podium
                    } else {
                        board
                        HStack {
                            Text(game.stage == .toss || game.stage == .bonus ?
                                 "⏱ \(Int(ceil(game.specialRemaining))) s" :
                                 (game.stage == .spinning || game.stage == .passing ||
                                  game.stage == .roundEnd || game.stage == .tossEnd ||
                                  game.stage == .bonusEnd ? "" :
                                  "⏱ \(Int(ceil(game.turnRemaining))) s"))
                                .foregroundColor(WheelPalette.aqua)
                            Spacer()
                            Text(game.stage == .spin || game.stage == .consonant ||
                                 game.stage == .vowel ? "$\(game.roundMoney[game.currentPlayer.pid, default: 0]) de ronda" : "")
                                .foregroundColor(WheelPalette.gold)
                        }
                        .font(.system(size: 30, weight: .black))
                    }

                    Text(game.message)
                        .font(.system(size: 26, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, minHeight: 85)
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: .infinity)
            }
            .frame(maxHeight: .infinity)

            scoreboard

            HStack {
                Text("Respondé con tu celular · girayadivina.com/tele")
                    .font(.system(size: 24))
                    .foregroundColor(WheelPalette.aqua)
                Spacer()
                Button("Menú de juegos") { host.showMenu() }
                    .font(.system(size: 25, weight: .bold))
            }
        }
        .padding(.horizontal, 55)
        .padding(.vertical, 38)
        .foregroundColor(WheelPalette.cream)
    }

    private var wheel: some View {
        ZStack {
            Circle().fill(WheelPalette.night).shadow(color: WheelPalette.gold.opacity(0.4),
                                                        radius: 16)
            ZStack {
                ForEach(RuletaGame.wheel.indices, id: \.self) { index in
                    RuletaWedge(index: index, segment: RuletaGame.wheel[index])
                }
            }
            .rotationEffect(.degrees(game.wheelAngle))
            .animation(.easeOut(duration: 3), value: game.wheelAngle)
            Circle()
                .fill(WheelPalette.gold)
                .frame(width: 85, height: 85)
                .overlay {
                    Text("G&A").foregroundColor(WheelPalette.night)
                        .font(.system(size: 21, weight: .black))
                }
                .overlay(Circle().stroke(WheelPalette.cream, lineWidth: 4))
            VStack {
                Text("▼")
                    .font(.system(size: 48, weight: .black))
                    .foregroundColor(WheelPalette.cream)
                    .shadow(radius: 8)
                    .offset(y: -24)
                Spacer()
            }
        }
    }

    private var board: some View {
        VStack(spacing: 12) {
            ForEach(rows.indices, id: \.self) { index in
                let letters = rows[index]
                HStack(spacing: 6) {
                    ForEach(letters.indices, id: \.self) { characterIndex in
                        let letter = letters[characterIndex]
                        if letter == " " {
                            Color.clear.frame(width: 20, height: 57)
                        } else {
                            Text(game.opened.contains(letter) || !letter.isLetter ?
                                 String(letter) : " ")
                                .font(.system(size: 29, weight: .black, design: .rounded))
                                .frame(width: 48, height: 57)
                                .foregroundColor(WheelPalette.night)
                                .background(game.opened.contains(letter) || !letter.isLetter ?
                                    WheelPalette.aqua : WheelPalette.cream,
                                    in: RoundedRectangle(cornerRadius: 6))
                                .overlay {
                                    RoundedRectangle(cornerRadius: 6)
                                        .stroke(WheelPalette.gold.opacity(0.9), lineWidth: 2)
                                }
                        }
                    }
                }
            }
            Text("LETRAS USADAS: " + String(game.used.sorted()))
                .font(.system(size: 23, weight: .semibold))
                .foregroundColor(WheelPalette.aqua)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, minHeight: 300)
        .padding(.vertical, 20)
        .background(WheelPalette.night.opacity(0.8), in: RoundedRectangle(cornerRadius: 20))
    }

    private var scoreboard: some View {
        HStack(spacing: 12) {
            ForEach(game.players) { player in
                VStack(spacing: 6) {
                    Text(player.name)
                        .font(.system(size: 23, weight: .bold))
                        .lineLimit(1)
                    Text("$\(game.money[player.pid, default: 0])")
                        .font(.system(size: 27, weight: .black))
                        .foregroundColor(WheelPalette.gold)
                    Text("Ronda $\(game.roundMoney[player.pid, default: 0])")
                        .font(.system(size: 19, weight: .medium))
                    Text("Ganadas \(game.roundsWon[player.pid, default: 0])")
                        .font(.system(size: 18))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(WheelPalette.night.opacity(0.85),
                            in: RoundedRectangle(cornerRadius: 16))
                .overlay {
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(game.currentPlayer.pid == player.pid ?
                                WheelPalette.gold : WheelPalette.cream.opacity(0.15),
                                lineWidth: game.currentPlayer.pid == player.pid ? 3 : 1)
                }
            }
        }
    }

    private var podium: some View {
        VStack(spacing: 22) {
            ForEach(game.endRanking.indices, id: \.self) { rank in
                let player = game.endRanking[rank]
                HStack {
                    Text(rank == 0 ? "🥇" : (rank == 1 ? "🥈" : (rank == 2 ? "🥉" : "")))
                    Text(player.name)
                    Spacer()
                    Text("$\(game.money[player.pid, default: 0])")
                }
                .font(.system(size: 33, weight: .bold))
                .padding(20)
                .background(WheelPalette.night, in: RoundedRectangle(cornerRadius: 14))
            }
        }
    }
}
