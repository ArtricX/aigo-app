import { Text, type TextProps } from 'react-native';

import { useApp } from '@/lib/store';
import { C, F, type Weight } from '@/theme';

type Props = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  lh?: number; // 줄 간격 배수
  // true면 설정의 '글자 크기'를 따라 커져요 (본문·제목). 버튼·메뉴는 false.
  scaled?: boolean;
  center?: boolean;
};

// 한글은 글자마다 줄이 바뀔 수 있어서, 단어 안 글자 사이에 '줄 바꿈 금지' 표시(U+2060)를 넣어
// 블로그처럼 띄어쓰기에서만 줄이 바뀌게 해요.
const WJ = '⁠';
export const keepAll = (s: string) =>
  s
    .split(' ')
    .map((w) => Array.from(w).join(WJ))
    .join(' ');

export function Txt({ size = 16, weight = 400, color = C.ink, lh, scaled = false, center, style, children, ...rest }: Props) {
  const { scale } = useApp();
  const fs = Math.round(size * (scaled ? scale : 1));
  const body = typeof children === 'string' ? keepAll(children) : children;
  return (
    <Text
      maxFontSizeMultiplier={1.3}
      {...rest}
      children={body}
      style={[
        {
          fontFamily: F[weight],
          fontSize: fs,
          color,
          lineHeight: lh ? Math.round(fs * lh) : undefined,
          textAlign: center ? 'center' : undefined,
          letterSpacing: weight === 900 ? -0.4 : 0,
        },
        style,
      ]}
    />
  );
}
