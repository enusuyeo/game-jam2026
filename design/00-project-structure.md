# Project Structure Spec

## Goal
- 설계 우선 단계에서 폴더 책임을 고정하고, 이후 구현 시 충돌을 줄인다.

## Top-Level
```txt
/assets     # 에셋
/game       # 게임 로직구현
/design     # 설계
/tests      # (권장) 테스트
/tools      # (권장) 데이터 검증/파이프라인
```

## Required Directories

### 1) assets
```txt
assets/
  generated/
  sprites/
  audio/
  ui/
  cutscenes/
```

### 2) game
```txt
game/
  core/
  battle/
  cards/
  stage/
  entities/
  progression/
  data/
```

### 3) design
```txt
design/
  game-vision.md
  story-spec.md
  core-loop.md
  combat-spec.md
  stage-spec.md
  graphics-spec.md
  progression-spec.md
  ending-spec.md
  content-roadmap.md
```

## Naming Conventions
- 파일: `kebab-case`
- 타입/인터페이스: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `SCREAMING_SNAKE_CASE`

## Implementation Rule Hook
- 필수 게임 상수/열거는 `Lv.0 Primitives`에 먼저 정의한다.
- 밸런스 수치는 `game/data/`로 분리한다.
- UI 표시 문자열도 가능하면 데이터 파일로 분리한다.

## Open Decisions
- 테스트 프레임워크를 `Vitest` 단일로 시작할지, `Playwright` E2E를 초기 포함할지 결정 필요.
