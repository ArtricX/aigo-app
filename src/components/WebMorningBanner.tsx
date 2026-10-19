import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { onWebMorning } from '@/lib/notify';
import { C } from '@/theme';

// 브라우저 미리보기 전용: 알림 시각이 되면 화면 위에 휴대폰 알림처럼 띠를 띄워요.
export function WebMorningBanner() {
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return onWebMorning(() => setShow(true));
  }, []);

  if (!show) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{ position: 'absolute', top: insets.top + 8, left: 10, right: 10, zIndex: 100, backgroundColor: C.paper, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.rule, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bell" size={22} />
      </View>
      <Pressable
        style={{ flex: 1, gap: 2 }}
        accessibilityRole="button"
        onPress={() => {
          setShow(false);
          router.navigate('/');
        }}>
        <Txt size={15} weight={700}>
          아이고! 오늘 아침 AI 소식 도착
        </Txt>
        <Txt size={13} color={C.sub}>
          세 가지 소식, 5분이면 들을 수 있어요.
        </Txt>
      </Pressable>
      <Pressable onPress={() => setShow(false)} accessibilityRole="button" accessibilityLabel="닫기" style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={14} weight={700} color={C.sub}>
          닫기
        </Txt>
      </Pressable>
    </View>
  );
}
