#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="assets/ui/pixel/buttons/faded-dungen"
TMP_DIR="$OUT_DIR/.tmp"
mkdir -p "$OUT_DIR" "$TMP_DIR"

BASE_STYLE="pixel art UI button sprite for a dark fantasy dungeon card game, same visual style family as the 'Faded Dungen' title logo: worn stone-metal texture, muted cyan/teal highlights, subtle pale-gold rim light, clean readable silhouette, crisp pixel edges, 2D game asset, centered composition, no scene background, no watermark"

normalize_png() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image generate "$prompt" -o "$raw" --style "pixel art" --model pro --remove-bg; then
      normalize_png "$raw" "$out"
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
  local variant="$1"
  case "$variant" in
    v01)
      echo "$BASE_STYLE, wide horizontal start button, engraved text 'START', ancient rune corners, soft cyan glow, transparent background"
      ;;
    v02)
      echo "$BASE_STYLE, wide horizontal start button, engraved text 'GAME START', chained metal frame, cracked enamel center, transparent background"
      ;;
    v03)
      echo "$BASE_STYLE, wide horizontal start button, text 'START', obsidian slab body, ember pixels on edges, dramatic contrast, transparent background"
      ;;
    v04)
      echo "$BASE_STYLE, wide horizontal start button, text 'START', bone-and-brass ornament frame, subtle foggy cyan aura, transparent background"
      ;;
    v05)
      echo "$BASE_STYLE, wide horizontal start button, text 'BEGIN', relic shrine motif, polished worn-steel plate, high readability, transparent background"
      ;;
    *)
      echo "$BASE_STYLE, wide horizontal start button, text 'START', transparent background"
      ;;
  esac
}

for n in 1 2 3 4 5; do
  v=$(printf "v%02d" "$n")
  raw="$TMP_DIR/raw-btn-start-faded-dungen-$v.png"
  out="$OUT_DIR/btn-start-faded-dungen-$v.png"
  prompt=$(make_prompt "$v")
  gen_with_retry "$prompt" "$raw" "$out"
done

echo "done: $OUT_DIR"
