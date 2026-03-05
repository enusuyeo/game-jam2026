# Graphics Spec (2D)

## Goal
- 전 그래픽 파이프라인을 2D 기준으로 고정한다.
- 보스/엔딩 컷씬을 MVP 범위에 포함해 내러티브 전달력을 확보한다.

## Rendering Direction (MVP)
- 렌더링은 `PixiJS v8 + @pixi/react`를 기본으로 사용한다.
- 카메라는 2D 직교 뷰를 유지하고, 3D 모델/3D 카메라 연출은 사용하지 않는다.
- 연출 방식은 2D 스프라이트, 2D 파티클, 2D 레이어 패럴랙스로 제한한다.

## Visual Pillars
- 실루엣 우선: 적/보스는 축소 화면에서도 형태가 즉시 구분되어야 한다.
- 가독성 우선: 전투 UI와 상태 아이콘은 배경 대비를 항상 확보한다.
- 층 테마 우선: 5개 층마다 고유 팔레트와 배경 모티프를 분리한다.

## Art Asset Scope (MVP)
- 전투 배경: 층별 1종 x 5층
- 보스 스프라이트: 층별 보스 1종 x 5
- 일반 적 스프라이트: 최소 12종
- 플레이어 캐릭터 스프라이트: 5종
- UI 스킨: HUD, 카드 프레임, 노드 아이콘, 팝업
- 컷씬 이미지 세트: 아래 Cutscene Scope 기준

## Cutscene Scope (필수 구현)
- 각 층 보스 컷씬:
  - `boss_intro`: 보스전 진입 전 1개
  - `boss_defeat`: 보스 처치 후 1개
  - 총 10개 (5층 x 2)
- 클리어 컷씬:
  - `ending_loop_cutscene` (일반 클리어)
  - `ending_true_cutscene` (진엔딩 클리어)
  - 총 2개
- 실패 컷씬:
  - `ending_fail_cutscene`
  - 총 1개
- MVP 컷씬 총량: 최소 13개

## Cutscene Direction Rule
- 형식: 스틸 일러스트 + 대사 박스 + SFX/BGM 큐
- 길이: 10~30초 범위, 스킵 가능
- 구성: `오프닝 1장 + 전개 2~4장 + 마무리 1장`
- 연출 정보(카메라 줌, 페이드, 텍스트 타이밍)는 데이터로 분리한다.

## Map Visual Rule
- 미공개 노드는 실루엣/연결선만 표시한다.
- 인접 공개 노드는 타입 아이콘을 표시한다.
- 이전 회차 방문 노드는 반투명 하이라이트로 `기억된 노드`임을 구분한다.

## Data Contract (초안)
- `SpriteAssetData`: `id`, `category`, `path`, `pivot`, `scale`, `tags[]`
- `CutsceneFrameData`: `imageId`, `speaker`, `line`, `sfxId?`, `durationMs`
- `CutsceneData`: `id`, `trigger`, `frames[]`, `bgmId?`, `skippable`

## Production Pipeline Rule
- 최종 이미지/오디오 에셋은 `codeb` 생성본을 사용한다.
- placeholder를 사용한 경우, 대응하는 `codeb` 교체 타겟을 문서에 반드시 기록한다.

## Open Decisions
- 컷씬 화면 비율 고정값 (16:9 단일 vs 기기 비율 적응)
- 보스 컷씬 음성 적용 범위 (무음/핵심 대사만/풀보이스)
- 컷씬 프레임 당 평균 장수 (3장 기준 vs 5장 기준)
