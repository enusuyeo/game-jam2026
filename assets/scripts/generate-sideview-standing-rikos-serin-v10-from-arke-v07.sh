#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REF_IMG="$ROOT_DIR/assets/ui/pixel/characters/sideview/standing-sprites/ch-arke-standing-v07.png"
OUT_DIR="$ROOT_DIR/assets/ui/pixel/characters/sideview/standing-sprites"
TMP_DIR="$ROOT_DIR/assets/ui/pixel/characters/sideview/.tmp"

mkdir -p "$OUT_DIR" "$TMP_DIR"

if [[ ! -f "$REF_IMG" ]]; then
  echo "missing reference: $REF_IMG" >&2
  exit 1
fi

normalize_sheet() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  # Standing sprite-sheet target: 4:3 (1024x768)
  sips --resampleHeightWidth 768 1024 "$out" >/dev/null
}

variant_prompt() {
  local n="$1"
  case "$n" in
    1) echo "clean silhouette, base idle loop, consistent pixel density" ;;
    2) echo "battle-worn costume accents, stronger contrast, readable edges" ;;
    3) echo "ornate gear variant, premium detail pass, stable frame spacing" ;;
    4) echo "darker dramatic mood, cool rim light, crisp pose readability" ;;
    5) echo "elite polished pass, highest clarity, refined pixel clusters" ;;
    *) echo "quality pixel-art standing sheet" ;;
  esac
}

edit_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image edit "$prompt" --input "$REF_IMG" -o "$raw" --model flash --remove-bg; then
      normalize_sheet "$raw" "$out"
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

for n in 1 2 3 4 5; do
  v=$(printf "v%02d" "$n")
  vp=$(variant_prompt "$n")

  prompt_rikos="Transform this into Rikos: side-view full-body dark fantasy executioner with dual blades, facing right, standing idle motion sprite sheet, 4-frame horizontal layout, transparent background, no text, no ui, keep overall quality and pixel-art feel close to reference, ${vp}"
  raw_rikos="$TMP_DIR/raw-standing-rikos-${v}.png"
  out_rikos="$OUT_DIR/ch-rikos-standing-${v}.png"
  edit_with_retry "$prompt_rikos" "$raw_rikos" "$out_rikos"

  prompt_serin="Transform this into Serin: side-view full-body dark fantasy disruption priest with ritual staff and talismans, facing right, standing idle motion sprite sheet, 4-frame horizontal layout, transparent background, no text, no ui, keep overall quality and pixel-art feel close to reference, ${vp}"
  raw_serin="$TMP_DIR/raw-standing-serin-${v}.png"
  out_serin="$OUT_DIR/ch-serin-standing-${v}.png"
  edit_with_retry "$prompt_serin" "$raw_serin" "$out_serin"
done

echo "done: $OUT_DIR"
