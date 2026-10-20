# 로그인 켜는 방법 (카카오 · 네이버 · 구글 · 이메일)

코드는 다 들어가 있어요. 아래에서 받은 값을 **`auth.keys.json`** 한 파일에 채우면 버튼이 살아나요.
빈 칸인 로그인은 앱에서 '아직 준비 중이에요'로 떠요. 하나씩 켜도 돼요.

> `auth.keys.json`에 넣는 값은 모두 앱 안에 들어가는 **공개용 값**이에요.
> Supabase의 `service_role` 키, 카카오 Client Secret 같은 **비밀 값은 절대 이 파일에 넣지 마세요** (Supabase 대시보드에만 넣어요).
> 단, 네이버 Client Secret은 네이버 SDK 구조상 앱에 들어가야 해서 이 파일에 넣어요.

## 어떻게 움직이나요
```
[카카오톡·네이버 앱·구글 계정 선택 창]  → 동의 한 번
        ↓ 신분 확인 토큰
[아이고 계정 서버 = Supabase]  → 계정 찾기/만들기, 로그인 유지
        ↓
앱: 저장한 소식을 계정에 함께 보관 (휴대폰을 바꿔도 남음)
```
- 한 번 로그인하면 계속 로그인돼 있어요. 다음부턴 버튼을 누를 일이 없어요.
- 로그인 안 해도 앱은 전부 쓸 수 있어요 ('로그인 없이 둘러보기').
- 세 가지를 안 쓰는 분은 버튼 아래 **'이메일로 시작하기'** → 메일로 온 6자리 번호를 넣으면 끝 (비밀번호 없음, 처음이면 그대로 가입).
- 카카오·구글은 Supabase가 바로 확인해요. 네이버는 신분 확인 토큰을 주지 않아서 작은 서버 함수(`supabase/functions/naver-login`)가 대신 확인해요.

---

## 1. Supabase (계정 서버) — 먼저
1. https://supabase.com 가입 → **New project** → 지역은 **Northeast Asia (Seoul)**
2. **Project Settings → API**: `Project URL` → `supabaseUrl`, `anon`(또는 publishable) 키 → `supabaseAnonKey`
3. **SQL Editor**에 `supabase/migrations/20261020000000_saved_stories.sql` 내용을 붙여 넣고 **Run**
4. 서버 함수 두 개 올리기 (둘 중 편한 방법)
   - 대시보드: **Edge Functions → Deploy a new function → Via Editor**, 이름 `naver-login` / `delete-account`, 파일 내용 붙여 넣기 → 함수 설정에서 **Verify JWT 끄기**
   - 터미널: `npx supabase functions deploy naver-login --no-verify-jwt` / `npx supabase functions deploy delete-account --no-verify-jwt`

⚠️ 무료 요금제는 **7일 동안 아무도 안 쓰면 프로젝트가 잠들어요**(로그인 안 됨). 출시 초기 사용자가 적을 땐 가끔 대시보드에서 깨우거나, 사용자가 생기면 Pro($25/월) 검토.

## 2. 카카오 (developers.kakao.com)
1. **내 애플리케이션 → 애플리케이션 추가** (앱 이름 `아이고`)
2. **플랫폼 → Android 등록**: 패키지명 `com.artricx.aigo`, **키 해시** (아래 '서명 지문' 참고)
3. **카카오 로그인 → 활성화 ON**, **OpenID Connect 활성화 ON** ← 꼭 켜야 해요
4. **동의항목**: 닉네임(필수), 프로필 사진(선택). 이메일은 비즈 앱 전환이 필요해서 안 받아요.
5. **앱 키 → 네이티브 앱 키** → `kakaoNativeAppKey`
6. Supabase **Authentication → Sign In / Providers → Kakao** 켜기
   - REST API Key 칸: **네이티브 앱 키** (앱에서 받은 토큰이 네이티브 앱 키 앞으로 나와요)
   - Client Secret: 카카오 **보안 → Client Secret** 코드

## 3. 네이버 (developers.naver.com)
1. **Application → 애플리케이션 등록** → 사용 API **네이버 로그인**
2. 제공 정보: 별명(필수), 프로필 사진(선택)
3. 환경 추가 **Android**: 패키지 `com.artricx.aigo`, 다운로드 URL은 출시 전엔 블로그 주소 `https://artricx.github.io/ailab/`
4. `Client ID` → `naverClientId`, `Client Secret` → `naverClientSecret`
5. ⚠️ 처음엔 **'개발 중' 상태**라 **멤버관리에 등록한 네이버 아이디만** 로그인돼요. 출시 전에 **검수 요청**을 해야 모두 쓸 수 있어요 (며칠 걸려요).

