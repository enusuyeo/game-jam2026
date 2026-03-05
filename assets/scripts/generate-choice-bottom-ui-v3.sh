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

gen_with_retry \
  "Transform this into a bottom-choice UI panel in the same visual style: pixel art dark fantasy, black stone base with antique gold trims, wide horizontal panel, exactly 3 selectable choice slots, slot separators clearly visible, no text, no icons, transparent background outside panel" \
  "$TMP_DIR/raw-choice-bottom-v01.png" \
  "$OUT_DIR/ui-choice-bottom-v01.png"

gen_with_retry \
  "Transform this into a bottom-choice UI panel in the same visual style: pixel art dark fantasy, black stone and gold ornament frame, 3 raised button-like choice slots, subtle glow accents, clean readability, no text, no icons, transparent background outside panel" \
  "$TMP_DIR/raw-choice-bottom-v02.png" \
  "$OUT_DIR/ui-choice-bottom-v02.png"

gen_with_retry \
  "Transform this into a bottom-choice UI panel in the same visual style: pixel art black obsidian stone + worn gold metal, segmented lower HUD style, 3 large choice cards area with decorative corners, no text, no icons, transparent background outside panel" \
  "$TMP_DIR/raw-choice-bottom-v03.png" \
  "$OUT_DIR/ui-choice-bottom-v03.png"

echo "done: $OUT_DIR"
