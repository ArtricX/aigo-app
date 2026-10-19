import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { C } from '@/theme';

export type IconName =
  | 'home'
  | 'calendar'
  | 'bookmark'
  | 'sliders'
  | 'back'
  | 'share'
  | 'play'
  | 'pause'
  | 'prev'
  | 'next'
  | 'up'
  | 'bell'
  | 'chevronLeft'
  | 'chevronRight';

type Props = { name: IconName; size?: number; color?: string; fill?: string; stroke?: number };

// 아이콘은 모두 같은 굵기의 선으로 그려요. fill을 주면 안쪽을 채워요(선택 상태).
export function Icon({ name, size = 24, color = C.ink, fill = 'none', stroke = 2 }: Props) {
  const common = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const body = (() => {
    switch (name) {
      case 'home':
        return <Path d="M3 11 L12 3.5 L21 11 V20.5 H3 Z" fill={fill} {...common} />;
      case 'calendar':
        return (
          <>
            <Rect x="3.5" y="5" width="17" height="15.5" rx="2" fill={fill} {...common} />
            <Path d="M3.5 10 H20.5 M8 3 V7 M16 3 V7" fill="none" {...common} />
          </>
        );
      case 'bookmark':
        return <Path d="M6 3.5 H18 V21 L12 16.5 L6 21 Z" fill={fill} {...common} />;
      case 'sliders':
        return (
          <>
            <Path d="M4 7 H20 M4 17 H20" fill="none" {...common} />
            <Circle cx="9" cy="7" r="2.5" fill={fill === 'none' ? C.paper : fill} {...common} />
            <Circle cx="15" cy="17" r="2.5" fill={fill === 'none' ? C.paper : fill} {...common} />
          </>
        );
      case 'back':
      case 'chevronLeft':
        return <Path d="M15 4 L7 12 L15 20" fill="none" {...common} />;
      case 'chevronRight':
        return <Path d="M9 4 L17 12 L9 20" fill="none" {...common} />;
      case 'share':
        return (
          <>
            <Circle cx="18" cy="5.5" r="2.5" fill="none" {...common} />
            <Circle cx="6" cy="12" r="2.5" fill="none" {...common} />
            <Circle cx="18" cy="18.5" r="2.5" fill="none" {...common} />
            <Path d="M8.2 10.8 L15.8 6.7 M8.2 13.2 L15.8 17.3" fill="none" {...common} />
          </>
        );
      case 'play':
        return <Path d="M6 3.5 L20 12 L6 20.5 Z" fill={color} stroke="none" />;
      case 'pause':
        return (
          <>
            <Rect x="5" y="3.5" width="5" height="17" rx="1.3" fill={color} />
            <Rect x="14" y="3.5" width="5" height="17" rx="1.3" fill={color} />
          </>
        );
      case 'prev':
        return (
          <>
            <Path d="M19 4 L9 12 L19 20 Z" fill="none" {...common} />
            <Path d="M5 4 V20" fill="none" {...common} />
          </>
        );
      case 'next':
        return (
          <>
            <Path d="M5 4 L15 12 L5 20 Z" fill="none" {...common} />
            <Path d="M19 4 V20" fill="none" {...common} />
          </>
        );
      case 'up':
        return <Path d="M12 19 V6 M6 11 L12 5 L18 11" fill="none" {...common} />;
      case 'bell':
        return (
          <>
            <Path d="M6 10 A6 6 0 0 1 18 10 V14.5 L20 17 H4 L6 14.5 Z" fill={fill} {...common} />
            <Path d="M10 20 A2 2 0 0 0 14 20" fill="none" {...common} />
          </>
        );
    }
  })();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}
