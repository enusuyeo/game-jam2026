# Game Runtime Prototype (Python)

Python CLI prototype based on the specifications in `design/*.md`.

## Scope
- 5-floor run loop
- Per floor: 4 battles + 4 choices + 1 boss battle + 1 floor reward/deck rework
- Map visibility rules: adjacent nodes revealed + visited nodes persist across runs
- 10 boss cutscenes (intro/defeat per floor)
- 3 ending cutscenes (`loop/true/fail`)
- Ending branch based on consumed food count (`consumedFoodCount`)

## Run
Requires Python 3.10+ and no extra dependencies:

```bash
cd game
python3 main.py
```

## Controls
- Select actions with number keys
- Battle: use cards by number, `e` to end turn
- Cutscene: `Enter` for next frame, `s` to skip
- Quit: `q` in most input steps

## Files
- `main.py`: Python CLI runtime (game loop/combat/map/cutscene/ending)
- `main.js`: Legacy web prototype
- `index.html`, `styles.css`: Legacy web UI

## Asset Policy
Canvas placeholders are currently used for rapid validation.
Final art/audio should be replaced with `codeb` outputs in `assets/generated/`.
