# Game Runtime Prototype (Python)

문서 스펙(`design/*.md`) 기반 프로토타입의 Python CLI 구현본.

## 구현 범위
- 5층 루프
- 층당 전투 4 + 선택지 4 + 보스전 1 + 층 보상/덱 재구성 1
- 맵 시야 규칙: 인접 노드 공개 + 회차 간 방문 노드 영구 공개
- 보스 컷씬 10개 (층별 intro/defeat)
- 엔딩 컷씬 3개 (`loop/true/fail`)
- 엔딩 분기: 음식 섭취 횟수(`consumedFoodCount`) 반영

## 실행 방법
Python 3.10+ 기준, 추가 의존성 없이 실행 가능:

```bash
cd game
python3 main.py
```

## 조작
- 숫자 입력으로 행동 선택
- 전투: 카드 번호 입력으로 사용, `e` 입력으로 턴 종료
- 컷씬: `엔터`로 다음 프레임, `s`로 스킵
- 종료: 대부분의 입력 단계에서 `q`

## 파일
- `main.py`: Python CLI 런타임(게임 루프/전투/맵/컷씬/엔딩)
- `main.js`: 기존 웹 프로토타입(레거시)
- `index.html`, `styles.css`: 기존 웹 UI(레거시)

## 에셋 정책
현재는 빠른 검증을 위해 캔버스 기반 placeholder 연출을 사용했다.
최종 아트/오디오는 `assets/generated/`에 `codeb` 생성본으로 교체해야 한다.
