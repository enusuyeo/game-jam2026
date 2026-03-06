#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/oganesson/game-jam2026"
OUT_DIR="${ROOT}/.recordings/ingame-bgm"
TMP_DIR="${OUT_DIR}/segments"
FONT="${ROOT}/.recordings/fonts/Almendra-Bold.ttf"
PYTHON_BIN="$(command -v python3)"

SRC_MAIN="${ROOT}/.recordings/sequence-battle-boss.webm"
SRC_DEFENSE="${ROOT}/.recordings/sequence-defense.webm"
SRC_BOSS="${ROOT}/.recordings/gameplay-raw-fixed.webm"
SRC_FAIL="${ROOT}/.recordings/gameplay-raw.webm"
SRC_SHOP="${ROOT}/.recordings/sequence-shop.webm"
SRC_BGM="${ROOT}/assets/bgm/bgm-floor1.mp3"

mkdir -p "${TMP_DIR}"
rm -f "${TMP_DIR}"/*.mp4 "${TMP_DIR}"/*.png "${OUT_DIR}"/*.mp4 "${OUT_DIR}"/*.txt "${OUT_DIR}"/*.png

render_text_png() {
  local text="$1"
  local image="$2"
  local size="${3:-78}"
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
draw.text(((1920 - tw) / 2, (1080 - th) / 2 - 8), text, fill="white", font=font)
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
  local size="${4:-78}"
  local image="${output%.mp4}.png"
  render_text_png "${text}" "${image}" "${size}"
  image_to_video "${image}" "${duration}" "${output}"
}

base_video() {
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

title_endcard() {
  local input="$1"
  local start="$2"
  local duration="$3"
  local text="$4"
  local output="$5"
  local frame="${TMP_DIR}/$(basename "${output%.mp4}")_frame.png"
  local image="${TMP_DIR}/$(basename "${output%.mp4}")_text.png"
  ffmpeg -y -hide_banner -loglevel warning \
    -ss "${start}" -i "${input}" -vframes 1 -update 1 \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    "${frame}"
  FRAME_PATH="${frame}" IMAGE_PATH="${image}" FONT_PATH="${FONT}" TEXT_PAYLOAD="${text}" "${PYTHON_BIN}" - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import os

img = Image.open(os.environ["FRAME_PATH"]).convert("RGB")
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(os.environ["FONT_PATH"], 62)
text = os.environ["TEXT_PAYLOAD"]
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
x = (img.width - tw) / 2
y = img.height - 150
for dx, dy in [(-2,-2),(2,-2),(-2,2),(2,2)]:
    draw.text((x+dx, y+dy), text, font=font, fill="black")
draw.text((x, y), text, font=font, fill="white")
img.save(os.environ["IMAGE_PATH"])
PY
  image_to_video "${image}" "${duration}" "${output}"
}

add_bgm() {
  local input="$1"
  local output="$2"
  local total_duration="$3"
  local low_expr="$4"
  local fade_start
  fade_start="$("${PYTHON_BIN}" - <<PY
total = float("${total_duration}")
print(f"{total - 0.8:.2f}")
PY
)"
  ffmpeg -y -hide_banner -loglevel warning \
    -i "${input}" \
    -stream_loop -1 -ss 5 -i "${SRC_BGM}" \
    -filter_complex "[1:a]atrim=0:${total_duration},volume='${low_expr}',afade=t=out:st=${fade_start}:d=0.8[a]" \
    -map 0:v:0 -map "[a]" \
    -c:v copy -c:a aac -b:a 192k -shortest \
    "${output}"
}

build_concat() {
  local list_file="$1"
  shift
  : > "${list_file}"
  for file in "$@"; do
    printf "file '%s'\n" "${file}" >> "${list_file}"
  done
}

# 15s
text_card "1.2" "'The dice never lie.'" "${TMP_DIR}/15_01_quote.mp4"
base_video "${SRC_MAIN}" "0.40" "1.10" "${TMP_DIR}/15_02_title.mp4"
base_video "${SRC_MAIN}" "3.85" "1.70" "${TMP_DIR}/15_03_dice.mp4"
base_video "${SRC_MAIN}" "5.55" "1.80" "${TMP_DIR}/15_04_cards.mp4"
base_video "${SRC_MAIN}" "7.55" "2.60" "${TMP_DIR}/15_05_attack.mp4"
text_card "0.9" "Every victory has a cost." "${TMP_DIR}/15_06_cost.mp4" 72
base_video "${SRC_DEFENSE}" "4.10" "1.70" "${TMP_DIR}/15_07_defense.mp4"
base_video "${SRC_BOSS}" "110.00" "1.80" "${TMP_DIR}/15_08_boss.mp4"
base_video "${SRC_MAIN}" "2.55" "0.40" "${TMP_DIR}/15_09_map.mp4"
base_video "${SRC_FAIL}" "148.20" "0.80" "${TMP_DIR}/15_10_fail.mp4"
title_endcard "${SRC_MAIN}" "0.40" "1.0" "Roll. Choose. Survive." "${TMP_DIR}/15_11_end.mp4"
build_concat "${OUT_DIR}/concat_15.txt" \
  "${TMP_DIR}/15_01_quote.mp4" "${TMP_DIR}/15_02_title.mp4" "${TMP_DIR}/15_03_dice.mp4" \
  "${TMP_DIR}/15_04_cards.mp4" "${TMP_DIR}/15_05_attack.mp4" "${TMP_DIR}/15_06_cost.mp4" \
  "${TMP_DIR}/15_07_defense.mp4" "${TMP_DIR}/15_08_boss.mp4" "${TMP_DIR}/15_09_map.mp4" \
  "${TMP_DIR}/15_10_fail.mp4" "${TMP_DIR}/15_11_end.mp4"
ffmpeg -y -hide_banner -loglevel warning \
  -f concat -safe 0 -i "${OUT_DIR}/concat_15.txt" \
  -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
  "${OUT_DIR}/trailer-15-raw.mp4"
add_bgm "${OUT_DIR}/trailer-15-raw.mp4" "${OUT_DIR}/trailer-15-ingame-bgm.mp4" "15" "if(between(t,0,1.2)+between(t,8.4,9.3),0.14,0.34)"

# 30s
text_card "1.5" "'The dice never lie.'" "${TMP_DIR}/30_01_quote.mp4"
base_video "${SRC_MAIN}" "0.35" "1.50" "${TMP_DIR}/30_02_title.mp4"
base_video "${SRC_MAIN}" "3.10" "2.50" "${TMP_DIR}/30_03_enemy.mp4"
base_video "${SRC_MAIN}" "3.85" "2.50" "${TMP_DIR}/30_04_dice.mp4"
base_video "${SRC_MAIN}" "5.55" "2.50" "${TMP_DIR}/30_05_cards.mp4"
base_video "${SRC_MAIN}" "7.55" "3.00" "${TMP_DIR}/30_06_attack.mp4"
text_card "1.0" "'Choose well. Bleed less.'" "${TMP_DIR}/30_07_quote2.mp4" 70
base_video "${SRC_DEFENSE}" "4.10" "2.00" "${TMP_DIR}/30_08_defense.mp4"
base_video "${SRC_SHOP}" "1.20" "2.00" "${TMP_DIR}/30_09_growth.mp4"
base_video "${SRC_SHOP}" "3.20" "2.00" "${TMP_DIR}/30_10_shop.mp4"
text_card "1.0" "Only the living choose again." "${TMP_DIR}/30_11_line.mp4" 68
base_video "${SRC_BOSS}" "108.60" "3.00" "${TMP_DIR}/30_12_boss_intro.mp4"
base_video "${SRC_BOSS}" "111.60" "2.00" "${TMP_DIR}/30_13_boss_play.mp4"
base_video "${SRC_MAIN}" "2.55" "0.80" "${TMP_DIR}/30_14_map.mp4"
base_video "${SRC_FAIL}" "148.20" "1.00" "${TMP_DIR}/30_15_fail.mp4"
text_card "0.9" "Every victory has a cost." "${TMP_DIR}/30_16_cost.mp4" 72
title_endcard "${SRC_MAIN}" "0.40" "0.8" "Roll. Choose. Survive." "${TMP_DIR}/30_17_end.mp4"
build_concat "${OUT_DIR}/concat_30.txt" \
  "${TMP_DIR}/30_01_quote.mp4" "${TMP_DIR}/30_02_title.mp4" "${TMP_DIR}/30_03_enemy.mp4" \
  "${TMP_DIR}/30_04_dice.mp4" "${TMP_DIR}/30_05_cards.mp4" "${TMP_DIR}/30_06_attack.mp4" \
  "${TMP_DIR}/30_07_quote2.mp4" "${TMP_DIR}/30_08_defense.mp4" "${TMP_DIR}/30_09_growth.mp4" \
  "${TMP_DIR}/30_10_shop.mp4" "${TMP_DIR}/30_11_line.mp4" "${TMP_DIR}/30_12_boss_intro.mp4" \
  "${TMP_DIR}/30_13_boss_play.mp4" "${TMP_DIR}/30_14_map.mp4" "${TMP_DIR}/30_15_fail.mp4" \
  "${TMP_DIR}/30_16_cost.mp4" "${TMP_DIR}/30_17_end.mp4"
ffmpeg -y -hide_banner -loglevel warning \
  -f concat -safe 0 -i "${OUT_DIR}/concat_30.txt" \
  -an -r 30 -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
  "${OUT_DIR}/trailer-30-raw.mp4"
add_bgm "${OUT_DIR}/trailer-30-raw.mp4" "${OUT_DIR}/trailer-30-ingame-bgm.mp4" "30" "if(between(t,0,1.5)+between(t,13.5,14.5)+between(t,20.5,21.5)+between(t,28.3,29.2),0.14,0.34)"

ffmpeg -y -hide_banner -loglevel warning -i "${OUT_DIR}/trailer-15-ingame-bgm.mp4" -ss 00:00:07 -vframes 1 -update 1 "${OUT_DIR}/thumbnail-15.png"
ffmpeg -y -hide_banner -loglevel warning -i "${OUT_DIR}/trailer-30-ingame-bgm.mp4" -ss 00:00:12 -vframes 1 -update 1 "${OUT_DIR}/thumbnail-30.png"

printf '%s\n' "${OUT_DIR}/trailer-15-ingame-bgm.mp4"
printf '%s\n' "${OUT_DIR}/trailer-30-ingame-bgm.mp4"
