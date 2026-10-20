// app.json 설정에 로그인 SDK 설정을 더해요.
// 키가 비어 있는 로그인은 설정을 넣지 않아서, 키를 받기 전에도 앱 빌드는 그대로 돼요.
import type { ConfigContext, ExpoConfig } from 'expo/config';

import keys from './auth.keys.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins = [...(config.plugins ?? [])];

  if (keys.kakaoNativeAppKey) {
    // 카카오톡이 없는 휴대폰에서 카카오 계정으로 로그인한 뒤 앱으로 돌아오는 길(authCodeHandlerActivity)
    plugins.push([
      '@react-native-kakao/core',
      {
        nativeAppKey: keys.kakaoNativeAppKey,
        android: { authCodeHandlerActivity: true },
        ios: { handleKakaoOpenUrl: true },
      },
    ]);
  }
  if (keys.naverClientId) {
    // 네이버 앱에서 로그인한 뒤 우리 앱으로 돌아오는 주소 (iOS용, 안드로이드는 필요 없음)
    plugins.push(['@react-native-seoul/naver-login', { urlScheme: 'aigonaverlogin' }]);
  }
  if (keys.googleIosUrlScheme) {
    // 안드로이드는 따로 설정할 게 없어요. iOS를 낼 때만 필요해요.
    plugins.push(['@react-native-google-signin/google-signin', { iosUrlScheme: keys.googleIosUrlScheme }]);
  }

  return { ...(config as ExpoConfig), plugins };
};
