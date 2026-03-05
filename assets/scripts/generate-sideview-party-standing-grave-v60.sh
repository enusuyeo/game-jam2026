#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_BASE="$ROOT_DIR/assets/ui/pixel/characters/sideview"
OUT_STANDING="$OUT_BASE/standing-sprites"
OUT_GRAVE="$OUT_BASE/death-gravestones"
TMP_DIR="$OUT_BASE/.tmp"

mkdir -p "$OUT_STANDING" "$OUT_GRAVE" "$TMP_DIR"

normalize_standing_sheet() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  # Standing sprite sheet target: 4:3 (1024x768)
  sips --resampleHeightWidth 768 1024 "$out" >/dev/null
}

normalize_gravestone() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  # Gravestone portrait target: 3:4 (768x1024)
  sips --resampleHeightWidth 1024 768 "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local ar="$2"
  local raw="$3"
  local out="$4"
  local mode="$5"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image generate "$prompt" -o "$raw" --aspect-ratio "$ar" --style "pixel art" --model flash --remove-bg; then
      if [[ "$mode" == "standing" ]]; then
        normalize_standing_sheet "$raw" "$out"
      else
        normalize_gravestone "$raw" "$out"
      fi
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

variant_prompt() {
  local n="$1"
  case "$n" in
    1) echo "clean silhouette, high readability, balanced contrast" ;;
    2) echo "battle-worn detail, chipped gear, rough texture accents" ;;
    3) echo "ornate trim variant, richer accessory detail, premium finish" ;;
    4) echo "grim shadow-heavy mood, colder highlights, stronger rim light" ;;
    5) echo "warm torchlight mood, subtle gold accents, clear forms" ;;
    6) echo "rune-marked variant, faint mystical glow, controlled effects" ;;
    7) echo "darker armor/cloth pass, muted saturation, gritty tone" ;;
    8) echo "clean heroic pass, brighter edge highlights, crisp pixel clusters" ;;
    9) echo "scarred veteran pass, visual asymmetry, intense expression cues" ;;
    10) echo "elite final pass, polished pixel craftsmanship, dramatic lighting" ;;
    *) echo "pixel art variant" ;;
  esac
}

standing_prompt() {
  local name="$1"
  local role="$2"
  local variant="$3"
  echo "pixel art side-view character sprite sheet of ${name}, ${role}, full-body facing right, standing idle motion, 4-frame horizontal sheet, evenly spaced frames, transparent background, no text, no ui, ${variant}"
}

grave_prompt() {
  local name="$1"
  local role="$2"
  local motif="$3"
  local variant="$4"
  echo "pixel art side-view memorial gravestone for fallen ${name}, ${role}, engraved with ${motif}, no living character, full monument visible, transparent background, no text, no ui, ${variant}"
}

char_id=("arke" "rikos" "serin")
char_name=("Arke" "Rikos" "Serin")
char_role=(
  "frontline guardian with heavy shield"
  "melee executioner with dual blades"
  "disruption priest with ritual staff"
)
char_motif=(
  "shield crest and broken spear"
  "crossed execution blades and chain"
  "occult staff and prayer sigil"
)

for i in 0 1 2; do
  cid="${char_id[$i]}"
  cname="${char_name[$i]}"
  crole="${char_role[$i]}"
  cmotif="${char_motif[$i]}"

  for n in 1 2 3 4 5 6 7 8 9 10; do
    v=$(printf "v%02d" "$n")
    vp=$(variant_prompt "$n")

    prompt_standing=$(standing_prompt "$cname" "$crole" "$vp")
    raw_standing="$TMP_DIR/raw-standing-${cid}-${v}.png"
    out_standing="$OUT_STANDING/ch-${cid}-standing-${v}.png"
    gen_with_retry "$prompt_standing" "4:3" "$raw_standing" "$out_standing" "standing"

    prompt_grave=$(grave_prompt "$cname" "$crole" "$cmotif" "$vp")
    raw_grave="$TMP_DIR/raw-grave-${cid}-${v}.png"
    out_grave="$OUT_GRAVE/ch-${cid}-grave-${v}.png"
    gen_with_retry "$prompt_grave" "3:4" "$raw_grave" "$out_grave" "grave"
  done
done

echo "done: $OUT_STANDING"
echo "done: $OUT_GRAVE"
