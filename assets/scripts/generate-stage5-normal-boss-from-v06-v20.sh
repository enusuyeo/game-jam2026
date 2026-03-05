#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REF=""
for candidate in \
  "$ROOT_DIR/assets/ui/pixel/special-bgs-2026-03-05/boss-like-normal-v04/bg-05-boss-like-normal-v04-v06.png" \
  "$ROOT_DIR/assets/ui/pixel/background/bg-05-boss-wall.png" \
  "$ROOT_DIR/assets/ui/pixel/ending/bg-05-normal-wall-v04.png"
do
  if [[ -f "$candidate" ]]; then
    REF="$candidate"
    break
  fi
done
OUT_DIR="$ROOT_DIR/assets/ui/pixel/special-bgs-2026-03-05/stage5-normal-boss-from-v06"
TMP_DIR="$OUT_DIR/.tmp"
mkdir -p "$OUT_DIR" "$TMP_DIR"

if [[ -z "$REF" || ! -f "$REF" ]]; then
  echo "reference not found: preferred stage5 references" >&2
  exit 1
fi
echo "using reference: $REF"

normalize_to_16_9_1920x1080() {
  local in="$1"
  local out="$2"

  local w h
  w=$(sips -g pixelWidth "$in" | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$in" | awk '/pixelHeight/ {print $2}')

  if [[ -z "$w" || -z "$h" ]]; then
    echo "failed to read size: $in" >&2
    return 1
  fi

  local target_w=1920
  local target_h=1080

  local cur_cmp tgt_cmp
  cur_cmp=$((w * target_h))
  tgt_cmp=$((h * target_w))

  cp "$in" "$out"

  if (( cur_cmp > tgt_cmp )); then
    local new_w=$((h * target_w / target_h))
    sips --cropToHeightWidth "$h" "$new_w" "$out" >/dev/null
  elif (( cur_cmp < tgt_cmp )); then
    local new_h=$((w * target_h / target_w))
    sips --cropToHeightWidth "$new_h" "$w" "$out" >/dev/null
  fi

  sips --resampleHeightWidth "$target_h" "$target_w" "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image edit "$prompt" --input "$REF" -o "$raw" --model pro; then
      normalize_to_16_9_1920x1080 "$raw" "$out"
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

normal_prompt() {
  local v="$1"
  case "$v" in
    v01) echo "Keep same pixel-art style and side-wall structure, convert to stage 5 normal battle room, less oppressive than boss room, cold cyan torchlight, readable center lane, no characters, no text" ;;
    v02) echo "Preserve the same dark fantasy palette, stage 5 normal encounter hall with cracked stone walls and iron columns, moderate tension, no characters, no text" ;;
    v03) echo "Same visual family as source, regular combat chamber with chained braziers and worn obsidian floor, balanced lighting, no characters, no text" ;;
    v04) echo "Maintain source mood but for normal battle, ruined prison corridor chamber with open center area, subtle red-cyan contrast, no characters, no text" ;;
    v05) echo "Same pixel style, standard fight arena with old ritual markings faded on floor, clearer visibility than boss chamber, no characters, no text" ;;
    v06) echo "Keep composition and palette, stage 5 normal dungeon wall arena with hanging banners and broken arches, medium drama, no characters, no text" ;;
    v07) echo "Retain the source atmosphere, normal combat room with ash dust and dim lantern clusters, tactical foreground readability, no characters, no text" ;;
    v08) echo "Same side-view dungeon aesthetic, regular battle zone with deep wall recesses and spiked railings, not final-boss intensity, no characters, no text" ;;
    v09) echo "Preserve color language, normal stage 5 battlefield with grim stone terraces and chained gate in background, no characters, no text" ;;
    v10) echo "Same pixel-art tone, polished normal fight chamber variant with clearer lane separation and calmer lighting than boss room, no characters, no text" ;;
    *) echo "Keep same pixel-art mood, stage 5 normal battle room, no characters, no text" ;;
  esac
}

boss_prompt() {
  local v="$1"
  case "$v" in
    v01) echo "Keep same pixel-art style and side-wall perspective, stage 5 boss chamber with colossal sealed gate, infernal red glow, heavy atmosphere, no characters, no text" ;;
    v02) echo "Preserve source mood, boss arena with giant skull relief wall and iron spikes, high contrast and dramatic depth fog, no characters, no text" ;;
    v03) echo "Same dark fantasy pixel look, boss room with obsidian throne silhouette and molten cracks, intense cinematic lighting, no characters, no text" ;;
    v04) echo "Maintain style family, stage 5 boss battle hall with cursed altar, floating runes, deep crimson haze, no characters, no text" ;;
    v05) echo "Same dungeon palette, execution-themed boss chamber with chains, raised platform, and severe shadow contrast, no characters, no text" ;;
    v06) echo "Keep composition from source, final guardian room with massive mechanical-demonic door and cyan infernal mix light, no characters, no text" ;;
    v07) echo "Preserve pixel art atmosphere, boss stage with broken cathedral vault merged into dungeon wall, dramatic red moonlight shafts, no characters, no text" ;;
    v08) echo "Same style and tone, abyssal boss room with dark void core and ritual columns, high tension final-stage vibe, no characters, no text" ;;
    v09) echo "Retain source aesthetic, royal tomb boss arena with shattered statues and ember braziers, intense but readable foreground, no characters, no text" ;;
    v10) echo "Most intense stage 5 boss variant in same pixel style, colossal chained gate, layered smoke, infernal plus cyan highlights, no characters, no text" ;;
    *) echo "Keep same pixel-art mood, stage 5 boss chamber, no characters, no text" ;;
  esac
}

for n in 1 2 3 4 5 6 7 8 9 10; do
  v=$(printf "v%02d" "$n")
  raw="$TMP_DIR/raw-bg-05-normal-from-v06-$v.png"
  out="$OUT_DIR/bg-05-normal-from-v06-$v.png"
  prompt=$(normal_prompt "$v")
  gen_with_retry "$prompt" "$raw" "$out"
done

for n in 1 2 3 4 5 6 7 8 9 10; do
  v=$(printf "v%02d" "$n")
  raw="$TMP_DIR/raw-bg-05-boss-from-v06-$v.png"
  out="$OUT_DIR/bg-05-boss-from-v06-$v.png"
  prompt=$(boss_prompt "$v")
  gen_with_retry "$prompt" "$raw" "$out"
done

echo "done: $OUT_DIR"
