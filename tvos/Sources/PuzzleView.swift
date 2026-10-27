import SwiftUI
import UIKit

private enum PuzzlePalette {
    static let night = Color(red: 0.09, green: 0.04, blue: 0.16)
    static let violet = Color(red: 0.21, green: 0.09, blue: 0.35)
    static let gold = Color(red: 0.96, green: 0.70, blue: 0.02)
    static let aqua = Color(red: 0.22, green: 0.84, blue: 0.75)
    static let cream = Color(red: 0.97, green: 0.94, blue: 0.89)
}

struct PuzzleView: View {
    @ObservedObject var host: TVHost
    let game: PuzzleGame

    @State private var original: UIImage?
    @State private var cropped: [UIImage] = []

    var body: some View {
        VStack(spacing: 18) {
            HStack(spacing: 16) {
                Text("PUZZLE")
                    .font(.system(size: 57, weight: .black, design: .rounded))
                    .foregroundColor(PuzzlePalette.gold)
                Spacer()
                if game.stage != .config {
                    Text("\(game.percent)% ARMADO")
                        .foregroundColor(PuzzlePalette.aqua)
                        .font(.system(size: 38, weight: .black))
                    Text("⏱ \(formattedTime)")
                        .font(.system(size: 27, weight: .bold))
                } else {
                    Text("SALA TV · ELEGÍ EL PUZZLE")
                        .font(.system(size: 32, weight: .bold))
                }
            }

            if game.stage == .config { configuration }
            else if game.stage == .fin { completed }
            else { playing }

            HStack(spacing: 18) {
                Text(game.stage == .config ?
                     "El celular con 🎮 elige. Después todos colaboran." :
                     "Los celulares mueven las piezas del mismo tablero.")
                    .font(.system(size: 23))
                    .foregroundColor(PuzzlePalette.aqua)
                Spacer()
                Button("Menú de juegos") { host.showMenu() }
                    .font(.system(size: 26, weight: .bold))
            }
        }
        .padding(.horizontal, 60)
        .padding(.vertical, 35)
        .foregroundColor(PuzzlePalette.cream)
        .onAppear(perform: reloadPictures)
        .onChange(of: game.slug) { _ in reloadPictures() }
        .onChange(of: game.count) { _ in reloadPictures() }
        .onChange(of: game.stage) { _ in reloadPictures() }
    }

    private var formattedTime: String {
        let seconds = max(0, Int(game.elapsed))
        return String(format: "%02d:%02d", seconds / 60, seconds % 60)
    }

