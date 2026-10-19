# 아이고 AI-go 앱

매일 아침 AI 소식 세 가지를 쉽게 읽고 들을 수 있는 안드로이드 앱이에요.
내용은 블로그 저장소 [ArtricX/ailab](https://github.com/ArtricX/ailab)가 매일 발행하는 파일을 그대로 읽어 와요.
앱 전용 서버는 없어요. 블로그가 발행되면 앱에도 바로 들어와요.

## 화면 (v1)
| 화면 | 파일 |
|---|---|
| 첫 실행 (인사 → 알림 허락 → 준비 끝) | `src/app/onboarding.tsx` |
| 오늘 (홈, 날짜 이동은 목록 아래) | `src/app/(tabs)/index.tsx` |
| 하루 브리핑 읽기 + 듣기 | `src/app/briefing/[date].tsx` |
| 지난 브리핑 (주제별 고르기) | `src/app/(tabs)/archive.tsx` |
| 저장한 소식 | `src/app/(tabs)/saved.tsx` |
| 설정 (알림 시각·글자 크기) | `src/app/(tabs)/settings.tsx` |

## 원칙
- **가입 없음.** 저장한 소식과 설정은 휴대폰 안(AsyncStorage)에만 둬요.
- **아침 알림은 휴대폰이 스스로** 정한 시각에 보내요(서버 푸시 아님). `src/lib/notify.ts`
- **글자 굵기는 세 단계**: 400 본문 / 700 버튼·라벨 / 900 제목. 글꼴은 프리텐다드.
- **한글은 단어 단위로 줄을 바꿔요** (`Txt` 컴포넌트가 처리).
- 누르는 곳은 48px 이상, 아이콘에는 글자를 함께 달아요.

## 블로그 데이터
- 목록: `https://artricx.github.io/ailab/posts.json`
- 하루치: `https://artricx.github.io/ailab/content/YYYY-MM-DD.json` (구조는 ailab 저장소의 `content/README.md`)
- 인터넷이 끊기면 마지막으로 받은 내용을 보여 줘요.

### 소리로 듣기 (녹음 파일)
소식마다 녹음이 있으면 `content/YYYY-MM-DD.json`의 각 `stories[]`에 아래 필드를 넣어 주세요.
앱은 이 필드가 있을 때만 플레이어를 보여 줘요. 없으면 읽기만 돼요.

```json
"audio": { "url": "https://artricx.github.io/ailab/content/audio/2026-10-20-books.mp3", "duration": 92 }
```

목소리: 일레븐랩스, 여성 표준어(Hana 프리셋).

## 개발
```bash
npm install
npx expo start          # 휴대폰에서 개발 빌드로 확인
npx tsc --noEmit        # 타입 검사
```
알림·오디오는 Expo Go가 아니라 개발 빌드(`npx eas-cli@latest build --profile development`)에서 확인해야 해요.

## 출시
구글 플레이 조직 계정(ArtricX, DUNS 번호 필요)으로 올려요. 앱 이름 `아이고`, 패키지 `com.artricx.aigo`.
