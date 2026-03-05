#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-assets/sprites/pixel-sideview-2026-03-05}"
mkdir -p "$OUT_DIR"

gen_with_retry() {
  local prompt="$1"
  local out="$2"
  local tries=0
  local max_tries=4

  while true; do
    tries=$((tries + 1))
    if codeb cg image generate "$prompt" -o "$out" --aspect-ratio 3:4 --style "pixel art" --model flash --remove-bg; then
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

# Arke (frontline guardian)
gen_with_retry "pixel art side-view full body character sprite, Arke frontline guardian with large shield, facing right, idle stance, no text, no ui, transparent background" "$OUT_DIR/ch-arke-v01-idle.png"
gen_with_retry "pixel art side-view full body character sprite, Arke frontline guardian with shield raised, facing right, battle ready stance, no text, no ui, transparent background" "$OUT_DIR/ch-arke-v02-ready.png"
gen_with_retry "pixel art side-view full body character sprite, Arke guardian shield bash attack pose, facing right, dynamic action, no text, no ui, transparent background" "$OUT_DIR/ch-arke-v03-attack.png"
gen_with_retry "pixel art side-view full body character sprite, Arke guardian injured stance, facing right, worn armor, no text, no ui, transparent background" "$OUT_DIR/ch-arke-v04-damaged.png"

# Rikos (melee executioner)
gen_with_retry "pixel art side-view full body character sprite, Rikos melee executioner dual blades, facing right, idle stance, no text, no ui, transparent background" "$OUT_DIR/ch-rikos-v01-idle.png"
gen_with_retry "pixel art side-view full body character sprite, Rikos dual blade ready stance, facing right, aggressive silhouette, no text, no ui, transparent background" "$OUT_DIR/ch-rikos-v02-ready.png"
gen_with_retry "pixel art side-view full body character sprite, Rikos slash attack pose, facing right, motion emphasis, no text, no ui, transparent background" "$OUT_DIR/ch-rikos-v03-attack.png"
gen_with_retry "pixel art side-view full body character sprite, Rikos wounded stance, facing right, battle scars, no text, no ui, transparent background" "$OUT_DIR/ch-rikos-v04-damaged.png"

# Serin (disruption priest)
gen_with_retry "pixel art side-view full body character sprite, Serin disruption priest with ritual staff, facing right, idle stance, no text, no ui, transparent background" "$OUT_DIR/ch-serin-v01-idle.png"
gen_with_retry "pixel art side-view full body character sprite, Serin casting ready stance with occult talismans, facing right, no text, no ui, transparent background" "$OUT_DIR/ch-serin-v02-ready.png"
gen_with_retry "pixel art side-view full body character sprite, Serin debuff spell attack pose, facing right, purple magic trail, no text, no ui, transparent background" "$OUT_DIR/ch-serin-v03-attack.png"
gen_with_retry "pixel art side-view full body character sprite, Serin exhausted wounded stance, facing right, torn robe, no text, no ui, transparent background" "$OUT_DIR/ch-serin-v04-damaged.png"

# Orphin (ranged tracker)
gen_with_retry "pixel art side-view full body character sprite, Orphin ranged tracker with bow, facing right, idle stance, no text, no ui, transparent background" "$OUT_DIR/ch-orphin-v01-idle.png"
gen_with_retry "pixel art side-view full body character sprite, Orphin archer ready stance drawing arrow, facing right, no text, no ui, transparent background" "$OUT_DIR/ch-orphin-v02-ready.png"
gen_with_retry "pixel art side-view full body character sprite, Orphin arrow shot attack pose, facing right, dynamic bow release, no text, no ui, transparent background" "$OUT_DIR/ch-orphin-v03-attack.png"
gen_with_retry "pixel art side-view full body character sprite, Orphin wounded stance, facing right, damaged cloak, no text, no ui, transparent background" "$OUT_DIR/ch-orphin-v04-damaged.png"

# Nebra (risk mage)
gen_with_retry "pixel art side-view full body character sprite, Nebra risk mage with arcane orb, facing right, idle stance, no text, no ui, transparent background" "$OUT_DIR/ch-nebra-v01-idle.png"
gen_with_retry "pixel art side-view full body character sprite, Nebra dark mage ready stance with unstable energy, facing right, no text, no ui, transparent background" "$OUT_DIR/ch-nebra-v02-ready.png"
gen_with_retry "pixel art side-view full body character sprite, Nebra explosive spell attack pose, facing right, crimson arcane burst, no text, no ui, transparent background" "$OUT_DIR/ch-nebra-v03-attack.png"
gen_with_retry "pixel art side-view full body character sprite, Nebra self-damaged exhausted stance, facing right, cracked magic effects, no text, no ui, transparent background" "$OUT_DIR/ch-nebra-v04-damaged.png"

echo "done: $OUT_DIR"
