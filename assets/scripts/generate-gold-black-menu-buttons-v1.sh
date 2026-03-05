#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REF="$ROOT_DIR/assets/ui/pixel/titles/title-faded-dungen-v10.png"
OUT_DIR="$ROOT_DIR/assets/ui/pixel/buttons/faded-dungen-gold-black"
TMP_DIR="$OUT_DIR/.tmp"
mkdir -p "$OUT_DIR" "$TMP_DIR"

if [[ ! -f "$REF" ]]; then
  echo "reference not found: $REF" >&2
  exit 1
fi

normalize_to_1408x768() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 768 1408 "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image edit "$prompt" --input "$REF" -o "$raw" --model pro; then
      normalize_to_1408x768 "$raw" "$out"
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
  "Create a single horizontal pixel-art game UI button in the same style family as this title image: black stone base, antique gold trims, engraved serif text START, dark fantasy mood, centered composition, no character, no extra logo, no watermark" \
  "$TMP_DIR/raw-btn-start-v01.png" \
  "$OUT_DIR/btn-start-gold-black-v01.png"

gen_with_retry \
  "Create a single horizontal pixel-art game UI button in the same style family as this title image: black stone base, antique gold trims, engraved serif text SETTINGS, dark fantasy mood, centered composition, no character, no extra logo, no watermark" \
  "$TMP_DIR/raw-btn-settings-v01.png" \
  "$OUT_DIR/btn-settings-gold-black-v01.png"

gen_with_retry \
  "Create a single horizontal pixel-art game UI button in the same style family as this title image: black stone base, antique gold trims, engraved serif text DECK DETAILS, dark fantasy mood, centered composition, no character, no extra logo, no watermark" \
  "$TMP_DIR/raw-btn-deck-details-v01.png" \
  "$OUT_DIR/btn-deck-details-gold-black-v01.png"

echo "done: $OUT_DIR"
