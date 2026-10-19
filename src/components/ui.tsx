import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Txt } from '@/components/Txt';
import { C, storyColor, TOUCH } from '@/theme';

export function TagPill({ tag, color, prefix }: { tag: string; color: string; prefix?: string }) {
  const [bg, fg] = storyColor(color);
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Txt size={13} weight={700} color={fg}>
        {prefix ? `${prefix} · ${tag}` : tag}
      </Txt>
    </View>
  );
}

// 소식 한 줄 카드 (홈·지난 브리핑·저장)
export function StoryRow({
  thumb,
  alt,
  top,
  title,
  onPress,
  size = 84,
}: {
  thumb?: string;
  alt?: string;
  top: ReactNode;
  title: string;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
      <Image
        source={thumb}
        accessibilityLabel={alt}
        contentFit="cover"
        transition={150}
        style={{ width: size, height: size, borderRadius: 10, backgroundColor: C.ground }}
      />
      <View style={{ flex: 1, gap: 6 }}>
        {top}
        <Txt size={17} weight={700} lh={1.35} scaled>
          {title}
        </Txt>
      </View>
    </Pressable>
  );
}

export function Btn({
  label,
  onPress,
  kind = 'dark',
  style,
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'dark' | 'light' | 'ghost' | 'line';
  style?: ViewStyle;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const bg = kind === 'dark' ? C.ink : kind === 'light' ? C.ground : 'transparent';
  const fg = kind === 'dark' ? C.paper : kind === 'ghost' ? C.sub : C.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        kind === 'line' && { borderWidth: 1.5, borderColor: C.faint },
        style,
      ]}>
      {icon}
      <Txt size={kind === 'ghost' ? 16 : 17} weight={700} color={fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator color={C.ink} />
    </View>
  );
}

export function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[s.center, { gap: 14, padding: 24 }]}>
      <Txt size={18} weight={700} center>
        소식을 불러오지 못했어요
      </Txt>
      <Txt size={15} color={C.sub} center lh={1.5}>
        인터넷 연결을 확인한 뒤 다시 눌러 주세요.
      </Txt>
      <Btn label="다시 불러오기" onPress={onRetry} style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const s = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  row: {
    backgroundColor: C.paper,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  btn: {
    minHeight: TOUCH + 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
