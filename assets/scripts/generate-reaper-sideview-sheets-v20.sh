#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/assets/ui/pixel/enemies/reaper"
TMP_DIR="$OUT_DIR/.tmp"

mkdir -p "$OUT_DIR" "$TMP_DIR"

normalize_to_1024x768() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  # width=1024, height=768
  sips --resampleHeightWidth 768 1024 "$out" >/dev/null
}

variant_prompt() {
  local n="$1"
  case "$n" in
    1) echo "deep hood, skull-like face shadow, long two-hand reaper scythe with curved blade" ;;
    2) echo "torn hood edge, glowing eyes, thin scythe shaft, sharp crescent blade" ;;
    3) echo "bone mask under hood, ragged robe hem, heavy broad scythe head" ;;
    4) echo "chain ornaments on robe, dark spectral aura, long farming-scourge style scythe" ;;
    5) echo "narrow hood silhouette, pale ghost mist near feet, elongated scythe arc" ;;
    6) echo "layered black robe folds, skeletal hand grip, chipped cursed scythe blade" ;;
    7) echo "cowl hood with rune trim, dim cyan eye glow, asymmetrical scythe curve" ;;
    8) echo "ragged cloak split tails, floating cloth motion, tall reaper polearm scythe" ;;
    9) echo "masked skull visage, restrained shoulder armor accents, heavy moon-shaped scythe" ;;
    10) echo "wide hood shadow, cloth belt charms, dark steel scythe with long handle" ;;
    11) echo "weathered robe texture, faint blue rim light, hooked scythe silhouette" ;;
    12) echo "hooded wraith look, drifting ash particles, reinforced scythe neck and blade" ;;
    13) echo "thin skeletal profile under robe, torn sleeves, ceremonial grim scythe" ;;
    14) echo "thicker cloak volume, subtle chain links, brutal reaper scythe blade profile" ;;
    15) echo "beaked skull mask style, smoke-like trailing robe, wicked crescent scythe" ;;
    16) echo "heavy cowl and mantle, gloom aura, broad chipped execution scythe" ;;
    17) echo "dark priest-reaper silhouette, occult rune glow, long elegant scythe" ;;
    18) echo "lean hooded specter shape, frayed robe ribbons, hooked harvest scythe" ;;
    19) echo "scarred bone mask, deep shadowed hood, dense iron scythe head" ;;
    20) echo "elite grim reaper variant, strongest hood silhouette, iconic oversized scythe" ;;
    *) echo "hooded grim reaper with skull visage and curved scythe, medium variation" ;;
  esac
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image generate "$prompt" -o "$raw" --aspect-ratio 4:3 --style "pixel art" --model flash --remove-bg; then
      normalize_to_1024x768 "$raw" "$out"
      echo "ok: $out"
      return 0
    fi
    echo "retry($try/$max_try): $out"
    try=$((try + 1))
    sleep 1
  done

  echo "failed: $out" >&2
  return 1
}

if [[ "$#" -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=($(seq 1 20))
fi

for n in "${TARGETS[@]}"; do
  v="$(printf "v%02d" "$n")"
  vp="$(variant_prompt "$n")"
  prompt="pixel art dark fantasy grim reaper enemy side-view full body sprite sheet, SINGLE ROW ONLY with 4 columns idle motion frames, NOT 2 rows, NOT stacked grid, facing right, consistent silhouette across 4 frames, medium variation from baseline style, hooded death spirit, skull-like face or bone mask, tattered black robe, spectral grim mood, MUST hold a large curved scythe weapon clearly visible, NO sword, NO shield, NO knight warrior look, transparent background, no text, no ui, no watermark, keep dark steel and charcoal palette, restrained blue-gray highlights, 4 evenly spaced horizontal frames in one row, ${vp}"

  raw="$TMP_DIR/raw-en-reaper-sideview-sheet-${v}.png"
  out="$OUT_DIR/en-reaper-sideview-sheet-${v}.png"
  gen_with_retry "$prompt" "$raw" "$out"
done

echo "done: $OUT_DIR"
