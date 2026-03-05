# Ending Spec

## Ending Types
- `ENDING_LOOP`: 일반 클리어 후 회귀
- `ENDING_TRUE`: 무귀속 진엔딩
- `ENDING_FAIL`: 전멸/붕괴 실패 엔딩

## Core Condition
- 음식 섭취 횟수(`consumedFoodCount`)가 엔딩 분기의 최우선 조건이다.

## Logic
```txt
if finalBossCleared == false:
  ENDING_FAIL
else if consumedFoodCount == 0:
  ENDING_TRUE
else:
  ENDING_LOOP
```

## Story Mapping
- `ENDING_LOOP`:
  - 문이 열리지만 귀속 인장 발동
  - 파티는 다시 감방으로 낙하
  - 다음 런에서 루프 기억 파편 일부 보존

- `ENDING_TRUE`:
  - 인장이 반응하지 않음
  - 파티가 지상으로 탈출
  - 후일담 텍스트와 크레딧 출력

- `ENDING_FAIL`:
  - 타르타로스가 의지를 소거
  - 루프 재시작

## Ending Cutscene Mapping
- `ENDING_LOOP` -> `ending_loop_cutscene`
- `ENDING_TRUE` -> `ending_true_cutscene`
- `ENDING_FAIL` -> `ending_fail_cutscene`

## Runtime Sequence
1. 보스전 종료 결과 계산
2. 엔딩 타입 확정
3. 해당 엔딩 컷씬 재생 (스킵 가능)
4. 메타 해금/저장 처리

## Runtime Flags (초안)
- `consumedFoodCount: number`
- `finalBossCleared: boolean`
- `partyAlive: boolean`
- `stressCollapseCount: number`
- `loopIndex: number`
- `memoryFragmentsUnlocked: string[]`

## Anti-Confusion UI
- HUD 상단에 `귀속 카운트` 상시 표시
- 보스방 진입 전 엔딩 가능성 힌트 문구 출력:
  - 0회: "금식의 맹세가 유지되고 있다"
  - 1회 이상: "귀속 인장이 반응하고 있다"

## Open Decisions
- 진엔딩 후에도 도전 모드(뉴게임+)를 열지 여부
- 실패 엔딩의 패널티 강도 (자원 일부 유지 여부)
