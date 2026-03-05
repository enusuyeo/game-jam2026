#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUT_BOSS="$ROOT_DIR/assets/ui/pixel/portraits/dialogue/bosses"
OUT_NPC="$ROOT_DIR/assets/ui/pixel/portraits/dialogue/npcs"
TMP_DIR="$ROOT_DIR/assets/ui/pixel/portraits/dialogue/.tmp"
mkdir -p "$OUT_BOSS" "$OUT_NPC" "$TMP_DIR"

normalize_to_768x1024() {
  local in="$1"
  local out="$2"
  cp "$in" "$out"
  sips --resampleHeightWidth 1024 768 "$out" >/dev/null
}

gen_with_retry() {
  local prompt="$1"
  local raw="$2"
  local out="$3"

  local try=1
  local max_try=4
  while (( try <= max_try )); do
    if codeb cg image generate "$prompt" -o "$raw" --aspect-ratio 3:4 --style "pixel art" --model flash --remove-bg; then
      normalize_to_768x1024 "$raw" "$out"
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
    1) echo "stern expression, clear silhouette, high contrast lighting" ;;
    2) echo "battle-worn details, scars and chipped armor, gritty texture" ;;
    3) echo "ceremonial outfit variant, ornate accessories, regal composition" ;;
    4) echo "corrupted aura variant, dark runes and subtle glow, dramatic mood" ;;
    5) echo "mystic luminous variant, refined highlights, premium portrait finish" ;;
    *) echo "front portrait variant" ;;
  esac
}

boss_base_prompt() {
  local boss_name="$1"
  local variant="$2"
  echo "front-facing bust portrait of ${boss_name}, dark fantasy dungeon boss character, dialogue window portrait, pixel art, no background, transparent background, no text, no watermark, ${variant}"
}

npc_base_prompt() {
  local npc_name="$1"
  local role_desc="$2"
  local variant="$3"
  echo "front-facing bust portrait of ${npc_name}, ${role_desc}, dark fantasy event NPC for dialogue window, pixel art, no background, transparent background, no text, no watermark, ${variant}"
}

# Bosses: 5 bosses x 5 versions = 25
boss_id=("chain-jailer" "rift-guardian" "memory-executor" "judgment-archivist" "gatekeeper-of-tartaros")
boss_name=("Chain Jailer" "Rift Guardian" "Memory Executor" "Judgment Archivist" "Gatekeeper of Tartaros")

for i in 0 1 2 3 4; do
  bid="${boss_id[$i]}"
  bname="${boss_name[$i]}"
  for n in 1 2 3 4 5; do
    v=$(printf "v%02d" "$n")
    vp=$(variant_prompt "$n")
    prompt=$(boss_base_prompt "$bname" "$vp")
    raw="$TMP_DIR/raw-boss-${bid}-${v}.png"
    out="$OUT_BOSS/boss-${bid}-${v}.png"
    gen_with_retry "$prompt" "$raw" "$out"
  done
done

# NPCs: 5 NPC archetypes x 5 versions = 25
npc_id=("shadow-merchant" "archive-scribe" "ferryman" "altar-priest" "relic-broker")
npc_name=("Shadow Merchant" "Archive Scribe" "Ferryman" "Altar Priest" "Relic Broker")
npc_desc=(
  "a cunning underworld trader with layered robes and coin charms"
  "a haunted librarian scholar carrying forbidden records"
  "a stoic river guide with weathered cloak and lantern"
  "a solemn ritual cleric with ceremonial mask and gold-black vestments"
  "a sly artifact dealer with chained relic ornaments"
)

for i in 0 1 2 3 4; do
  nid="${npc_id[$i]}"
  nname="${npc_name[$i]}"
  ndesc="${npc_desc[$i]}"
  for n in 1 2 3 4 5; do
    v=$(printf "v%02d" "$n")
    vp=$(variant_prompt "$n")
    prompt=$(npc_base_prompt "$nname" "$ndesc" "$vp")
    raw="$TMP_DIR/raw-npc-${nid}-${v}.png"
    out="$OUT_NPC/npc-${nid}-${v}.png"
    gen_with_retry "$prompt" "$raw" "$out"
  done
done

echo "done: $OUT_BOSS"
echo "done: $OUT_NPC"
