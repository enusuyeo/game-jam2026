# Combat Spec

## Battle Goal
- 카드 기반 턴제를 통해 적 Intent에 대응하고 파티 생존을 유지한다.

## Core Stats
- `hp`: 체력
- `maxHp`: 최대 체력
- `block`: 이번 턴 피해를 흡수하는 보호 수치
- `energy`: 카드 사용 자원 (기본 3)
- `stress`: 정신 압박 수치 (임계치 도달 시 붕괴 디버프)
- `speed`: 동률 처리용 우선순위

## Deck Rules (MVP)
- 시작 덱: 12장
- 드로우: 턴 시작 시 5장
- 핸드 제한: 10장
- 기본 카드 타입:
  - 공격: 단일/광역 피해
  - 방어: 방어 획득, 피해 경감
  - 전술: 드로우, 에너지 회복, 위치 변경
  - 상태: 출혈/취약/약화/기절 부여

## Turn Flow
1. 턴 시작: 지속 효과 처리, 에너지/드로우 갱신
2. 플레이어 행동: 카드 사용, 아이템 사용, 턴 종료
3. 턴 종료: 손패 정리, 종료 시점 트리거 처리
4. 적 행동: Intent 순서대로 실행
5. 라운드 종료: 승패/도주 가능 여부 판정

## Intent System
- 모든 적은 다음 행동을 1턴 전 공개한다.
- Intent 타입: `attack`, `defend`, `buff`, `debuff`, `special`
- 보스는 2턴 주기 패턴과 체력 임계치 패턴을 혼합한다.

## Status Effects (MVP)
- `bleed`: 턴 종료 시 고정 피해
- `vulnerable`: 받는 피해 증가
- `weak`: 주는 피해 감소
- `stun`: 다음 행동 1회 무효
- `mark`: 특정 스킬 피해 증가
- `collapse`: 스트레스 임계 도달 시 부여되는 패널티

## Food Interaction in Combat
- 음식은 전투 중 즉시 사용 불가 (노드/이벤트 전용)
- 전투 결과로 음식 아이템을 획득할 수 있으나, 사용 시 귀속 카운트 증가 규칙 유지

## Win/Lose Conditions
- 승리: 적 전원 사망
- 패배: 파티 전원 사망
- 특별 패배: 주요 인물 단독 생존 + 스트레스 붕괴 누적 시 항복 처리 (선택 규칙)

## Balance Targets (MVP)
- 일반 전투: 3~5턴
- 엘리트 전투: 6~8턴
- 보스전: 8~12턴
- 평균 승률 목표: 일반 빌드 45~60%

## Data Contracts (초안)
- `CardData`: id, cost, type, target, effects[]
- `EnemyData`: id, stats, intentTable, lootTable
- `StatusData`: id, stackRule, applyTiming, expireTiming

## Open Decisions
- 포지션 시스템(전열/후열) 도입 여부
- 도주 커맨드 허용 여부와 페널티
