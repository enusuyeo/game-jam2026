#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_BASE="$ROOT_DIR/assets/ui/pixel/effects"
OUT_TAKEN="$OUT_BASE/hit-taken"
OUT_DEALT="$OUT_BASE/hit-dealt"
TMP_DIR="$OUT_BASE/.tmp"

mkdir -p "$OUT_TAKEN" "$OUT_DEALT" "$TMP_DIR"

normalize_512() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 512 512 "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image generate "$prompt" -o "$raw" --aspect-ratio 1:1 --style "pixel art" --model flash --remove-bg; then
      normalize_512 "$raw" "$out"
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

dealt_variant() {
  local n="$1"
  case "$n" in
    1) echo "diagonal slash arc, bright cyan-white edge, clean spark fragments" ;;
    2) echo "cross slash burst, dual blade trails, compact impact core" ;;
    3) echo "curved sword trail with sharp tip flare and metal sparks" ;;
    4) echo "critical hit starburst with thin slash streaks and ember flecks" ;;
    5) echo "wide crescent slash with glowing edge and dust chips" ;;
    6) echo "rapid multi-cut streaks, short lines, high-energy spark center" ;;
    7) echo "heavy cleave arc, thick motion trail, stone debris particles" ;;
    8) echo "thrust impact ring with focused point burst and spark spray" ;;
    9) echo "arcane-infused slash, faint rune glint, sharp impact flare" ;;
    10) echo "bloodless steel hit flash, silver sparks and shock ring" ;;
    11) echo "hooked slash trail with broken spark pieces and smoke wisps" ;;
    12) echo "double-crescent attack trail, layered light and dust particles" ;;
    13) echo "fast stab flash, narrow spike burst, tiny metallic fragments" ;;
    14) echo "impact explosion with slash marks, bright core, dark falloff" ;;
    15) echo "spinning blade hit trail, circular streak and spark points" ;;
    16) echo "heavy strike shimmer, short crack lines, strong center glow" ;;
    17) echo "combo finish flare, triple slash traces and sharp star core" ;;
    18) echo "clean tactical hit mark, minimal streaks, crisp readability" ;;
    19) echo "brutal cut arc with jagged spark scatter and smoke chips" ;;
    20) echo "premium finisher slash burst, layered arcs and polished sparks" ;;
    *) echo "weapon hit slash burst, readable combat effect" ;;
  esac
}

taken_variant() {
  local n="$1"
  case "$n" in
    1) echo "red damage burst with small shard particles and shock ring" ;;
    2) echo "impact crack flash, dark red core, outward splinter fragments" ;;
    3) echo "pain hit spark cluster, crimson-orange flicker and dust" ;;
    4) echo "heavy blow ripple with fractured lines and red pulse" ;;
    5) echo "blood-like splash silhouette with sharp pixel droplets" ;;
    6) echo "blunt damage star hit with smoky red falloff" ;;
    7) echo "guard-break style crack burst, red sparks and dark chips" ;;
    8) echo "explosive hit puff, ember particles, deep red center" ;;
    9) echo "critical taken marker, jagged burst and warning glow" ;;
    10) echo "slash wound flare, short crimson streaks and particle dust" ;;
    11) echo "impact shock ring with rough debris and red flicker" ;;
    12) echo "stagger hit flash, uneven crack rays and ember specks" ;;
    13) echo "pierce damage blink, thin red spike and dust burst" ;;
    14) echo "smash hit effect, chunky fragments and deep red pulse" ;;
    15) echo "dark wound burst with sharp edge sparks and smoke" ;;
    16) echo "compressed hit spark, high contrast center and faint glow" ;;
    17) echo "multi-hit taken effect, layered red flashes and chips" ;;
    18) echo "readable minimal damage pop, compact burst and subtle ring" ;;
    19) echo "brutal impact crack with wider debris spread and embers" ;;
    20) echo "premium damage burst, layered crimson flare and debris" ;;
    *) echo "damage taken impact burst, readable combat effect" ;;
  esac
}

BASE_PROMPT="pixel art combat VFX icon, transparent background, centered composition, no text, no ui, no watermark, dark fantasy game style, clean silhouette for gameplay readability"

if [[ "$#" -gt 0 ]]; then
  TARGETS=("$@")
else
  TARGETS=($(seq 1 20))
fi

for n in "${TARGETS[@]}"; do
  v=$(printf "v%02d" "$n")

  dv="$(dealt_variant "$n")"
  prompt_dealt="$BASE_PROMPT, attack landed hit effect, offensive slash impact effect, $dv"
  raw_dealt="$TMP_DIR/raw-hit-dealt-${v}.png"
  out_dealt="$OUT_DEALT/fx-hit-dealt-${v}.png"
  gen_with_retry "$prompt_dealt" "$raw_dealt" "$out_dealt"

  tv="$(taken_variant "$n")"
  prompt_taken="$BASE_PROMPT, character received damage effect, hurt impact effect, $tv"
  raw_taken="$TMP_DIR/raw-hit-taken-${v}.png"
  out_taken="$OUT_TAKEN/fx-hit-taken-${v}.png"
  gen_with_retry "$prompt_taken" "$raw_taken" "$out_taken"
done

echo "done: $OUT_DEALT"
echo "done: $OUT_TAKEN"
