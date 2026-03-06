#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/oganesson/game-jam2026"
OUT_DIR="${ROOT}/.recordings/scripted-15"
TMP_DIR="${OUT_DIR}/segments"
FONT="${ROOT}/.recordings/fonts/Almendra-Bold.ttf"
PYTHON_BIN="$(command -v python3)"

SRC_TITLE="${ROOT}/.recordings/sequence-battle-boss.webm"
SRC_DEFENSE="${ROOT}/.recordings/sequence-defense.webm"
SRC_BOSS="${ROOT}/.recordings/gameplay-raw-fixed.webm"
SRC_FAIL="${ROOT}/.recordings/gameplay-raw.webm"
SRC_BGM="${ROOT}/assets/bgm/bgm-floor1.mp3"

mkdir -p "${TMP_DIR}"
rm -f "${TMP_DIR}"/*.mp4 "${OUT_DIR}/concat.txt" "${OUT_DIR}/scripted-15s.mp4" "${OUT_DIR}/scripted-15s-with-bgm.mp4"

base_video() {
  local input="$1"
  local start="$2"
  local duration="$3"
  local output="$4"
  ffmpeg -y -hide_banner -loglevel warning \
    -ss "${start}" -t "${duration}" -i "${input}" \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    -an -r 30 \
    -c:v libx264 -crf 18 -preset fast -pix_fmt yuv420p \
    "${output}"
}

render_text_png() {
  local text="$1"
  local image="$2"
  TEXT_PAYLOAD="${text}" IMAGE_PATH="${image}" FONT_PATH="${FONT}" "${PYTHON_BIN}" - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import os

font_path = os.environ["FONT_PATH"]
text = os.environ["TEXT_PAYLOAD"]
img = Image.new("RGB", (1920, 1080), "black")
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(font_path, 78)
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
  local image="${output%.mp4}.png"
  render_text_png "${text}" "${image}"
  image_to_video "${image}" "${duration}" "${output}"
}

title_with_endcard() {
  local output="$1"
  local frame="${TMP_DIR}/11_end_frame.png"
  local image="${TMP_DIR}/11_end_text.png"
  ffmpeg -y -hide_banner -loglevel warning \
    -ss 0.40 -i "${SRC_TITLE}" -vframes 1 \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
    "${frame}"
  FRAME_PATH="${frame}" IMAGE_PATH="${image}" FONT_PATH="${FONT}" "${PYTHON_BIN}" - <<'PY'
from PIL import Image, ImageDraw, ImageFont
import os

img = Image.open(os.environ["FRAME_PATH"]).convert("RGB")
draw = ImageDraw.Draw(img)
font = ImageFont.truetype(os.environ["FONT_PATH"], 62)
text = "Roll. Choose. Survive."
bbox = draw.textbbox((0, 0), text, font=font)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
x = (img.width - tw) / 2
y = img.height - 150
shadow = [(x-2, y-2), (x+2, y-2), (x-2, y+2), (x+2, y+2)]
for pos in shadow:
    draw.text(pos, text, font=font, fill="black")
draw.text((x, y), text, font=font, fill="white")
img.save(os.environ["IMAGE_PATH"])
PY
  image_to_video "${image}" "1.0" "${output}"
}

text_card "1.2" "'The dice never lie.'" "${TMP_DIR}/01_quote.mp4"
base_video "${SRC_TITLE}" "0.40" "1.10" "${TMP_DIR}/02_title.mp4"
base_video "${SRC_TITLE}" "3.85" "1.70" "${TMP_DIR}/03_dice.mp4"
base_video "${SRC_TITLE}" "5.55" "1.80" "${TMP_DIR}/04_cards.mp4"
base_video "${SRC_TITLE}" "7.55" "2.60" "${TMP_DIR}/05_attack.mp4"
text_card "0.9" "Every victory has a cost." "${TMP_DIR}/06_cost.mp4"
base_video "${SRC_DEFENSE}" "4.10" "1.70" "${TMP_DIR}/07_defense.mp4"
base_video "${SRC_BOSS}" "110.00" "1.80" "${TMP_DIR}/08_boss.mp4"
base_video "${SRC_TITLE}" "2.55" "0.40" "${TMP_DIR}/09_map.mp4"
base_video "${SRC_FAIL}" "148.20" "0.80" "${TMP_DIR}/10_fail.mp4"
title_with_endcard "${TMP_DIR}/11_end.mp4"

cat > "${OUT_DIR}/concat.txt" <<EOF
file '${TMP_DIR}/01_quote.mp4'
file '${TMP_DIR}/02_title.mp4'
file '${TMP_DIR}/03_dice.mp4'
file '${TMP_DIR}/04_cards.mp4'
file '${TMP_DIR}/05_attack.mp4'
file '${TMP_DIR}/06_cost.mp4'
file '${TMP_DIR}/07_defense.mp4'
file '${TMP_DIR}/08_boss.mp4'
file '${TMP_DIR}/09_map.mp4'
file '${TMP_DIR}/10_fail.mp4'
file '${TMP_DIR}/11_end.mp4'
EOF

ffmpeg -y -hide_banner -loglevel warning \
  -f concat -safe 0 -i "${OUT_DIR}/concat.txt" \
  -an -c copy \
  "${OUT_DIR}/scripted-15s.mp4"

ffmpeg -y -hide_banner -loglevel warning \
  -i "${OUT_DIR}/scripted-15s.mp4" \
  -i "${SRC_BGM}" \
  -filter_complex "[1:a]atrim=0:15,volume='if(lt(t,1.2),0.10,0.34)',afade=t=in:st=0:d=1.2,afade=t=out:st=14.2:d=0.8[a]" \
  -map 0:v:0 -map "[a]" \
  -c:v copy -c:a aac -b:a 192k -shortest \
  "${OUT_DIR}/scripted-15s-with-bgm.mp4"

ffmpeg -y -hide_banner -loglevel warning \
  -i "${OUT_DIR}/scripted-15s-with-bgm.mp4" \
  -ss 00:00:07 -vframes 1 \
  "${OUT_DIR}/thumbnail.png"

echo "${OUT_DIR}/scripted-15s-with-bgm.mp4"