## 4. 구글 (console.cloud.google.com)
1. 새 프로젝트 → **Google 인증 플랫폼(OAuth 동의 화면)** 설정: 앱 이름 아이고, 지원 메일
2. **클라이언트 만들기 → 웹 애플리케이션** → 클라이언트 ID → `googleWebClientId`
3. **클라이언트 만들기 → Android**: 패키지 `com.artricx.aigo` + **SHA-1** (아래 '서명 지문')
   - SHA-1이 두 개면(시험용 APK, 플레이 스토어) Android 클라이언트를 두 개 만들어요.
4. Supabase **Providers → Google** 켜기 → Client IDs 칸에 **웹 클라이언트 ID**
   (안드로이드만 내는 동안엔 `googleIosUrlScheme`은 비워 둬요)

## 5. 이메일 인증번호 (Supabase만 있으면 돼요)
⚠️ 2026년 6월부터 새 무료 프로젝트는 **메일 발송 서비스(SMTP)를 먼저 연결해야** 메일 문구를 바꿀 수 있어요. 순서: SMTP → 문구.

1. **SMTP 연결** (도메인이 없을 땐 Gmail로)
   - 아이고 전용 Gmail을 만들고 2단계 인증을 켠 뒤 https://myaccount.google.com/apppasswords 에서 앱 비밀번호(16자리) 만들기
   - Supabase **Authentication → Emails → SMTP Settings** → Enable custom SMTP
     - Sender email / Username: 그 Gmail 주소, Sender name: `아이고`
     - Host `smtp.gmail.com`, Port `465`, Password: 앱 비밀번호
   - Gmail은 하루 수백 통까지라 출시 초기용. 사용자가 늘면 내 도메인 + Resend 등으로 바꾸기
   - 처음엔 메일이 시간당 약 30통으로 제한돼요 → **Authentication → Rate Limits**에서 조정
2. **Authentication → Email Templates**의 **Magic Link**와 **Confirm signup** 두 개 모두, 링크 대신 번호가 보이게 바꾸기. 예:
   ```html
   <h2>아이고 인증번호</h2>
   <p>앱에 아래 6자리 번호를 넣어 주세요.</p>
   <p style="font-size:28px;font-weight:900;letter-spacing:6px">{{ .Token }}</p>
   <p>직접 요청하지 않았다면 이 메일은 무시해 주세요.</p>
   ```
   제목 예: `[아이고] 인증번호를 확인해 주세요`
3. **Authentication → Sign In / Providers → Email**에서 **Email OTP Length 6** 확인
4. 메일 주소는 **로그인 확인용**이에요. 이벤트·광고 메일은 따로 수신 동의를 받은 뒤에만 보낼 수 있어요.

## 서명 지문 (SHA-1 / 카카오 키 해시) 구하기
앱마다 '서명' 지문이 있어야 카카오·구글이 우리 앱인지 알아봐요.
- 시험용 APK: 터미널에서 `npx eas-cli@latest credentials -p android` → `SHA1 Fingerprint`
- 플레이 스토어: Play Console → 앱 → **테스트 및 출시 → 앱 무결성 → 앱 서명 키 인증서**의 SHA-1
- 카카오 **키 해시**는 SHA-1을 다른 모양으로 바꾼 값이에요. SHA-1을 Claude에게 주면 바꿔 드려요.
  (직접: `echo 'AA:BB:...' | xxd -r -p | openssl base64`)

---

## 출시 전에 꼭
- [ ] **공식 로그인 버튼 그림**: 카카오·네이버·구글 모두 버튼 왼쪽에 자기 심볼을 넣으라고 해요. 각 개발자 사이트의 '디자인 가이드'에서 받은 심볼을 `assets/auth/`에 넣고 `src/components/LoginButtons.tsx`에 붙이기 (지금은 공식 색 + 글자만)
- [ ] **개인정보처리방침**(블로그 `privacy.html`) 고치기: 받는 정보(닉네임·프로필 사진·로그인 회원번호, 구글·이메일 로그인 시 메일 주소), 쓰는 곳(저장한 소식 보관), 보관 기간(탈퇴 시 즉시 삭제), 맡기는 곳(Supabase)
- [ ] **구글 플레이 데이터 보안 양식**: '계정 만들기 있음', '앱 안에서 계정 삭제 가능', 계정 삭제 안내 **웹 주소**도 필요 (개인정보처리방침에 '앱 > 설정 > 계정 지우기' 안내 넣고 그 주소 쓰기)
- [ ] 네이버 **검수 요청**
- [ ] (도메인 마련 후) 메일 발송을 Gmail → 내 도메인 발송 서비스로 바꾸기
- [ ] 휴대폰에서 네 가지 로그인 · 로그아웃 · 계정 지우기 · 휴대폰 바꿔 저장 소식 남는지 확인

## 새 설치 파일이 필요해요
로그인 부품은 휴대폰 안쪽(네이티브) 코드라서, 키를 넣은 뒤 **Actions → 시험용 설치 파일 만들기**로 새 APK를 만들어 깔아야 해요. 예전 APK에선 안 돼요.
