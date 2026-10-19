// 아이고 앱 디자인 기준 (블로그와 같은 색, 글꼴은 프리텐다드)
// 굵기는 세 단계만 써요: 400 본문 / 700 버튼·라벨 / 900 제목

export const C = {
  ground: '#EDEEF0',
  paper: '#FFFFFF',
  ink: '#000000',
  sub: '#555555',
  muted: '#6B6B6B',
  faint: '#BDBDBD',
  rule: '#DADADA',
  highlight: '#FFF1A8',
  warn: '#B42A0B',
  yellow: '#FFD21F',
  pink: '#FF8FC8',
  blue: '#1F3DFF',
  green: '#12A150',
  red: '#FF3D14',
} as const;

export type StoryColor = 'yellow' | 'pink' | 'blue' | 'green' | 'red';

// 소식 색 → [배경, 그 위 글자색]
export const storyColor = (c: string): [string, string] => {
  switch (c) {
    case 'yellow':
      return [C.yellow, C.ink];
    case 'pink':
      return [C.pink, C.ink];
    case 'blue':
      return [C.blue, C.paper];
    case 'green':
      return [C.green, C.paper];
    case 'red':
      return [C.red, C.paper];
    default:
      return [C.ground, C.ink];
  }
};

export const F = {
  400: 'Pretendard-Regular',
  700: 'Pretendard-Bold',
  900: 'Pretendard-Black',
} as const;

export type Weight = keyof typeof F;

// 글자 크기 설정
export const FONT_SCALES = { 보통: 1, 크게: 1.15, '아주 크게': 1.35 } as const;
export type FontSizeName = keyof typeof FONT_SCALES;

export const TOUCH = 48; // 누르는 곳의 최소 크기
