import { useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';

import { C } from '@/theme';

type Props = {
  value: number; // 0~1, 지금 재생 위치
  onSeek: (ratio: number) => void; // 손을 뗀 위치(0~1)
  onScrub?: (ratio: number | null) => void; // 끄는 동안의 위치(시간 표시용), 끝나면 null
  disabled?: boolean;
  label?: string;
};

// 재생 위치 막대: 누르면 그 위치로, 끌면 따라오다 손을 뗀 곳부터 재생해요.
// 막대는 얇게 보이지만 누르는 곳은 위아래로 넉넉하게(48px) 잡았어요.
export function SeekBar({ value, onSeek, onScrub, disabled, label }: Props) {
  const width = useRef(1);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;

  const ratioAt = (e: GestureResponderEvent) => Math.min(1, Math.max(0, e.nativeEvent.locationX / width.current));

  const move = (e: GestureResponderEvent) => {
    const r = ratioAt(e);
    setDrag(r);
    onScrub?.(r);
  };
  const end = (e: GestureResponderEvent) => {
    const r = ratioAt(e);
    setDrag(null);
    onScrub?.(null);
    onSeek(r);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label ?? '재생 위치'}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100), text: `${Math.round(shown * 100)}%` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onSeek(Math.min(1, Math.max(0, value + (e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1))))}
      onLayout={(e) => (width.current = Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => !disabled}
      onMoveShouldSetResponder={() => !disabled}
      onResponderTerminationRequest={() => false}
      onResponderGrant={move}
      onResponderMove={move}
      onResponderRelease={end}
      onResponderTerminate={() => {
        setDrag(null);
        onScrub?.(null);
      }}
      style={{ flex: 1, height: 48, justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <View pointerEvents="none" style={{ height: drag !== null ? 8 : 5, borderRadius: 4, backgroundColor: '#444444' }}>
        <View style={{ width: `${shown * 100}%`, height: '100%', borderRadius: 4, backgroundColor: C.yellow }} />
      </View>
      {/* 손잡이 */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: `${shown * 100}%`,
          marginLeft: drag !== null ? -11 : -8,
          width: drag !== null ? 22 : 16,
          height: drag !== null ? 22 : 16,
          borderRadius: 11,
          backgroundColor: C.yellow,
          borderWidth: 2,
          borderColor: C.ink,
        }}
      />
    </View>
  );
}
