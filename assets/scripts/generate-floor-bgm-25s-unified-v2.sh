#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash assets/scripts/generate-floor-bgm-25s-unified-v2.sh
#
# Goal:
#   Keep Floor 1 tone as anchor and generate Floor 1~5 with unified musical DNA.

OUT_DIR="${1:-assets/sounds/generated}"
mkdir -p "$OUT_DIR"

run_sfx_with_retry() {
  local description="$1"
  local output="$2"
  local desc_len=${#description}
  local max_tries=6
  local try=1
  local delay=3
  local log_file=""

  if (( desc_len > 450 )); then
    echo "failed: $output (description too long: ${desc_len} > 450)" >&2
    return 2
  fi

  while (( try <= max_tries )); do
    log_file="$(mktemp)"
    echo "[try $try/$max_tries] generating: $output"
    if codeb cg audio sfx "$description" -o "$output" --duration 25 --verbose >"$log_file" 2>&1; then
      cat "$log_file"
      rm -f "$log_file"
      return 0
    fi
    cat "$log_file" >&2
    if rg -q "text_too_long|invalid_text_length|validation_error" "$log_file"; then
      rm -f "$log_file"
      echo "failed: $output (invalid text length/format; fix prompt, no retry)" >&2
      return 2
    fi
    rm -f "$log_file"
    if (( try == max_tries )); then
      echo "failed: $output (transient error after $max_tries attempts)" >&2
      return 1
    fi
    echo "retry in ${delay}s..."
    sleep "$delay"
    delay=$((delay * 2))
    try=$((try + 1))
  done
}

run_sfx_with_retry "25s seamless combat BGM loop. Unified dark fantasy orchestral style shared across all floors. Floor1 anchor: low strings, ritual tom pulse, dark bell lead, short 4-note motif, clear melody and tension, 120 BPM, no EDM/pop. ref bg-01-prison-blue-wall." \
  "$OUT_DIR/floor01_battle_loop_25s_v2_unified.mp3"

run_sfx_with_retry "25s seamless combat BGM loop. Same sonic DNA as Floor1 anchor and same 4-note motif, but fractured variation for Floor2. Medium-high energy, 126 BPM, unstable tension, metallic crack accents, melodic and combat-driven, no EDM/pop. ref bg-02-fractured-vault-wall." \
  "$OUT_DIR/floor02_battle_loop_25s_v2_unified.mp3"

run_sfx_with_retry "25s seamless combat BGM loop. Same sonic DNA as Floor1 anchor, same motif in haunting register for Floor3. 124 BPM, medium-high tension, memory-loss color but strong pulse and melody remain, choir/pad only support, no EDM/pop. ref bg-03-memory-mural-wall." \
  "$OUT_DIR/floor03_battle_loop_25s_v2_unified.mp3"

run_sfx_with_retry "25s seamless combat BGM loop. Same sonic DNA as Floor1 anchor, same motif with brass reinforcement for Floor4. High tension momentum, 134 BPM, stronger tom pattern and rhythmic stabs, melodic hook upfront, no EDM/pop. ref bg-04-cursed-archive-wall." \
  "$OUT_DIR/floor04_battle_loop_25s_v2_unified.mp3"

run_sfx_with_retry "25s seamless boss combat BGM loop. Final climax of Floor1 anchor with same motif as dominant theme for Floor5. Very high energy, 142 BPM, strongest percussion with choir support, unified timbre, clear melody and drive, no EDM/pop. ref bg-05-boss-like-normal-v04-v06." \
  "$OUT_DIR/floor05_battle_loop_25s_v2_unified.mp3"

echo "done: $OUT_DIR"
