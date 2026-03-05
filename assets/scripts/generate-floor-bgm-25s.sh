#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash assets/scripts/generate-floor-bgm-25s.sh
#
# Prerequisite:
#   codeb login --token <TOKEN>

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

run_sfx_with_retry "25s seamless combat BGM loop, Floor1. Dark fantasy orchestral, clear pulse, memorable bell+string lead hook, medium energy, 120 BPM, tense prison mood, no EDM/pop. ref bg-01-prison-blue-wall." \
  "$OUT_DIR/floor01_battle_loop_25s_v1.mp3"

run_sfx_with_retry "25s seamless combat BGM loop, Floor2. Dark fantasy orchestral, short ostinato lead hook, dissonant strings and metallic accents, medium-high energy, 126 BPM, unstable risky mood, no EDM/pop. ref bg-02-fractured-vault-wall." \
  "$OUT_DIR/floor02_battle_loop_25s_v1.mp3"

run_sfx_with_retry "25s seamless combat BGM loop, Floor3. Dark fantasy orchestral, haunting lead melody over heartbeat bass pulse, medium-high tension, 124 BPM, choir/pad support only, combat-driven and melodic, no EDM/pop. ref bg-03-memory-mural-wall." \
  "$OUT_DIR/floor03_battle_loop_25s_v1.mp3"

run_sfx_with_retry "25s seamless combat BGM loop, Floor4. Dark fantasy orchestral, decisive brass-string lead riff, strong ritual percussion, high tension momentum, 134 BPM, clear rhythmic accents, no EDM/pop. ref bg-04-cursed-archive-wall." \
  "$OUT_DIR/floor04_battle_loop_25s_v1.mp3"

run_sfx_with_retry "25s seamless boss combat BGM loop, Floor5. Dark fantasy orchestral climax, strong lead theme with choir support, heavy low percussion and orchestral hits, very high energy, 142 BPM, relentless drive, no EDM/pop. ref bg-05-boss-like-normal-v04-v06." \
  "$OUT_DIR/floor05_battle_loop_25s_v1.mp3"

echo "done: $OUT_DIR"
