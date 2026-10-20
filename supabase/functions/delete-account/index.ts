// 계정 지우기(탈퇴). 구글 플레이 규정상 앱 안에서 계정을 지울 수 있어야 해요.
// 로그인한 본인 토큰을 확인한 뒤 그 계정을 지워요. 저장한 소식은 함께 지워져요(on delete cascade).
//
// 배포: npx supabase functions deploy delete-account --no-verify-jwt
// (새 형식 키에서도 잘 되게 게이트 검사는 끄고, 아래에서 본인 토큰을 직접 확인해요.)
import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data?.user) return json({ error: '로그인 정보를 확인하지 못했어요' }, 401);

  const del = await admin.auth.admin.deleteUser(data.user.id);
  if (del.error) {
    console.error('deleteUser', del.error);
    return json({ error: '계정을 지우지 못했어요' }, 500);
  }
  return json({ ok: true });
});
