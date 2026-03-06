#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/oganesson/game-jam2026"
OUT_DIR="${ROOT}/.recordings/newrocker-30"
TMP_DIR="${OUT_DIR}/segments"
PYTHON_BIN="$(command -v python3)"
FONT="${ROOT}/.recordings/fonts/NewRocker-Regular.ttf"
TITLE_IMAGE="${ROOT}/assets/ui/pixel/titles/title-faded-dungen-v10.png"
TITLE_SCREEN_IMAGE="${ROOT}/.recordings/inspect-title.png"
MAP_IMAGE="${ROOT}/.recordings/inspect-map.png"
SRC_MAIN="${ROOT}/.recordings/sequence-battle-boss.webm"
SRC_BOSS="${ROOT}/.recordings/gameplay-raw-fixed.webm"
SRC_FAIL="${ROOT}/.recordings/gameplay-raw.webm"
SRC_SELECT="${ROOT}/.recordings/sequence-shop.webm"
SRC_REWARD="${ROOT}/.recordings/sequence-reward-search.webm"
SRC_DEFENSE="${ROOT}/.recordings/sequence-defense.webm"
SRC_BGM="${ROOT}/assets/bgm/bgm-floor1.mp3"

mkdir -p "${TMP_DIR}"
rm -rf "${TMP_DIR}/map-montage"
rm -f "${TMP_DIR}"/* "${OUT_DIR}"/*.mp4 "${OUT_DIR}"/*.png "${OUT_DIR}"/*.txt

render_text_png() {
  local text="$1"
  local image="$2"
  local size="${3:-82}"
  TEXT_PAYLOAD="${text}" IMAGE_PATH="${image}" FONT_PATH="${FONT}" FONT_SIZE="${size}" "${PYTHON_BIN}" - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import os

img = Image.new("RGB", (1920, 1080), "black")
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(os.environ["FONT_PATH"], int(os.environ["FONT_SIZE"]))
text = os.environ["TEXT_PAYLOAD"]
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
draw.text(((1920 - tw) / 2, (1080 - th) / 2 - 18), text, fill="white", font=font)
img.save(os.environ["IMAGE_PATH"])
PY
}

image_to_video() {
  local image="$1"
  local duration="$2"
  local output="$3"
  ffmpeg -y -hide_banner -loglevel warning \
    -loop 1 -t "${duration}" -i "${image}" \
    -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
    "${output}"
}

text_card() {
  local duration="$1"
  local text="$2"
  local output="$3"
  local size="${4:-82}"
  local png="${output%.mp4}.png"
  render_text_png "${text}" "${png}" "${size}"
  image_to_video "${png}" "${duration}" "${output}"
}

clip_fill() {
  local input="$1"
  local start="$2"
  local duration="$3"
  local output="$4"
  ffmpeg -y -hide_banner -loglevel warning \
    -ss "${start}" -t "${duration}" -i "${input}" \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
    "${output}"
}

fail_clip() {
  local start="$1"
  local duration="$2"
  local output="$3"
  ffmpeg -y -hide_banner -loglevel warning \
    -ss "${start}" -t "${duration}" -i "${SRC_FAIL}" \
    -vf "crop=1152:720:0:0,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
    "${output}"
}

title_only_card() {
  local duration="$1"
  local output="$2"
  local png="${output%.mp4}.png"
  TITLE_PATH="${TITLE_IMAGE}" IMAGE_PATH="${png}" "${PYTHON_BIN}" - <<'PY'
from PIL import Image
import os

canvas = Image.new("RGBA", (1920, 1080), "black")
title = Image.open(os.environ["TITLE_PATH"]).convert("RGBA")
max_w = 1500
scale = max_w / title.width
title = title.resize((int(title.width * scale), int(title.height * scale)))
canvas.alpha_composite(title, ((1920 - title.width) // 2, (1080 - title.height) // 2 - 24))
canvas.convert("RGB").save(os.environ["IMAGE_PATH"])
PY
  image_to_video "${png}" "${duration}" "${output}"
}

still_card() {
  local image="$1"
  local duration="$2"
  local output="$3"
  ffmpeg -y -hide_banner -loglevel warning \
    -loop 1 -t "${duration}" -i "${image}" \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
    "${output}"
}

map_card() {
  local duration="$1"
  local output="$2"
  still_card "${MAP_IMAGE}" "${duration}" "${output}"
}

add_audio() {
  local input="$1"
  local output="$2"
  local total_duration="$3"
  local fade_start
  fade_start="$("${PYTHON_BIN}" - <<PY
total = float("${total_duration}")
print(f"{total - 0.6:.2f}")
PY
)"
  ffmpeg -y -hide_banner -loglevel warning \
    -i "${input}" \
    -stream_loop -1 -ss 5 -i "${SRC_BGM}" \
    -filter_complex "[1:a]atrim=0:${total_duration},volume='if(between(t,0,1.6)+between(t,12.8,14.0)+between(t,27.8,30.0),0.14,0.34)',afade=t=out:st=${fade_start}:d=0.6[a]" \
    -map 0:v:0 -map "[a]" \
    -c:v copy -c:a aac -b:a 192k -shortest \
    "${output}"
}

text_card "1.6" "\"The dice never lie.\"" "${TMP_DIR}/01_quote.mp4" 84
still_card "${TITLE_SCREEN_IMAGE}" "2.1" "${TMP_DIR}/02_title.mp4"
clip_fill "${SRC_DEFENSE}" "3.60" "1.40" "${TMP_DIR}/03_combat_a.mp4"
clip_fill "${SRC_MAIN}" "8.55" "1.45" "${TMP_DIR}/04_attack.mp4"
clip_fill "${SRC_DEFENSE}" "4.90" "1.45" "${TMP_DIR}/05_combat_b.mp4"
clip_fill "${SRC_SELECT}" "34.20" "2.70" "${TMP_DIR}/06_shop.mp4"
text_card "1.2" "\"Choose well. Bleed less.\"" "${TMP_DIR}/07_quote2.mp4" 76
map_card "0.70" "${TMP_DIR}/08_map.mp4"
clip_fill "${SRC_BOSS}" "7.40" "1.30" "${TMP_DIR}/09_boss_intro.mp4"
clip_fill "${SRC_BOSS}" "4.20" "2.40" "${TMP_DIR}/10_floor1_boss.mp4"
clip_fill "${SRC_BOSS}" "208.30" "2.40" "${TMP_DIR}/11_floor5_build.mp4"
clip_fill "${SRC_BOSS}" "213.80" "4.20" "${TMP_DIR}/12_floor5_boss.mp4"
fail_clip "148.20" "2.40" "${TMP_DIR}/13_fail.mp4"
title_only_card "2.70" "${TMP_DIR}/14_title_only.mp4"
text_card "2.20" "Roll. Choose. Survive." "${TMP_DIR}/15_final_line.mp4" 84

cat > "${OUT_DIR}/concat.txt" <<EOF
file '${TMP_DIR}/01_quote.mp4'
file '${TMP_DIR}/02_title.mp4'
file '${TMP_DIR}/03_combat_a.mp4'
file '${TMP_DIR}/04_attack.mp4'
file '${TMP_DIR}/05_combat_b.mp4'
file '${TMP_DIR}/06_shop.mp4'
file '${TMP_DIR}/07_quote2.mp4'
file '${TMP_DIR}/08_map.mp4'
file '${TMP_DIR}/09_boss_intro.mp4'
file '${TMP_DIR}/10_floor1_boss.mp4'
file '${TMP_DIR}/11_floor5_build.mp4'
file '${TMP_DIR}/12_floor5_boss.mp4'
file '${TMP_DIR}/13_fail.mp4'
file '${TMP_DIR}/14_title_only.mp4'
file '${TMP_DIR}/15_final_line.mp4'
EOF

ffmpeg -y -hide_banner -loglevel warning \
  -f concat -safe 0 -i "${OUT_DIR}/concat.txt" \
  -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
  "${OUT_DIR}/trailer-30-raw.mp4"

add_audio "${OUT_DIR}/trailer-30-raw.mp4" "${OUT_DIR}/trailer-30-newrocker-ingame.mp4" "30"

ffmpeg -y -hide_banner -loglevel warning \
  -i "${OUT_DIR}/trailer-30-newrocker-ingame.mp4" \
  -ss 00:00:26.8 -vframes 1 -update 1 \
  "${OUT_DIR}/thumbnail.png"

printf '%s\n' "${OUT_DIR}/trailer-30-newrocker-ingame.mp4"
