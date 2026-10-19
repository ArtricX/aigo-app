import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { useApp } from '@/lib/store';
import { C } from '@/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: '오늘', icon: 'home' },
  archive: { label: '지난 브리핑', icon: 'calendar' },
  saved: { label: '저장', icon: 'bookmark' },
  settings: { label: '설정', icon: 'sliders' },
};

// 아이콘만 두지 않고 글자를 함께 달아요. 선택은 굵기 대신 색으로만 구분해요.
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { setHomeDay } = useApp();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: C.paper,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 10),
        borderTopWidth: 1,
        borderTopColor: C.rule,
      }}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const on = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
            onPress={() => {
              // '오늘'은 어느 날을 보고 있든 오늘로 돌아와요.
              if (route.name === 'index') setHomeDay(0);
              if (!on) navigateToTab(route.key);
            }}
            style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon
              name={tab.icon}
              size={26}
              color={on ? C.ink : C.muted}
              fill={on ? C.yellow : 'none'}
            />
            <Txt size={13} weight={700} color={on ? C.ink : C.muted}>
              {tab.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
