#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_BASE="$ROOT_DIR/assets/ui/pixel/map-ui"
OUT_NODE="$OUT_BASE/nodes"
OUT_LOGO="$OUT_BASE/logos"
OUT_PANEL="$OUT_BASE/panels"
TMP_DIR="$OUT_BASE/.tmp"

mkdir -p "$OUT_NODE" "$OUT_LOGO" "$OUT_PANEL" "$TMP_DIR"

normalize_square_512() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 512 512 "$out" >/dev/null
}

normalize_panel_1280x720() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 720 1280 "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local ar="$2"
  local raw="$3"
  local out="$4"
  local kind="$5"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image generate "$prompt" -o "$raw" --aspect-ratio "$ar" --style "pixel art" --model flash --remove-bg; then
      if [[ "$kind" == "square" ]]; then
        normalize_square_512 "$raw" "$out"
      else
        normalize_panel_1280x720 "$raw" "$out"
      fi
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

BASE_STYLE="pixel art dark fantasy UI style matching ornate gold frame and dark navy-black stone interior, worn metal-gold trims, clean readable silhouette, no text, no watermark"

node_prompt() {
  local v="$1"
  case "$v" in
    1) echo "$BASE_STYLE, map node icon 1:1, circular dark stone core with gold rim, subtle blue inner glow, transparent background" ;;
    2) echo "$BASE_STYLE, map node icon 1:1, diamond-shaped node with gold corner braces and navy center, transparent background" ;;
    3) echo "$BASE_STYLE, map node icon 1:1, octagonal relic node with engraved rim and dark glass center, transparent background" ;;
    4) echo "$BASE_STYLE, map node icon 1:1, chained medallion node with antique gold ring and obsidian core, transparent background" ;;
    5) echo "$BASE_STYLE, map node icon 1:1, premium ornate node with layered gold border and dark blue center, transparent background" ;;
    *) echo "$BASE_STYLE, map node icon 1:1, transparent background" ;;
  esac
}

logo_prompt() {
  local type="$1"
  local v="$2"
  case "$type" in
    boss)
      if [[ "$v" == "1" ]]; then
        echo "$BASE_STYLE, boss logo icon 1:1, skull and crown motif, gold outline, dark navy core, transparent background"
      else
        echo "$BASE_STYLE, boss logo icon 1:1, horned skull emblem with sharp gold frame, ominous blue glow, transparent background"
      fi
      ;;
    event)
      if [[ "$v" == "1" ]]; then
        echo "$BASE_STYLE, special event logo icon 1:1, star sigil and arcane circle motif, gold etched border, transparent background"
      else
        echo "$BASE_STYLE, special event logo icon 1:1, mysterious rune crystal emblem with ornate gold frame, transparent background"
      fi
      ;;
    current)
      if [[ "$v" == "1" ]]; then
        echo "$BASE_STYLE, current position logo icon 1:1, glowing locator arrow marker inside gold ring, transparent background"
      else
        echo "$BASE_STYLE, current position logo icon 1:1, compass-pointer marker with bright center pulse and gold border, transparent background"
      fi
      ;;
    *)
      echo "$BASE_STYLE, 1:1 icon, transparent background"
      ;;
  esac
}

panel_prompt() {
  local kind="$1"
  local v="$2"
  case "$kind" in
    speed)
      if [[ "$v" == "1" ]]; then
        echo "$BASE_STYLE, horizontal speed UI panel frame, long rectangle, left icon socket and right value area, empty placeholders only, transparent background outside"
      else
        echo "$BASE_STYLE, horizontal speed UI panel frame, ornate gold corners, dark blue inner plate, dedicated speed stat slot, empty placeholders only, transparent background outside"
      fi
      ;;
    name)
      if [[ "$v" == "1" ]]; then
        echo "$BASE_STYLE, horizontal character name UI panel frame, long elegant plaque, centered text area placeholder, no letters, transparent background outside"
      else
        echo "$BASE_STYLE, horizontal character name UI panel frame, engraved gold-trim plate with dark navy inset, large readable name slot placeholder, transparent background outside"
      fi
      ;;
    *)
      echo "$BASE_STYLE, horizontal panel frame, transparent background outside"
      ;;
  esac
}

# Nodes (5)
for n in 1 2 3 4 5; do
  v=$(printf "v%02d" "$n")
  prompt=$(node_prompt "$n")
  raw="$TMP_DIR/raw-map-node-${v}.png"
  out="$OUT_NODE/map-node-${v}.png"
  gen_with_retry "$prompt" "1:1" "$raw" "$out" "square"
done

# Logos (boss/event/current, each 2 versions)
for t in boss event current; do
  for n in 1 2; do
    v=$(printf "v%02d" "$n")
    prompt=$(logo_prompt "$t" "$n")
    raw="$TMP_DIR/raw-logo-${t}-${v}.png"
    out="$OUT_LOGO/logo-${t}-${v}.png"
    gen_with_retry "$prompt" "1:1" "$raw" "$out" "square"
  done
done

# Panels (speed/name, each 2 versions)
for t in speed name; do
  for n in 1 2; do
    v=$(printf "v%02d" "$n")
    prompt=$(panel_prompt "$t" "$n")
    raw="$TMP_DIR/raw-panel-${t}-${v}.png"
    out="$OUT_PANEL/panel-${t}-${v}.png"
    gen_with_retry "$prompt" "16:9" "$raw" "$out" "panel"
  done
done

echo "done: $OUT_BASE"
