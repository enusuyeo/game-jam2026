#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REF=""
for candidate in \
  "$ROOT_DIR/assets/ui/pixel/special-bgs-2026-03-05/bg-05-normal-wall-v04.png" \
  "$ROOT_DIR/assets/ui/pixel/ending/bg-05-normal-wall-v04.png"
do
  if [[ -f "$candidate" ]]; then
    REF="$candidate"
    break
  fi
done

if [[ -z "$REF" ]]; then
  REF="$(rg --files "$ROOT_DIR/assets/ui/pixel" | rg 'bg-05-normal-wall-v04\\.png$' | head -n1 || true)"
fi

if [[ -z "$REF" || ! -f "$REF" ]]; then
  echo "reference not found: bg-05-normal-wall-v04.png" >&2
  exit 1
fi

OUT_DIR="$ROOT_DIR/assets/ui/pixel/special-bgs-2026-03-05/boss-like-normal-v04"
TMP_DIR="$OUT_DIR/.tmp"
mkdir -p "$OUT_DIR" "$TMP_DIR"

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

make_prompt() {
  local variant="$1"
  case "$variant" in
    v01)
      echo "Keep the same pixel-art atmosphere and side-wall composition, transform into a 5th-floor boss chamber with a massive demonic gate, ominous red torchlight, high contrast shadows, no characters, no text"
      ;;
    v02)
      echo "Preserve the same dungeon wall mood, turn it into a boss arena with ritual circle floor, chained pillars, crimson embers, oppressive dark fantasy tone, no characters, no text"
      ;;
    v03)
      echo "Same visual style and color mood, create a final boss room with obsidian throne silhouette and molten cracks in the stone walls, cinematic depth, no characters, no text"
      ;;
    v04)
      echo "Keep composition and pixel style, convert to boss stage with giant skull relief on back wall, iron spikes, blood-red lantern glow, gritty texture, no characters, no text"
      ;;
    v05)
      echo "Same atmosphere as source, redesign as cursed altar boss room with green-blue ghost flames and black stone architecture, dramatic side-wall perspective, no characters, no text"
      ;;
    v06)
      echo "Retain the exact pixel-art tone, make a boss battle hall with broken cathedral arches inside dungeon walls, pale moonlight entering from cracks, tense mood, no characters, no text"
      ;;
    v07)
      echo "Keep same style and framing, transform into chained prison-boss chamber with heavy iron bars, execution platform, deep red haze, no characters, no text"
      ;;
    v08)
      echo "Maintain same dungeon palette and side view, create abyssal boss room with dark void at center and floating rune stones, subtle cyan-red contrast, no characters, no text"
      ;;
    v09)
      echo "Same style family, generate a ruined royal tomb boss arena with cracked statues, ceremonial braziers, dust and ember particles, no characters, no text"
      ;;
    v10)
      echo "Preserve source mood, produce the most intense final boss chamber with colossal sealed door, layered depth fog, infernal and cyan mixed lighting, highly readable battlefield foreground, no characters, no text"
      ;;
    *)
      echo "Keep same pixel-art dungeon atmosphere and side-wall structure, transform into a unique boss chamber, no characters, no text"
      ;;
  esac
}

for n in 1 2 3 4 5 6 7 8 9 10; do
  v=$(printf "v%02d" "$n")
  raw="$TMP_DIR/raw-bg-05-boss-like-normal-v04-$v.png"
  out="$OUT_DIR/bg-05-boss-like-normal-v04-$v.png"
  prompt=$(make_prompt "$v")
  gen_with_retry "$prompt" "$raw" "$out"
done

echo "done: $OUT_DIR"
