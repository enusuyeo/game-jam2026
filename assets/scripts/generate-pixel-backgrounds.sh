#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   cd /Users/yeoeunsu/Documents/game-jam
#   bash assets/scripts/generate-pixel-backgrounds.sh

OUT_DIR="assets/ui/pixel/backgrounds"
mkdir -p "$OUT_DIR"

codeb cg image generate "pixel art dungeon corridor background, ancient stone, blue torchlight, side-view game stage, no characters" \
  -o "$OUT_DIR/bg-dungeon-v01.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art ruined dungeon hall background, cracked pillars, hanging chains, purple-blue mist, no characters" \
  -o "$OUT_DIR/bg-dungeon-v02.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art deep tartaros dungeon gate background, glowing runes, cold light, no characters" \
  -o "$OUT_DIR/bg-dungeon-v03.png" --aspect-ratio 16:9 --style "pixel art" --model flash

codeb cg image generate "pixel art prison cell block background, iron bars, damp wall, dark torch shadows, no characters" \
  -o "$OUT_DIR/bg-prison-v01.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art dark prison block background, chained walls, narrow cell corridor, heavy shadows, no characters" \
  -o "$OUT_DIR/bg-prison-v02.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art abandoned jail chamber background, broken bars, dripping water, eerie red lamp, no characters" \
  -o "$OUT_DIR/bg-prison-v03.png" --aspect-ratio 16:9 --style "pixel art" --model flash

codeb cg image generate "pixel art infernal merchant room background, mysterious shop stall, hanging trinkets, warm lanterns, no characters" \
  -o "$OUT_DIR/bg-merchant-v01.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art underworld trader corner background, wooden counter, cursed relic shelves, coin glow, no characters" \
  -o "$OUT_DIR/bg-merchant-v02.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art shadow market room background, occult merchant tent interior, candles, purple smoke, no characters" \
  -o "$OUT_DIR/bg-merchant-v03.png" --aspect-ratio 16:9 --style "pixel art" --model flash

codeb cg image generate "pixel art ferry dock background in underworld river, small boat, black water, mist, no characters" \
  -o "$OUT_DIR/bg-ferry-v01.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art underworld ferry pier background, chained boat, river styx feeling, green fog, no characters" \
  -o "$OUT_DIR/bg-ferry-v02.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art ghostly boat crossing background, moonlit underworld riverbank, lantern reflections, no characters" \
  -o "$OUT_DIR/bg-ferry-v03.png" --aspect-ratio 16:9 --style "pixel art" --model flash

codeb cg image generate "pixel art reward chamber background, sacred pedestal, treasure glow, clean center area, no characters" \
  -o "$OUT_DIR/bg-reward-v01.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art relic reward room background, altar with runic light, ornate floor, no characters" \
  -o "$OUT_DIR/bg-reward-v02.png" --aspect-ratio 16:9 --style "pixel art" --model flash
codeb cg image generate "pixel art victory reward sanctuary background, golden chest light, ritual circle, no characters" \
  -o "$OUT_DIR/bg-reward-v03.png" --aspect-ratio 16:9 --style "pixel art" --model flash

echo "done: $OUT_DIR"
