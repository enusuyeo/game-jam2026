# Assets Directory Guide

이 폴더는 게임 에셋 원본과 런타임 사용 리소스를 관리한다.

## 원칙
- 최종 에셋은 `codeb` 생성본을 사용한다.
- 빠른 프로토타이핑 placeholder 사용 시, 교체 후보를 이 문서에 기록한다.

## 구조
- `generated/`: codeb 생성 원본 (이미지/사운드/3D)
- `sprites/`: 2D 스프라이트, 아이콘, 카드 일러스트
- `audio/`: BGM, SFX, 보이스
- `ui/`: HUD, 패널, 버튼, 프레임
- `ui/pixel/`: 도트 스타일 UI 세트 (현재 기본안, `ASSET_MANIFEST.md` 참고)
- `cutscenes/`: 컷씬 프레임 이미지, 컷씬용 음성/SFX 메타

## 네이밍
- `{category}_{subject}_{variant}_{vNN}.{ext}`
- 예: `card_attack_bleed_v01.png`
