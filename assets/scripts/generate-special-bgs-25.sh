#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-assets/ui/pixel/special-bgs-2026-03-05}"
TMP_DIR="$OUT_DIR/.tmp"
mkdir -p "$OUT_DIR" "$TMP_DIR"

read_wh() {
  local file="$1"
  local w h
  w="$(sips -g pixelWidth "$file" | awk '/pixelWidth/ {print $2}')"
  h="$(sips -g pixelHeight "$file" | awk '/pixelHeight/ {print $2}')"
  echo "$w $h"
}

normalize_to_16_9_1920x1080() {
  local src="$1"
  local dst="$2"
  local w h crop_w crop_h crop_out
  read -r w h < <(read_wh "$src")

  crop_w="$w"
  crop_h="$h"

  if (( w * 9 > h * 16 )); then
    crop_w=$(( h * 16 / 9 ))
  elif (( w * 9 < h * 16 )); then
    crop_h=$(( w * 9 / 16 ))
  fi

  crop_out="$TMP_DIR/crop-$(basename "$dst")"
  if (( crop_w == w && crop_h == h )); then
    cp "$src" "$crop_out"
  else
    sips -c "$crop_h" "$crop_w" "$src" --out "$crop_out" >/dev/null
  fi

  sips -z 1080 1920 "$crop_out" --out "$dst" >/dev/null
  rm -f "$crop_out"
}

gen_with_retry() {
  local prompt="$1"
  local final_out="$2"
  local tries=0
  local max_tries=4
  local raw_out="$TMP_DIR/raw-$(basename "$final_out")"

  while true; do
    tries=$((tries + 1))
    if codeb cg image generate "$prompt" -o "$raw_out" --aspect-ratio 16:9 --style "pixel art" --model flash; then
      normalize_to_16_9_1920x1080 "$raw_out" "$final_out"
      rm -f "$raw_out"
      echo "ok: $final_out"
      return 0
    fi
    if [[ "$tries" -ge "$max_tries" ]]; then
      echo "failed: $final_out (after $tries attempts)" >&2
      rm -f "$raw_out"
      return 1
    fi
    sleep 2
  done
}

# 1) bg-04-boss-wall (Floor 4 boss battle)
gen_with_retry "pixel art side-view floor 4 boss battle background, hall of judgment wall, tribunal stone arches, red verdict torches, dramatic center arena, no text, no ui, no characters" "$OUT_DIR/bg-04-boss-wall-v01.png"
gen_with_retry "pixel art side-view floor 4 boss battle background, cracked court wall with scales motif relief, crimson flame braziers, no text, no ui, no characters" "$OUT_DIR/bg-04-boss-wall-v02.png"
gen_with_retry "pixel art side-view floor 4 boss battle background, severe marble judgment hall, chained columns and red glow, no text, no ui, no characters" "$OUT_DIR/bg-04-boss-wall-v03.png"
gen_with_retry "pixel art side-view floor 4 boss battle background, dark courtroom ruins wall, broken statues and verdict fire, no text, no ui, no characters" "$OUT_DIR/bg-04-boss-wall-v04.png"
gen_with_retry "pixel art side-view floor 4 boss battle background, monumental tribunal gate wall, infernal red lighting, no text, no ui, no characters" "$OUT_DIR/bg-04-boss-wall-v05.png"

# 2) bg-05-normal-wall (Floor 5 normal battle)
gen_with_retry "pixel art side-view floor 5 normal battle background, gatekeeper district wall, obsidian stones and blue flames, no text, no ui, no characters" "$OUT_DIR/bg-05-normal-wall-v01.png"
gen_with_retry "pixel art side-view floor 5 normal battle background, ritual corridor wall with lock runes, dim lava reflections, no text, no ui, no characters" "$OUT_DIR/bg-05-normal-wall-v02.png"
gen_with_retry "pixel art side-view floor 5 normal battle background, ancient guardian wall with hanging chains and sigils, no text, no ui, no characters" "$OUT_DIR/bg-05-normal-wall-v03.png"
gen_with_retry "pixel art side-view floor 5 normal battle background, abyss gate hallway wall, cracked obsidian and eerie cyan light, no text, no ui, no characters" "$OUT_DIR/bg-05-normal-wall-v04.png"
gen_with_retry "pixel art side-view floor 5 normal battle background, final floor dungeon wall with locked altar recesses, no text, no ui, no characters" "$OUT_DIR/bg-05-normal-wall-v05.png"

# 3) bg-05-boss-wall (Floor 5 final boss, most important)
gen_with_retry "pixel art side-view final boss background, floor 5 gatekeeper throne wall, gigantic lock sigil at center, ultra dramatic lighting, no text, no ui, no characters" "$OUT_DIR/bg-05-boss-wall-v01.png"
gen_with_retry "pixel art side-view final boss background, monumental obsidian wall with glowing lock core, blue fire and lava cracks, no text, no ui, no characters" "$OUT_DIR/bg-05-boss-wall-v02.png"
gen_with_retry "pixel art side-view final boss background, ritual fortress wall, colossal gate emblem and demonic sculptures, no text, no ui, no characters" "$OUT_DIR/bg-05-boss-wall-v03.png"
gen_with_retry "pixel art side-view final boss background, cathedral-like underworld wall with arcane lock circle, dramatic shadows, no text, no ui, no characters" "$OUT_DIR/bg-05-boss-wall-v04.png"
gen_with_retry "pixel art side-view final boss background, ultimate altar wall with massive chained lock and abyss glow, no text, no ui, no characters" "$OUT_DIR/bg-05-boss-wall-v05.png"

# 4) bg-ending-true (true ending)
gen_with_retry "pixel art true ending background, dawn light entering ruined dungeon gate, broken chains, hopeful atmosphere, no text, no ui, no characters" "$OUT_DIR/bg-ending-true-v01.png"
gen_with_retry "pixel art true ending background, escape to surface scene with sunrise over ancient gate, calm blue sky, no text, no ui, no characters" "$OUT_DIR/bg-ending-true-v02.png"
gen_with_retry "pixel art true ending background, open gate and fading curse sigils, warm golden rays, no text, no ui, no characters" "$OUT_DIR/bg-ending-true-v03.png"
gen_with_retry "pixel art true ending background, cliffside exit from underworld with soft morning light, no text, no ui, no characters" "$OUT_DIR/bg-ending-true-v04.png"
gen_with_retry "pixel art true ending background, shattered lock monument with bright horizon, victory mood, no text, no ui, no characters" "$OUT_DIR/bg-ending-true-v05.png"

# 5) bg-ending-fail (fail ending)
gen_with_retry "pixel art fail ending background, collapsing dungeon abyss, dark purple storm and falling debris, despair mood, no text, no ui, no characters" "$OUT_DIR/bg-ending-fail-v01.png"
gen_with_retry "pixel art fail ending background, loop reset chamber with reactivating lock sigils, ominous red glow, no text, no ui, no characters" "$OUT_DIR/bg-ending-fail-v02.png"
gen_with_retry "pixel art fail ending background, deep prison pit with sealing gate, hopeless atmosphere, no text, no ui, no characters" "$OUT_DIR/bg-ending-fail-v03.png"
gen_with_retry "pixel art fail ending background, underworld void corridor swallowing light, dark cyan and crimson tones, no text, no ui, no characters" "$OUT_DIR/bg-ending-fail-v04.png"
gen_with_retry "pixel art fail ending background, chained altar resetting the curse, heavy shadow and ember dust, no text, no ui, no characters" "$OUT_DIR/bg-ending-fail-v05.png"

echo "done: $OUT_DIR"
