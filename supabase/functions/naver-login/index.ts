// 네이버 로그인 → 아이고 계정
// 앱이 네이버에서 받은 접근 토큰을 보내면, 네이버에 직접 "이 사람 누구예요?"를 물어 확인한 뒤
// 아이고 계정을 찾거나 새로 만들고, 앱이 바로 로그인할 수 있는 1회용 표(token_hash)를 돌려줘요.
//
// 배포: npx supabase functions deploy naver-login --no-verify-jwt
// (로그인 전이라 사용자 토큰이 없어서 --no-verify-jwt 로 올려요. 대신 네이버 토큰으로 확인해요.)
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  let accessToken = '';
  try {
    accessToken = String((await req.json())?.accessToken ?? '');
  } catch {
    // 아래에서 처리
  }
  if (!accessToken) return json({ error: 'accessToken 이 필요해요' }, 400);

  // 1) 네이버에 본인 확인
  const me = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await me.json().catch(() => null);
  if (!me.ok || body?.resultcode !== '00' || !body?.response?.id) {
    return json({ error: '네이버 토큰을 확인하지 못했어요' }, 401);
  }
  const p = body.response as { id: string; nickname?: string; name?: string; email?: string; profile_image?: string };

  // 2) 네이버 회원번호로 만든 고정 주소 (실제로 메일을 보내지 않아요)
  //    진짜 메일 주소로 묶지 않는 이유: 다른 로그인 방법의 계정과 섞이지 않게.
  const email = `naver_${p.id}@naver-login.aigo.invalid`;
  const meta = {
    login_with: 'naver',
    name: p.nickname || p.name || undefined,
    avatar_url: p.profile_image || undefined,
    naver_email: p.email || undefined,
  };

  // 3) 계정이 없으면 만들어요 (이미 있으면 '이미 있음' 오류가 나고, 그냥 넘어가요)
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: meta,
    app_metadata: { provider: 'naver', providers: ['naver'] },
  });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) {
    console.error('createUser', created.error);
    return json({ error: '계정을 만들지 못했어요' }, 500);
  }

  // 4) 1회용 로그인 표 발급 → 앱이 verifyOtp 로 바로 로그인
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error || !link.data?.properties?.hashed_token) {
    console.error('generateLink', link.error);
    return json({ error: '로그인 표를 만들지 못했어요' }, 500);
  }

  // 닉네임·사진이 바뀌었으면 고쳐 둬요
  if (!created.data?.user && link.data.user) {
    await admin.auth.admin.updateUserById(link.data.user.id, { user_metadata: meta }).catch(() => {});
  }

  return json({ token_hash: link.data.properties.hashed_token });
});
