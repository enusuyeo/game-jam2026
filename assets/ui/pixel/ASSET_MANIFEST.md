# Pixel UI Asset Manifest

생성 도구: `codeb cg image generate`  
스타일: pixel/dark fantasy UI  
경로: `assets/ui/pixel/`

## Core Background

| 파일 | 용도 |
|---|---|
| `bg-tartaros-hall-16x9.png` | 기본 전투/맵 배경 |
| `basic_background.png` | 배경 원본 (동일 계열) |

## Deck UI (중앙 덱)

| 파일 | 용도 |
|---|---|
| `ui-deck-center-frame.png` | 중앙 덱 슬롯 프레임 |
| `ui-card-slot.png` | 카드 슬롯 단일 프레임 |
| `ui-card-back.png` | 덱/숨김 카드 뒷면 |
| `ui-deck-overlay-panel.png` | 전체 덱 구성 보기 오버레이 패널 |
| `ui-button-deck-open.png` | 덱 열기 버튼 |
| `ui-button-deck-close.png` | 덱 닫기 버튼 |

## Stress UI (3캐릭터)

| 파일 | 용도 |
|---|---|
| `ui-stress-panel-empty-3char.png` | 3캐릭터 스트레스 패널(빈 슬롯) |
| `ui-stress-bar-empty.png` | 개별 스트레스 바 외곽 프레임 |
| `ui-stress-fill-base.png` | 스트레스 채움 베이스 (가로 클리핑 추천) |
| `ui-stress-fill-low.png` | 저스트레스 상태 표현용 fill |
| `ui-stress-fill-mid.png` | 중스트레스 상태 표현용 fill |
| `ui-stress-fill-high.png` | 고스트레스 상태 표현용 fill |
| `ui-stress-fill-danger-overlay.png` | 고스트레스 경고 오버레이(옵션) |
| `ui-stress-panel-3char.png` | 3바 일체형 강한 연출 패널(옵션) |

## Control UI

| 파일 | 용도 |
|---|---|
| `ui-button-stop.png` | `stop` 버튼 |
| `ui-button-continue.png` | `continue` 버튼 |
| `ui-top-hud-strip.png` | 상단 상태 HUD 바 |

## Integration Notes

| 항목 | 권장 방식 |
|---|---|
| 스트레스 수치 연동 | `ui-stress-bar-empty.png` 위에 `ui-stress-fill-base.png`를 수치 비율(0~1)만큼 가로 클리핑해서 렌더링 |
| 위험 강조 | 스트레스 > 80%에서 `ui-stress-fill-high.png` 또는 `ui-stress-fill-danger-overlay.png`를 가산(ADD/SCREEN) 블렌딩 |
| 덱 중앙 배치 | `ui-deck-center-frame.png`를 화면 중앙 anchor로 고정 후 카드 더미/카운트 텍스트 오버레이 |
| 전체 덱 확인 | `ui-deck-overlay-panel.png` + `ui-button-deck-open/close.png` 조합으로 토글 |
| 일시정지/재개 | `ui-button-stop.png`/`ui-button-continue.png`를 우측 상단 고정 버튼으로 배치 |
