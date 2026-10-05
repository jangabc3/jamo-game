# 스토어 출시 가이드 (구글 플레이 · 앱스토어)

웹 게임(`docs/`)을 [Capacitor](https://capacitorjs.com)로 감싸서 안드로이드·iOS 앱으로 만들어요.
게임이 인터넷 없이 돌아가도록 만들어져 있어서(글꼴·엔진·사전 모두 포함) 앱 안에 그대로 넣을 수 있어요.

> 아래 내용 중 스토어 정책과 도구 사용법은 바뀔 수 있어요. 진행하기 전에 각 공식 문서를 한 번 더 확인하세요.

## 0. 먼저 정해야 할 것
| 항목 | 내용 |
| --- | --- |
| 앱 ID | `capacitor.config.json`의 `appId`. 예: `com.jangabc3.jamo`. **스토어에 올린 뒤에는 못 바꿔요.** |
| 앱 이름 | 자모게임 (스토어에 같은 이름이 있는지 확인) |
| 개인정보처리방침 주소 | `https://jangabc3.github.io/jamo-game/privacy.html` (Pages를 켠 뒤) |
| 연락처 | `public/privacy.html`의 이메일을 확인해요 |

## 1. 안드로이드 (구글 플레이)
준비물: PC(Windows 가능), Node.js LTS, Android Studio, 구글 플레이 개발자 계정(유료 등록)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android          # android/ 폴더가 생겨요
npm run sync                 # 빌드 + 앱에 복사
npm run android              # Android Studio가 열려요
```
Android Studio에서
1. 세로 고정: `android/app/src/main/AndroidManifest.xml`의 `<activity>`에 `android:screenOrientation="portrait"`를 추가해요.
2. 아이콘: `public/icon-512.png`를 Image Asset 도구로 앱 아이콘에 넣어요.
3. Build → Generate Signed App Bundle → 새 키스토어를 만들어요. **키스토어 파일과 비밀번호는 안전한 곳에 백업하세요. 잃어버리면 업데이트를 못 해요.**
4. 만들어진 `.aab` 파일을 Play Console에 올려요.

### Play Console 체크리스트
- **비공개 테스트**: 개인 계정(2023-11-13 이후 생성)은 12명 이상 테스터가 14일 이상 참여해야 프로덕션을 신청할 수 있어요. [공식 안내](https://support.google.com/googleplay/android-developer/answer/14151465?hl=ko)
- **개인정보처리방침 URL**: 위 주소를 입력해요.
- **데이터 보안(Data safety)**: 수집·공유하는 데이터 없음으로 답해요. 현재 앱은 서버 전송이 없어요. 광고나 분석을 넣으면 다시 답해야 해요.
- **콘텐츠 등급 설문**, **타겟 연령**, **광고 포함 여부(현재 없음)**를 입력해요.
- **스토어 등록정보**: 아이콘 512×512, 대표 이미지 1024×500, 휴대폰 스크린샷 2장 이상, 간단한 설명(80자), 자세한 설명이 필요해요.
- 한국 게임 앱의 **게임물 등급** 요건은 시점에 따라 달라서, 올리기 전에 Play Console 안내를 확인하세요.

## 2. iOS (앱스토어)
준비물: **Mac + Xcode가 필요해요.** Windows PC만으로는 iOS 앱을 빌드할 수 없어요. Apple Developer Program 가입(연회비)도 필요해요.
- Mac이 없으면 클라우드 빌드 서비스(예: Codemagic 등)를 쓰거나, Mac이 있는 지인의 도움을 받아야 해요.

```bash
npm install @capacitor/ios
npx cap add ios
npm run sync
npm run ios                  # Xcode가 열려요
```
### App Store Connect 체크리스트
- 개인정보처리방침 URL, 앱 개인정보 보호(데이터 수집 없음) 응답, 연령 등급, 스크린샷(필수 기기 크기), 설명을 입력해요.
- **심사 주의**: 애플은 "웹사이트를 그대로 감싼 앱"을 반려할 수 있어요(심사 지침 4.2 최소 기능). 이 게임은 오프라인 게임이고 소리·도감·진행 저장 등 자체 기능이 있어 근거가 있지만, 반려되면 그 사유에 맞춰 고쳐야 해요.
- 아이폰 Safari는 진동(`navigator.vibrate`)을 지원하지 않아서, 앱에서도 진동이 안 나올 수 있어요. 필요하면 Capacitor Haptics 플러그인을 쓰세요.

## 3. 포장하기 전에 직접 확인할 것 (실기기)
- 공유 버튼: 웹 공유(`navigator.share`)가 앱 안 웹뷰에서 되는지 확인해요. 안 되면 `@capacitor/share` 플러그인으로 바꿔요.
- 뒤로가기(안드로이드): 일시정지 창이 열리고, 처음 화면에서 앱이 종료되는지 확인해요.
- 소리: 처음 터치 뒤에 소리가 나는지, 화면을 껐다 켰을 때 배경음이 멈추는지 확인해요.
- 상태 표시줄과 노치 영역에 화면이 가려지지 않는지 확인해요.

## 4. 스토어 설명 초안
**한 줄 소개(80자 이내)**: 자음과 모음을 떨어뜨려 우리말 낱말을 만드는 한글 퍼즐

**자세한 설명**
자음과 모음 공을 떨어뜨려 글자를 만들고, 두 글자가 낱말이 되면 펑! 터져요.
- ㄱ + ㅏ = 가, 가 + ㅂ = 갑… 한글이 만들어지는 원리를 직접 해 보세요
- 표준국어대사전의 낱말 6만 개와 뜻풀이
- 낱말 도감 모으기, 급수 올리기, 연쇄·콤보 점수
- 인터넷 없이도, 광고 없이 즐겨요
- 한지와 붓글씨 느낌의 깔끔한 화면

## 5. 출처 표기 (꼭 유지)
낱말과 뜻풀이는 CC BY-SA 2.0 KR이에요. 앱 안(도감 화면)과 스토어 설명 끝에 `낱말과 뜻: 국립국어원 표준국어대사전·우리말샘 (CC BY-SA 2.0 KR)`을 적어요. 자세한 건 `NOTICE.md`를 보세요.
