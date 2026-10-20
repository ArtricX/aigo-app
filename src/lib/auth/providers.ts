// 구글·네이버·카카오 로그인.
// 휴대폰에 그 앱이 깔려 있으면 앱 화면이 잠깐 떠서 '동의' 한 번이면 끝나요.
// (카카오톡·네이버 앱이 없으면 휴대폰 안의 로그인 창이 떠요. 구글은 휴대폰에 등록된 계정을 골라요.)
//
// 휴대폰 전용 부품(네이티브 모듈)은 웹 미리보기에는 없어서, 누를 때 불러와요.
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

import keys from '../../../auth.keys.json';
import { supabase } from '@/lib/supabase';

export type ProviderId = 'kakao' | 'naver' | 'google';

export const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: 'kakao', label: '카카오' },
  { id: 'naver', label: '네이버' },
  { id: 'google', label: '구글' },
];

export const providerLabel = (id?: string | null) =>
  id === 'email' ? '이메일' : (PROVIDERS.find((p) => p.id === id)?.label ?? '');

// 메일 인증은 계정 서버만 있으면 돼요 (웹 미리보기에서도 돼요)
export const emailReady = () => !!supabase;

// 키를 받아 넣었는지 (안 넣었으면 버튼을 '준비 중'으로 보여요)
export function isReady(id: ProviderId) {
  if (!supabase || Platform.OS === 'web') return false;
  if (id === 'kakao') return !!keys.kakaoNativeAppKey;
  if (id === 'naver') return !!(keys.naverClientId && keys.naverClientSecret);
  return !!keys.googleWebClientId;
}

// 사용자가 창을 닫은 것 → 오류 문구를 띄우지 않아요.
export class Cancelled extends Error {}

const isCancel = (e: unknown) => {
  const s = String((e as { code?: string; message?: string })?.code ?? '') + String((e as Error)?.message ?? '');
  return /cancel|취소/i.test(s);
};

let kakaoReady = false;
let naverReady = false;
let googleReady = false;

async function kakao() {
  const core = require('@react-native-kakao/core');
  const user = require('@react-native-kakao/user');
  if (!kakaoReady) {
    await core.initializeKakaoSDK(keys.kakaoNativeAppKey);
    kakaoReady = true;
  }
  // 카카오에는 '한 번 쓰고 버리는 번호'를 숨겨서 보내고, 계정 서버에는 원래 번호를 보내 확인해요(가로채기 방지).
  const nonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  let token: { idToken?: string; accessToken: string };
  try {
    token = await user.login({ nonce: hashed });
  } catch (e) {
    if (isCancel(e)) throw new Cancelled();
    throw e;
  }
  if (!token.idToken) throw new Error('카카오 OpenID Connect가 꺼져 있어요 (카카오 개발자 콘솔 > 카카오 로그인 > OpenID Connect 켜기)');
  const { error } = await supabase!.auth.signInWithIdToken({
    provider: 'kakao',
    token: token.idToken,
    access_token: token.accessToken,
    nonce,
  });
  if (error) throw error;
}

async function naver() {
  const NaverLogin = require('@react-native-seoul/naver-login').default;
  if (!naverReady) {
    NaverLogin.initialize({
      appName: '아이고',
      consumerKey: keys.naverClientId,
      consumerSecret: keys.naverClientSecret,
      serviceUrlSchemeIOS: 'aigonaverlogin',
    });
    naverReady = true;
  }
  const res = await NaverLogin.login();
  if (!res.isSuccess || !res.successResponse) {
    if (res.failureResponse?.isCancel) throw new Cancelled();
    throw new Error(res.failureResponse?.message ?? '네이버 로그인 실패');
  }
  // 네이버는 신분 확인 토큰(ID 토큰)을 주지 않아서, 계정 서버의 작은 함수가 네이버에 직접 확인해요.
  const { data, error } = await supabase!.functions.invoke('naver-login', {
    body: { accessToken: res.successResponse.accessToken },
  });
  if (error) throw error;
  if (!data?.token_hash) throw new Error('네이버 계정 확인 실패');
  const { error: e2 } = await supabase!.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (e2) throw e2;
}

async function google() {
  const G = require('@react-native-google-signin/google-signin');
  if (!googleReady) {
    G.GoogleSignin.configure({ webClientId: keys.googleWebClientId });
    googleReady = true;
  }
  await G.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  let res;
  try {
    res = await G.GoogleSignin.signIn();
  } catch (e: any) {
    if (isCancel(e) || (G.isErrorWithCode(e) && e.code === G.statusCodes.SIGN_IN_CANCELLED)) throw new Cancelled();
    throw e;
  }
  if (!G.isSuccessResponse(res)) throw new Cancelled();
  const idToken = res.data.idToken;
  if (!idToken) throw new Error('구글 신분 확인 토큰을 받지 못했어요 (webClientId 확인)');
  const { error } = await supabase!.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
}

export async function signInWith(id: ProviderId) {
  if (!isReady(id)) throw new Error('not-ready');
  if (id === 'kakao') return kakao();
  if (id === 'naver') return naver();
  return google();
}

// 로그아웃할 때 각 앱의 로그인 기억도 지워요 (다음엔 계정을 다시 고를 수 있게).
// unlink = 계정 삭제 때: 우리 앱과의 연결 자체를 끊어요.
export async function providerSignOut(id: string | undefined, unlink = false) {
  if (Platform.OS === 'web') return;
  try {
    if (id === 'kakao') {
      const user = require('@react-native-kakao/user');
      await (unlink ? user.unlink() : user.logout());
    } else if (id === 'naver') {
      const NaverLogin = require('@react-native-seoul/naver-login').default;
      await (unlink ? NaverLogin.deleteToken() : NaverLogin.logout());
    } else if (id === 'google') {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      if (unlink) await GoogleSignin.revokeAccess().catch(() => {});
      await GoogleSignin.signOut();
    }
  } catch {
    // 이미 끊겨 있으면 그냥 넘어가요.
  }
}
