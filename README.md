# 자모게임

자음과 모음을 떨어뜨려 글자를 만들고, 두 글자가 우리말 낱말이 되면 터지는 한글 물리 퍼즐 게임.

- 플레이: (GitHub Pages 주소를 여기에 적기)
- 기술: HTML5 Canvas, Matter.js(물리), Web Audio API(효과음·배경음), PWA(오프라인 실행), 빌드 도구 없이 순수 JS
- 한글 조합 규칙(초성·중성·종성, 겹모음, 겹받침)을 직접 구현
- 낱말: 표준국어대사전의 두 글자 명사 약 6만 개(그중 약 1만 3천 개는 뜻풀이 포함)

## 실행

```bash
python3 tools/build.py        # docs/ (GitHub Pages용) + dist/jamo.html (한 파일)
cd docs && python3 -m http.server 8000   # http://localhost:8000
```

## 폴더

| 위치 | 내용 |
| --- | --- |
| `src/js/00-env ~ 03-dictionary` | 환경, 한글 조합·분해, 사전 불러오기, 도감 저장 |
| `src/js/04-config ~ 05-rules` | 화면 크기·모드·상태, 합성 규칙 `rule(A, B)` |
| `src/js/06-physics ~ 08-spawn` | 물리 세계·충돌, 낱말 터짐·점수, 다음 공 뽑기 |
| `src/js/09-fx`, `10-audio` | 이펙트, 효과음·배경음(Web Audio) |
| `src/js/11-hud ~ 16-guide` | 점수판, 입력, 설정, 도감, 모드, 합성표 화면 |
| `src/js/17-game ~ 19-share` | 게임 시작·종료·급수, 튜토리얼, 공유 이미지 |
| `src/js/20-render* , 22-loop, 23-main` | 캔버스 그리기, 게임 루프, 시작 |
| `src/css/` | 기본 스타일 → 다듬기 → 움직임 순서 |
| `data/dict.txt` | `낱말|뜻|등급` 6만 줄 |
| `public/` | 글꼴(woff2), Matter.js, 아이콘, manifest |
| `docs/` | 빌드 결과(GitHub Pages가 이 폴더를 서비스) |

스크립트는 번호 순서대로 불러오며, 같은 전역 범위를 공유해요.

자세한 출처와 라이선스는 `NOTICE.md`를 보세요.
