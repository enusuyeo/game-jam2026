#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-assets/ui/pixel/pack-2026-03-05}"
BG_DIR="$ROOT_DIR/backgrounds"
MAP_DIR="$ROOT_DIR/maps"

mkdir -p "$BG_DIR" "$MAP_DIR"

gen_with_retry() {
  local prompt="$1"
  local out="$2"
  local tries=0
  local max_tries=4

  while true; do
    tries=$((tries + 1))
    if codeb cg image generate "$prompt" -o "$out" --aspect-ratio 16:9 --style "pixel art" --model flash; then
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

# 15 combat/background examples (side-wall + battle environment)
gen_with_retry "pixel art side-view dungeon wall battle background, cracked stone wall, blue torches, no text, no ui, no characters" "$BG_DIR/bg-01-prison-blue-wall.png"
gen_with_retry "pixel art side-view dungeon wall battle background, chained prison wall, wet floor reflections, no text, no ui, no characters" "$BG_DIR/bg-02-prison-chain-wall.png"
gen_with_retry "pixel art side-view underworld corridor battle background, broken pillars and runes, no text, no ui, no characters" "$BG_DIR/bg-03-rune-corridor-wall.png"
gen_with_retry "pixel art side-view fractured storage battle background, cracked vault bricks and fallen crates, no text, no ui, no characters" "$BG_DIR/bg-04-fractured-vault-wall.png"
gen_with_retry "pixel art side-view memory hall battle background, faded mural wall and green mist, no text, no ui, no characters" "$BG_DIR/bg-05-memory-mural-wall.png"
gen_with_retry "pixel art side-view judgment hall battle background, tribunal stone wall with red flame sconces, no text, no ui, no characters" "$BG_DIR/bg-06-judgment-wall.png"
gen_with_retry "pixel art side-view gatekeeper altar battle background, lock sigil carved into obsidian wall, no text, no ui, no characters" "$BG_DIR/bg-07-gatekeeper-wall.png"
gen_with_retry "pixel art side-view lava cavern battle background, basalt wall and ember particles, no text, no ui, no characters" "$BG_DIR/bg-08-lava-cavern-wall.png"
gen_with_retry "pixel art side-view shadow market battle background, merchant-side stone wall and hanging relics, no text, no ui, no characters" "$BG_DIR/bg-09-shadow-market-wall.png"
gen_with_retry "pixel art side-view ferry dock battle background, riverside retaining wall with lanterns and chains, no text, no ui, no characters" "$BG_DIR/bg-10-ferry-dock-wall.png"
gen_with_retry "pixel art side-view ancient catacomb battle background, skull niches in wall and dim cyan fire, no text, no ui, no characters" "$BG_DIR/bg-11-catacomb-wall.png"
gen_with_retry "pixel art side-view prison chapel battle background, stained stone wall and ritual candles, no text, no ui, no characters" "$BG_DIR/bg-12-prison-chapel-wall.png"
gen_with_retry "pixel art side-view collapsed tunnel battle background, fractured wall and debris heaps, no text, no ui, no characters" "$BG_DIR/bg-13-collapsed-tunnel-wall.png"
gen_with_retry "pixel art side-view cursed archive battle background, bookshelf wall and occult circles, no text, no ui, no characters" "$BG_DIR/bg-14-cursed-archive-wall.png"
gen_with_retry "pixel art side-view reward sanctum battle background, ornate wall with glowing altar recess, no text, no ui, no characters" "$BG_DIR/bg-15-reward-sanctum-wall.png"

# 15 map examples
gen_with_retry "pixel art dungeon world map ui style, branching nodes and routes, dark fantasy palette, no text, no characters" "$MAP_DIR/map-01-branch-classic.png"
gen_with_retry "pixel art dungeon map with two-lane node progression and boss node at top, no text, no characters" "$MAP_DIR/map-02-two-lane-boss-top.png"
gen_with_retry "pixel art underworld route map with chained islands and connecting paths, no text, no characters" "$MAP_DIR/map-03-chained-islands.png"
gen_with_retry "pixel art parchment style dungeon map with glowing node markers, no text, no characters" "$MAP_DIR/map-04-parchment-glow-nodes.png"
gen_with_retry "pixel art stone tablet map with engraved routes and battle/event icons without letters, no text, no characters" "$MAP_DIR/map-05-stone-tablet-routes.png"
gen_with_retry "pixel art tactical node map, dense branching between floors, dark blue and red accents, no text, no characters" "$MAP_DIR/map-06-dense-branching.png"
gen_with_retry "pixel art minimal map overlay with clear node circles and path lines, no text, no characters" "$MAP_DIR/map-07-minimal-node-overlay.png"
gen_with_retry "pixel art infernal map with lava river splitting routes and reunion points, no text, no characters" "$MAP_DIR/map-08-lava-river-routes.png"
gen_with_retry "pixel art prison complex map, cells as nodes linked by corridors, no text, no characters" "$MAP_DIR/map-09-prison-complex.png"
gen_with_retry "pixel art memory maze map with fogged undiscovered routes and highlighted current path, no text, no characters" "$MAP_DIR/map-10-memory-maze.png"
gen_with_retry "pixel art judgment court map with symmetric route design and central verdict node, no text, no characters" "$MAP_DIR/map-11-judgment-symmetric.png"
gen_with_retry "pixel art altar approach map, long spine path with side choices and final gate node, no text, no characters" "$MAP_DIR/map-12-altar-approach.png"
gen_with_retry "pixel art nautical underworld map with ferry checkpoints and harbor nodes, no text, no characters" "$MAP_DIR/map-13-ferry-checkpoints.png"
gen_with_retry "pixel art relic hunt map with treasure nodes and elite danger nodes, no text, no characters" "$MAP_DIR/map-14-relic-hunt.png"
gen_with_retry "pixel art abstract dark fantasy map with neon rune paths and node graph layout, no text, no characters" "$MAP_DIR/map-15-neon-rune-graph.png"

echo "done: $ROOT_DIR"
