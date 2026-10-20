// 계정 서버 (Supabase). 로그인과 '저장한 소식' 옮겨 담기에만 써요.
// 블로그 내용은 지금처럼 GitHub Pages에서 바로 읽어요.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import keys from '../../auth.keys.json';

export const supabase: SupabaseClient | null =
  keys.supabaseUrl && keys.supabaseAnonKey
    ? createClient(keys.supabaseUrl, keys.supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// 앱이 화면에 있을 때만 로그인 유지 토큰을 새로 고쳐요 (배터리 절약).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
