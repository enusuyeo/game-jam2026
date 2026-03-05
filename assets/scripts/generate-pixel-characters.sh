#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   cd /Users/yeoeunsu/Documents/game-jam
#   bash assets/scripts/generate-pixel-characters.sh

# Based on design/story-spec.md Party Cast (first 3 for 3-character party):
# - 아르케 (전위 수호)
# - 리코스 (근접 처형)
# - 세린 (교란 사제)

OUT_DIR="assets/sprites/pixel-party"
mkdir -p "$OUT_DIR"

# 아르케 (frontline guardian)
codeb cg image generate "pixel art full-body character, Arke frontline guardian, large shield, underworld armor, stylized heroic proportion, dynamic 3/4 pose, transparent background" \
  -o "$OUT_DIR/ch-arke-v01.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art full-body character, Arke guardian battle pose, shield raised, dark mythic palette, polished pixel details, transparent background" \
  -o "$OUT_DIR/ch-arke-v02.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art full-body character, Arke idle pose, cape and shield silhouette clear, game-ready sprite illustration, transparent background" \
  -o "$OUT_DIR/ch-arke-v03.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art bust portrait, Arke close-up, strong facial expression, dark fantasy, transparent background" \
  -o "$OUT_DIR/ch-arke-v04.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg

# 리코스 (melee executioner)
codeb cg image generate "pixel art full-body character, Rikos melee executioner, dual blades, blood-themed accents, stylized heroic proportion, transparent background" \
  -o "$OUT_DIR/ch-rikos-v01.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art full-body character, Rikos attack pose, slash motion silhouette, underworld rogue armor, transparent background" \
  -o "$OUT_DIR/ch-rikos-v02.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art full-body character, Rikos idle pose, executioner stance, clean sprite readability, transparent background" \
  -o "$OUT_DIR/ch-rikos-v03.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art bust portrait, Rikos fierce expression, dark red rim light, transparent background" \
  -o "$OUT_DIR/ch-rikos-v04.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg

# 세린 (disruption priest)
codeb cg image generate "pixel art full-body character, Serin disruption priest, ritual staff and talismans, elegant dark clergy design, heroic proportion, transparent background" \
  -o "$OUT_DIR/ch-serin-v01.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art full-body character, Serin casting pose, debuff magic aura, purple holy-light contrast, transparent background" \
  -o "$OUT_DIR/ch-serin-v02.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art full-body character, Serin idle pose, robe silhouette readable, game-ready sprite illustration, transparent background" \
  -o "$OUT_DIR/ch-serin-v03.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg
codeb cg image generate "pixel art bust portrait, Serin calm but dangerous expression, occult ornaments, transparent background" \
  -o "$OUT_DIR/ch-serin-v04.png" --aspect-ratio 3:4 --style "pixel art" --model pro --remove-bg

echo "done: $OUT_DIR"
