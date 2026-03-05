# Core Loop Spec

## Run Loop
1. 파티/덱 선택
2. 스테이지 노드 선택 (현재 위치 인접 노드만 공개)
3. 전투/이벤트/휴식/상점 해결
4. 보상 선택 (카드/유물/골드/정화)
5. 보스 진입 컷씬 재생 (`boss_intro`)
6. 보스전
7. 보스 처치 컷씬 재생 (`boss_defeat`, 승리 시)
8. 엔딩 판정 (일반/진/패배)
9. 엔딩 컷씬 재생 (`ending_loop` / `ending_true` / `ending_fail`)
10. 메타 해금 반영 후 다음 런

## Node Types (MVP)
- `battle_normal`: 기본 전투
- `battle_elite`: 고위험 전투 + 고급 보상
- `event`: 분기 선택형 서사/리스크 이벤트
- `rest`: 회복 또는 카드 강화
- `shop`: 카드/유물/정화 구매
- `boss`: 스테이지 보스

## Resource Loop
- 전투 내 자원: 에너지, 손패, 상태효과
- 런 자원: 체력, 골드, 귀속 카운트, 유물
- 메타 자원: 기억 파편(해금 전용)

## Fail Fast Rules
- 파티 전멸 시 즉시 런 종료
- 데이터 불일치(없는 카드 ID/노드 ID) 발견 시 로드 실패 처리
- 엔딩 조건 충족 여부를 보스전 종료 즉시 계산

## State Machine
```txt
RUN_START
  -> STAGE_MAP
  -> NODE_RESOLVE
    -> COMBAT
    -> EVENT
    -> REST
    -> SHOP
  -> REWARD_SELECT
  -> NEXT_NODE or STAGE_BOSS
  -> BOSS_CUTSCENE_INTRO
  -> STAGE_BOSS
  -> BOSS_CUTSCENE_OUTRO
  -> ENDING_EVAL
  -> ENDING_CUTSCENE
  -> RUN_END
```

## Map Visibility Rule
- 기본은 안개 맵이며 현재 노드의 인접 노드만 노출한다.
- 런 중 방문한 노드는 해당 런에서 지속 공개한다.
- 이전 회차 방문 이력 노드는 새 런에서도 사전 공개한다.
- 미방문/미공개 노드는 타입 정보를 숨기고 연결선만 표시한다.

## Open Decisions
- 런 중 저장(세이브&재개) 지원 여부
- 스테이지 간 상점 고정 배치 vs 랜덤 배치 비율
