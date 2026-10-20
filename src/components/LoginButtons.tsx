// 카카오·네이버·구글로 시작하기 버튼 묶음 (첫 실행 화면과 설정에서 같이 써요)
// 색은 각 회사 로그인 버튼 안내를 따랐어요. 출시 전에 각 회사가 주는 공식 심볼 그림을 왼쪽에 넣어야 해요(docs/login-setup.md).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { useAccount } from '@/lib/account';
import { isReady, PROVIDERS, type ProviderId } from '@/lib/auth/providers';
import { C, TOUCH } from '@/theme';

const LOOK: Record<ProviderId, { bg: string; fg: string; border?: string; text: string }> = {
  kakao: { bg: '#FEE500', fg: 'rgba(0,0,0,0.85)', text: '카카오로 시작하기' },
  naver: { bg: '#03C75A', fg: '#FFFFFF', text: '네이버로 시작하기' },
  google: { bg: '#FFFFFF', fg: '#1F1F1F', border: '#747775', text: '구글로 시작하기' },
};

const K_LAST = 'aigo:lastProvider';

export function LoginButtons({ onDone }: { onDone?: () => void }) {
  const { signIn, busy } = useAccount();
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(K_LAST).then(setLast).catch(() => {});
  }, []);

  const press = async (id: ProviderId) => {
    if (!isReady(id)) {
      Alert.alert(
        '아직 준비 중이에요',
        Platform.OS === 'web' ? '로그인은 휴대폰 앱에서 할 수 있어요.' : '이 로그인은 곧 열려요. 다른 방법을 써 주세요.',
      );
      return;
    }
    const r = await signIn(id);
    if (r === 'ok') {
      AsyncStorage.setItem(K_LAST, id).catch(() => {});
      onDone?.();
    } else if (r === 'error') {
      Alert.alert('로그인하지 못했어요', '인터넷 연결을 확인하고 다시 눌러 주세요.');
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {PROVIDERS.map(({ id }) => {
        const look = LOOK[id];
        const loading = busy === id;
        return (
          <Pressable
            key={id}
            onPress={() => press(id)}
            disabled={!!busy}
            accessibilityRole="button"
            accessibilityLabel={look.text}
            accessibilityState={{ busy: loading, disabled: !!busy }}
            style={({ pressed }) => ({
              minHeight: TOUCH + 8,
              borderRadius: 16,
              backgroundColor: look.bg,
              borderWidth: look.border ? 1 : 0,
              borderColor: look.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingHorizontal: 18,
              opacity: busy && !loading ? 0.45 : pressed ? 0.8 : 1,
            })}>
            {loading ? (
              <ActivityIndicator color={look.fg} />
            ) : (
              <Txt size={17} weight={700} color={look.fg}>
                {look.text}
              </Txt>
            )}
            {last === id && !loading && (
              <View style={{ position: 'absolute', right: 12, backgroundColor: C.ink, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Txt size={12} weight={700} color={C.paper}>
                  지난번
                </Txt>
              </View>
            )}
          </Pressable>
        );
      })}
      {Platform.OS === 'web' && (
        <Txt size={13} color={C.sub} center lh={1.5}>
          브라우저 미리보기에서는 로그인이 되지 않아요. 휴대폰 앱에서 확인해 주세요.
        </Txt>
      )}
    </View>
  );
}
