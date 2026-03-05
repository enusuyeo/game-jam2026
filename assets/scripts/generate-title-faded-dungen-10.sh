#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-assets/ui/pixel/titles/faded-dungen}"
mkdir -p "$OUT_DIR"

gen_with_retry() {
  local prompt="$1"
  local out="$2"
  local tries=0
  local max_tries=4

  while true; do
    tries=$((tries + 1))
    if codeb cg image generate "$prompt" -o "$out" --aspect-ratio 16:9 --style "pixel art" --model flash --remove-bg; then
      echo "ok: $out"
      return 0
    fi
    if [[ "$tries" -ge "$max_tries" ]]; then
      echo "failed: $out (after $tries attempts)" >&2
      return 1
    fi
    sleep 2
  done
}

gen_with_retry "pixel art game title logo text 'Faded Dungen', dark fantasy, weathered stone letters, subtle blue glow, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v01.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', rusty iron lettering, cracked texture, ember sparks, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v02.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', gothic rune style, violet aura, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v03.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', bone and obsidian motif, ominous red rim light, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v04.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', ancient parchment and ink style, distressed edges, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v05.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', neon rune style, cyan-magenta glow, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v06.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', icy dungeon style, frosted letters and blue flame accents, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v07.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', blood sigil style, sharp serif letters, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v08.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', minimal retro arcade fantasy style, clean readable typography, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v09.png"
gen_with_retry "pixel art game title logo text 'Faded Dungen', monumental altar style, gold and dark stone contrast, transparent background, no extra words" "$OUT_DIR/title-faded-dungen-v10.png"

echo "done: $OUT_DIR"
