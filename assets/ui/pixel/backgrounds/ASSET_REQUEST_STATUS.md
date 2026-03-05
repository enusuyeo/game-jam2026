# Background/Character Generation Status

## Requested
- 배경 5테마: 던전, 감옥, 상인, 나룻배, 보상방
- 캐릭터 3명 다중 버전 (도트 스타일)

## Generated Now
- `bg-floor1-marked-prison-sidewall.png`
- `bg-floor2-fractured-vault-sidewall.png`
- `bg-floor3-oblivion-corridor-sidewall.png`
- `bg-floor4-judgment-hall-sidewall.png`
- `bg-floor5-gatekeeper-altar-sidewall.png`
- `bg-floor1-marked-prison-sidewall-1920x1080.png`
- `bg-floor2-fractured-vault-sidewall-1920x1080.png`
- `bg-floor3-oblivion-corridor-sidewall-1920x1080.png`
- `bg-floor4-judgment-hall-sidewall-1920x1080.png`
- `bg-floor5-gatekeeper-altar-sidewall-1920x1080.png`
- `bg-floor1-marked-prison-sidewall-wide-v2.png`
- `bg-floor2-fractured-vault-sidewall-wide-v2.png`
- `bg-floor3-oblivion-corridor-sidewall-wide-v2.png`
- `bg-floor4-judgment-hall-sidewall-wide-v2.png`
- `bg-floor5-gatekeeper-altar-sidewall-wide-v2.png`
- `bg-floor1-marked-prison-sidewall-wide-v2-1920x1080.png`
- `bg-floor2-fractured-vault-sidewall-wide-v2-1920x1080.png`
- `bg-floor3-oblivion-corridor-sidewall-wide-v2-1920x1080.png`
- `bg-floor4-judgment-hall-sidewall-wide-v2-1920x1080.png`
- `bg-floor5-gatekeeper-altar-sidewall-wide-v2-1920x1080.png`
- `bg-floor4-judgment-hall-sidewall-wide-v3.png`
- `bg-floor5-gatekeeper-altar-sidewall-wide-v3.png`
- `bg-floor4-judgment-hall-sidewall-wide-v3-1920x1080.png`
- `bg-floor5-gatekeeper-altar-sidewall-wide-v3-1920x1080.png`
- `bg-floor5-gatekeeper-altar-sidewall-wide-v4.png`
- `bg-floor5-gatekeeper-altar-sidewall-wide-v4-1920x1080.png`

## Generation Scripts Prepared
- `assets/scripts/generate-pixel-backgrounds.sh`
- `assets/scripts/generate-pixel-characters.sh`

## Note
- 현재 codeb 이미지 생성 서버가 장시간 `queued` 상태로 지연되어 배치 실행이 정상 완료되지 않음.
- 큐 상태가 정상화되면 위 스크립트로 요청한 에셋을 일괄 생성 가능.

## 2026-03-05 Batch Pack (Completed)
- 경로: `assets/ui/pixel/pack-2026-03-05/`
- 배경 예시 15개: `assets/ui/pixel/pack-2026-03-05/backgrounds/*-1920x1080.png`
- 지도 예시 15개: `assets/ui/pixel/pack-2026-03-05/maps/*-1920x1080.png`
- 비율: 전부 16:9 (`1920x1080`) 보정 완료

## 2026-03-05 Sideview Characters (Completed)
- 경로: `assets/sprites/pixel-sideview-2026-03-05/`
- 수량: 20장 (아르케/리코스/세린/오르핀/네브라 각 4종)
- 파일 규칙: `ch-{name}-v0{1..4}-{idle|ready|attack|damaged}.png`
