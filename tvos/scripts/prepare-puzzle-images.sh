#!/bin/bash
set -euo pipefail
# Original Puzzle artwork from main. Convert WebP to PNG so UIKit works on tvOS 15.
cd "$(dirname "$0")/.."
mkdir -p Resources/Puzzle
BASE="https://raw.githubusercontent.com/gvelazcamp/gira-y-adivina-web/main"
for entry in \
  "puzzle:dragon" "puzzle:granja" "puzzle:golosinas" \
  "puzzle:piratas" "puzzle:egipto" "puzzle:vikingos" \
  "puzzle:princesa-hielo" "puzzle:chica-rayo" "puzzle:super-veloz" \
  "worlds:montevideo" "worlds:colonia" "worlds:buenos-aires" \
  "puzzle:mercado-puerto" "puzzle:valle-dragones" "puzzle:biblioteca-magica"
do
  family="${entry%%:*}"
  slug="${entry#*:}"
  target="Resources/Puzzle/${slug}.png"
  [ -s "$target" ] && continue
  temp="$(mktemp -t puzzle-webp).webp"
  curl --fail --location --silent --show-error --retry 3 \
    "$BASE/assets/$family/$slug.webp" --output "$temp"
  sips --setProperty format png "$temp" --out "$target" >/dev/null
  rm -f "$temp"
  [ -s "$target" ] || { echo "No image $slug"; exit 1; }
done
echo "Puzzle artwork ready: $(find Resources/Puzzle -name '*.png' | wc -l | tr -d ' ') images"
