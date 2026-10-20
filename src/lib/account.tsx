// 로그인 상태. 로그인은 하지 않아도 앱을 다 쓸 수 있어요.
// 로그인하면 '저장한 소식'이 계정에 함께 보관돼서, 휴대폰을 바꿔도 그대로 남아요.
import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { Cancelled, providerSignOut, signInWith, type ProviderId } from '@/lib/auth/providers';
import { supabase } from '@/lib/supabase';

export type SignInResult = 'ok' | 'cancel' | 'error' | 'not-ready';

type Ctx = {
  user: User | null;
  provider?: string; // kakao | naver | google
  name?: string;
  busy: ProviderId | null; // 지금 로그인 중인 곳
  signIn: (id: ProviderId) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
};

const AccountContext = createContext<Ctx | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState<ProviderId | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null)).catch(() => {});
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (id: ProviderId): Promise<SignInResult> => {
    setBusy(id);
    try {
      await signInWith(id);
      return 'ok';
    } catch (e) {
      if (e instanceof Cancelled) return 'cancel';
      if ((e as Error)?.message === 'not-ready') return 'not-ready';
      console.warn('[로그인 실패]', id, e);
      return 'error';
    } finally {
      setBusy(null);
    }
  }, []);

  const meta = user?.user_metadata ?? {};
  // 네이버는 계정 서버가 직접 만든 계정이라 login_with에 적어 둬요.
  const provider = (meta.login_with as string | undefined) ?? (user?.app_metadata?.provider as string | undefined);
  const name: string | undefined = meta.name || meta.nickname || meta.full_name || meta.preferred_username || undefined;

  const signOut = useCallback(async () => {
    await providerSignOut(provider);
    await supabase?.auth.signOut().catch(() => {});
  }, [provider]);

  // 계정 삭제: 서버의 계정·저장 기록을 지우고, 카카오·네이버·구글과의 연결도 끊어요.
  const deleteAccount = useCallback(async () => {
    if (!supabase) return false;
    const { error } = await supabase.functions.invoke('delete-account', { body: {} });
    if (error) {
      console.warn('[계정 삭제 실패]', error);
      return false;
    }
    await providerSignOut(provider, true);
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    return true;
  }, [provider]);

  const value = useMemo<Ctx>(
    () => ({ user, provider, name, busy, signIn, signOut, deleteAccount }),
    [user, provider, name, busy, signIn, signOut, deleteAccount],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
}
