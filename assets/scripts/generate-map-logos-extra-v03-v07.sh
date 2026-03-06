#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_DIR="$ROOT_DIR/assets/ui/pixel/map-ui/logos"
TMP_DIR="$ROOT_DIR/assets/ui/pixel/map-ui/.tmp"

mkdir -p "$OUT_DIR" "$TMP_DIR"

REF_BOSS="$OUT_DIR/logo-boss-v01.png"
REF_EVENT="$OUT_DIR/logo-event-v01.png"
REF_CURRENT="$OUT_DIR/logo-current-v01.png"

for ref in "$REF_BOSS" "$REF_EVENT" "$REF_CURRENT"; do
  if [[ ! -f "$ref" ]]; then
    echo "missing reference: $ref" >&2
    exit 1
  fi
done

normalize_square_512() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 512 512 "$out" >/dev/null
}

variant_prompt() {
  local n="$1"
  case "$n" in
    3) echo "clean silhouette, balanced ornament density, high readability" ;;
    4) echo "richer gold trim details, slightly stronger inner glow, premium finish" ;;
    5) echo "battle-worn metal texture, subtle scratches, moody contrast" ;;
    6) echo "arcane rune accents, restrained cyan highlight, dark navy core" ;;
    7) echo "elite final variant with ornate corners and polished gold edgework" ;;
    *) echo "same style family variation" ;;
  esac
}

edit_with_retry() {
  local prompt="$1"
  local input="$2"
  local raw="$3"
  local out="$4"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image edit "$prompt" --input "$input" -o "$raw" --model flash --remove-bg; then
      normalize_square_512 "$raw" "$out"
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

for n in 3 4 5 6 7; do
  v=$(printf "v%02d" "$n")
  vp="$(variant_prompt "$n")"

  prompt_boss="Create a new boss logo icon variant in the exact same pixel-art style family as the reference: dark navy-black stone core with antique gold frame, skull/crown or horned-emblem boss identity, transparent background, no text, no watermark, ${vp}"
  raw_boss="$TMP_DIR/raw-logo-boss-${v}.png"
  out_boss="$OUT_DIR/logo-boss-${v}.png"
  edit_with_retry "$prompt_boss" "$REF_BOSS" "$raw_boss" "$out_boss"

  prompt_event="Create a new special event logo icon variant in the exact same pixel-art style family as the reference: arcane/rune event identity, gold trim and dark core, transparent background, no text, no watermark, ${vp}"
  raw_event="$TMP_DIR/raw-logo-event-${v}.png"
  out_event="$OUT_DIR/logo-event-${v}.png"
  edit_with_retry "$prompt_event" "$REF_EVENT" "$raw_event" "$out_event"

  prompt_current="Create a new current position logo icon variant in the exact same pixel-art style family as the reference: locator/compass marker identity, luminous center cue, gold frame and dark core, transparent background, no text, no watermark, ${vp}"
  raw_current="$TMP_DIR/raw-logo-current-${v}.png"
  out_current="$OUT_DIR/logo-current-${v}.png"
  edit_with_retry "$prompt_current" "$REF_CURRENT" "$raw_current" "$out_current"
done

echo "done: $OUT_DIR"
