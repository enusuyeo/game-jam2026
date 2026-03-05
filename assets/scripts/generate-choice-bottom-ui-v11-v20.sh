#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REF="$ROOT_DIR/assets/ui/pixel/buttons/setting.png"
OUT_DIR="$ROOT_DIR/assets/ui/pixel/buttons/choice-bottom"
TMP_DIR="$OUT_DIR/.tmp"
mkdir -p "$OUT_DIR" "$TMP_DIR"

if [[ ! -f "$REF" ]]; then
  echo "reference not found: $REF" >&2
  exit 1
fi

normalize_to_1152x427() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 427 1152 "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image edit "$prompt" --input "$REF" -o "$raw" --model pro --remove-bg; then
      normalize_to_1152x427 "$raw" "$out"
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

make_prompt() {
  local v="$1"
  case "$v" in
    v11) echo "Pixel art dark fantasy bottom choice panel, black obsidian stone with antique gold trims, minimal ornament, 3 clear option zones, high readability, no text, no icons, transparent outside" ;;
    v12) echo "Pixel art bottom UI frame with thick black stone body and fine gold filigree, 3 segmented select regions, subtle cyan edge glow, no text, no icons, transparent outside" ;;
    v13) echo "Gothic dungeon style pixel panel, cracked black marble and worn gold corners, three large selectable lanes, dramatic contrast, no text, no icons, transparent outside" ;;
    v14) echo "Heavy metal-and-stone pixel HUD strip, dark charcoal plate with gilded rivets, 3 equal choice slots, clean center alignment, no text, no icons, transparent outside" ;;
    v15) echo "Ancient relic theme pixel bottom panel, black basalt slab with bright old-gold inlays, three carved compartments for choices, no text, no icons, transparent outside" ;;
    v16) echo "Refined elegant pixel choice bar, matte black stone + soft gold borders, 3 raised card sockets, premium readability for existing select boxes, no text, no icons, transparent outside" ;;
    v17) echo "Dark temple motif pixel UI, black stone arch accents and golden chain ornaments, 3 slot frame blocks with clear separators, no text, no icons, transparent outside" ;;
    v18) echo "Battle-worn pixel lower UI panel, scorched black stone, tarnished gold edges, 3 selectable field frames, strong silhouette, no text, no icons, transparent outside" ;;
    v19) echo "Cathedral-inspired pixel bottom frame, deep black granite + polished gold trims, segmented into 3 selection cells, subtle luminous highlights, no text, no icons, transparent outside" ;;
    v20) echo "Final polished variant, premium black-stone and gold fantasy panel, 3 highly readable option containers for user choices, balanced ornament, no text, no icons, transparent outside" ;;
    *) echo "Pixel art dark fantasy bottom choice frame, black stone and gold trim, three selection zones, no text, no icons, transparent outside" ;;
  esac
}

for n in 11 12 13 14 15 16 17 18 19 20; do
  v=$(printf "v%02d" "$n")
  raw="$TMP_DIR/raw-choice-bottom-$v.png"
  out="$OUT_DIR/ui-choice-bottom-$v.png"
  prompt=$(make_prompt "$v")
  gen_with_retry "$prompt" "$raw" "$out"
done

echo "done: $OUT_DIR"
