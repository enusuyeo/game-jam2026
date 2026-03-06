# Map UI Asset Request Status (2026-03-06)

## Request Summary
- Style: pixel-art, dark navy/black stone + antique gold trim (reference mood)
- Needed assets:
  - Map nodes (`1:1`)
  - Logos: boss / special event / current position
  - UI panels: speed display / character name display

## Generated Outputs
- Nodes: `5`
  - Path: `assets/ui/pixel/map-ui/nodes`
  - Naming: `map-node-v01..v05.png`
  - Resolution: `512x512`
- Logos: `6`
- Logos: `21`
  - Path: `assets/ui/pixel/map-ui/logos`
  - Naming:
    - `logo-boss-v01..v07.png`
    - `logo-event-v01..v07.png`
    - `logo-current-v01..v07.png`
  - Resolution: `512x512`
- Panels: `4`
  - Path: `assets/ui/pixel/map-ui/panels`
  - Naming:
    - `panel-speed-v01..v02.png`
    - `panel-name-v01..v02.png`
  - Resolution: `1280x720`

## Validation
- Node count check: pass (`5`)
- Logo count check: pass (`21`)
- Panel count check: pass (`4`)
- Resolution checks: pass

## Generator
- Script: `assets/scripts/generate-map-overlay-ui-v15.sh`
- Extra logo variants script: `assets/scripts/generate-map-logos-extra-v03-v07.sh`