    private var configuration: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Elegí una categoría")
                .font(.system(size: 26, weight: .black))
            HStack(spacing: 18) {
                ForEach(PuzzleGame.categoryOrder, id: \.self) { category in
                    let labels = [
                        "dibujo": "Dibujos", "aventura": "Aventuras",
                        "heroe": "Héroes", "ciudad": "Ciudades", "gigante": "Gigantes"
                    ]
                    Button(labels[category] ?? category) {
                        host.puzzleAction("pz_categoria", ["cat": category])
                    }
                    .font(.system(size: 26, weight: .bold))
                    .foregroundColor(game.category == category ? PuzzlePalette.gold : PuzzlePalette.cream)
                }
            }
            HStack(spacing: 38) {
                VStack(spacing: 16) {
                    if let original {
                        Image(uiImage: original)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 480, height: 290)
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                            .overlay(RoundedRectangle(cornerRadius: 18)
                                .stroke(PuzzlePalette.gold, lineWidth: 3))
                    } else {
                        RoundedRectangle(cornerRadius: 18)
                            .fill(PuzzlePalette.violet)
                            .frame(width: 480, height: 290)
                            .overlay(Text("Imagen no disponible").font(.system(size: 24)))
                    }
                    HStack(spacing: 25) {
                        Button("‹ Anterior") { host.puzzleAction("pz_imagen_elegir", ["delta": -1]) }
                        Text(game.slug.replacingOccurrences(of: "-", with: " ").capitalized)
                            .font(.system(size: 26, weight: .bold))
                            .frame(maxWidth: 210)
                        Button("Siguiente ›") { host.puzzleAction("pz_imagen_elegir", ["delta": 1]) }
                    }
                }
                VStack(alignment: .leading, spacing: 24) {
                    Text("Cantidad de piezas")
                        .font(.system(size: 25, weight: .black))
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 3), spacing: 12) {
                        ForEach(game.validSizes, id: \.self) { size in
                            Button("\(size)") {
                                host.puzzleAction("pz_piezas", ["n": size])
                            }
                            .font(.system(size: 30, weight: .bold))
                            .foregroundColor(size == game.count ? PuzzlePalette.gold : PuzzlePalette.cream)
                        }
                    }
                    Button(game.rotationEnabled ? "🔄 Con giros" : "◻️ Sin giros") {
                        host.puzzleAction("pz_rotacion", ["rot": !game.rotationEnabled])
                    }
                    .font(.system(size: 27, weight: .bold))
                    Button("▶ Empezar puzzle") { host.puzzleAction("pz_inicio") }
                        .font(.system(size: 30, weight: .black))
                        .foregroundColor(PuzzlePalette.gold)
                    if game.saved {
                        Button("↪ Continuar el puzzle guardado") {
                            host.puzzleAction("pz_continuar")
                        }
                        .font(.system(size: 25, weight: .bold))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var playing: some View {
        HStack(spacing: 35) {
            VStack(alignment: .leading, spacing: 20) {
                Text(game.slug.replacingOccurrences(of: "-", with: " ").capitalized)
                    .font(.system(size: 32, weight: .black))
                    .foregroundColor(PuzzlePalette.gold)
                Text("\(game.count) piezas · \(game.solved) ubicadas correctamente")
                    .font(.system(size: 24))
                ProgressView(value: Double(game.percent), total: 100)
                    .frame(width: 350)
                    .tint(PuzzlePalette.aqua)
                Text(game.owner == nil ? "Todos pueden jugar" : "\(host.puzzleOwnerName) mueve una pieza")
                    .font(.system(size: 23, weight: .semibold))
                    .foregroundColor(PuzzlePalette.aqua)
                if let original {
                    Text("Imagen de referencia")
                        .font(.system(size: 24, weight: .bold))
                    Image(uiImage: original)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 345, height: 230)
                        .opacity(game.showReference ? 1 : 0.3)
                }
                Text("Pulsá y arrastrá desde el celular. Girá las piezas, usá zoom, guía o imagen.")
                    .font(.system(size: 23))
                    .fixedSize(horizontal: false, vertical: true)
                Button("Cambiar puzzle") { host.puzzleAction("pz_config") }
                    .font(.system(size: 26, weight: .bold))
                Spacer(minLength: 0)
            }
            .frame(width: 360, alignment: .leading)
            .padding(20)
            .background(PuzzlePalette.night, in: RoundedRectangle(cornerRadius: 20))

            GeometryReader { bounds in
                let ratio = CGFloat(max(0.3, min(3, (original?.size.width ?? 4) / (original?.size.height ?? 3))))
                let width = min(bounds.size.width - 25, (bounds.size.height - 20) * ratio)
                let height = width / ratio

                ZStack {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(PuzzlePalette.night)
                    mosaic(width: width, height: height)
                        .frame(width: width, height: height)
                        .scaleEffect(CGFloat(game.zoom))
                        .clipped()
                    if game.showReference, let original {
                        Image(uiImage: original)
                            .resizable()
                            .frame(width: width, height: height)
                            .opacity(0.25)
                            .allowsHitTesting(false)
                    }
                }
                .frame(width: width, height: height)
                .overlay(RoundedRectangle(cornerRadius: 16)
                    .stroke(PuzzlePalette.gold, lineWidth: 4))
                .position(x: bounds.size.width / 2, y: bounds.size.height / 2)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func mosaic(width: CGFloat, height: CGFloat) -> some View {
        let colWidth = width / CGFloat(game.columns)
        let rowHeight = height / CGFloat(game.rows)
        return LazyVGrid(
            columns: Array(repeating: GridItem(.fixed(colWidth), spacing: 0), count: game.columns),
            alignment: .center, spacing: 0
        ) {
            ForEach(game.tileAtSlot.indices, id: \.self) { slot in
                let tile = game.tileAtSlot[slot]
                ZStack {
                    if cropped.indices.contains(tile) {
                        Image(uiImage: cropped[tile])
                            .resizable()
                            .frame(width: colWidth, height: rowHeight)
                            .rotationEffect(.degrees(Double(game.turns[tile] * 90)))
                            .clipped()
                    } else {
                        Rectangle().fill(PuzzlePalette.violet)
                    }
                    if game.showGuide && tile != slot {
                        Rectangle()
                            .fill(PuzzlePalette.aqua.opacity(0.14))
                            .overlay(Text("\(slot + 1)")
                                .font(.system(size: max(9, min(20, colWidth * 0.3))))
                                .foregroundColor(PuzzlePalette.cream))
                    }
                    Rectangle()
                        .strokeBorder(game.hoverSlot == slot ? PuzzlePalette.gold :
                                      (tile == slot && game.turns[tile] == 0 ?
                                        PuzzlePalette.aqua.opacity(0.55) :
                                        PuzzlePalette.cream.opacity(0.2)),
                                      lineWidth: game.hoverSlot == slot ? 4 : 1)
                    if game.selectedSlot == slot {
                        Rectangle().strokeBorder(PuzzlePalette.gold, lineWidth: 5)
                    }
                }
                .frame(width: colWidth, height: rowHeight)
                .clipped()
            }
        }
        .frame(width: width, height: height, alignment: .topLeading)
    }

    private var completed: some View {
        VStack(spacing: 25) {
            Spacer()
            Text("🏆 ¡PUZZLE COMPLETO!")
                .font(.system(size: 65, weight: .black))
                .foregroundColor(PuzzlePalette.gold)
            if let original {
                Image(uiImage: original)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 410)
            }
            Text("\(game.count) piezas · \(game.moves) movimientos · \(formattedTime)")
                .font(.system(size: 32, weight: .bold))
            Button("Elegir otro puzzle") { host.puzzleAction("pz_config") }
                .font(.system(size: 28, weight: .bold))
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func reloadPictures() {
        guard let picture = UIImage(named: game.slug) else {
            original = nil
            cropped = []
            return
        }
        original = picture
        guard game.stage == .juego || game.stage == .fin,
              let source = picture.cgImage else {
            cropped = []
            return
        }
        let cols = game.columns, rows = game.rows
        let width = source.width, height = source.height
        var result = [UIImage]()
        result.reserveCapacity(game.count)
        for tile in 0..<game.count {
            let col = tile % cols, row = tile / cols
            let x0 = col * width / cols, x1 = (col + 1) * width / cols
            let y0 = row * height / rows, y1 = (row + 1) * height / rows
            let bounds = CGRect(x: x0, y: y0, width: max(1, x1 - x0), height: max(1, y1 - y0))
            if let image = source.cropping(to: bounds) {
                result.append(UIImage(cgImage: image))
            } else {
                result.append(picture)
            }
        }
        cropped = result
    }
}
