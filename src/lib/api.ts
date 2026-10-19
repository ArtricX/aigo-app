// 블로그(GitHub Pages)에 매일 올라가는 파일을 그대로 읽어 와요.
//  - posts.json            : 날짜별 목록 (홈·지난 브리핑)
//  - content/YYYY-MM-DD.json : 하루치 자세한 내용 (읽기 화면)
// 앱 전용 서버가 없어서, 블로그가 발행되면 앱에도 바로 들어와요.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SITE = 'https://artricx.github.io/ailab';

const abs = (p?: string | null) => {
  if (!p) return undefined;
  if (/^https?:\/\//.test(p)) return p;
  return `${SITE}/${p.replace(/^\.?\//, '')}`;
};

// 블로그는 구절 경계를 '|'로 표시해요. 앱에서는 띄어쓰기로 이어 붙여요.
const plain = (s?: string) => (s ?? '').split('|').join(' ').replace(/\s+/g, ' ').trim();

export type StorySummary = {
  anchor: string;
  tag: string;
  color: string;
  title: string;
  dek: string;
  thumb?: string;
};

export type DaySummary = {
  date: string; // YYYY-MM-DD
  title: string; // 쉼표마다 줄을 바꾼 제목
  minutes: number;
  stories: StorySummary[];
};

export type QA = { q: string; a: string };
export type Source = { name: string; date?: string; url: string };

export type Story = StorySummary & {
  url: string;
  image?: string;
  imageAlt: string;
  graphic?: { url: string; title: string; ratio: number };
  qa: QA[];
  sources: Source[];
  audio?: { url: string; duration?: number };
};

export type Word = { word: string; meaning: string; color: string };

export type Day = {
  date: string;
  title: string;
  url: string;
  minutes: number;
  stories: Story[];
  words: Word[];
};

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function dateLabel(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  const w = WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 ${w}요일`;
}

export function shortDate(date: string) {
  const [, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일`;
}

// 캐시: 인터넷이 끊겨도 마지막으로 받은 내용을 보여 줘요.
async function getJSON<T>(path: string): Promise<T> {
  const key = `cache:${path}`;
  try {
    const res = await fetch(`${SITE}/${path}`, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
    return data;
  } catch (e) {
    const cached = await AsyncStorage.getItem(key).catch(() => null);
    if (cached) return JSON.parse(cached) as T;
    throw e;
  }
}

type RawPost = {
  date: string;
  title: string;
  summary?: string;
  minutes?: number;
  stories: { tag: string; color: string; anchor: string; title: string; dek?: string; thumb?: string; illust?: string }[];
};

export async function fetchDays(): Promise<DaySummary[]> {
  const raw = await getJSON<RawPost[]>('posts.json');
  return raw
    .map((p) => ({
      date: p.date,
      title: plain(p.title).replace(/,\s*/g, ',\n'),
      minutes: p.minutes ?? 5,
      stories: p.stories.map((s) => ({
        anchor: s.anchor,
        tag: s.tag,
        color: s.color,
        title: plain(s.title),
        dek: plain(s.dek),
        thumb: abs(s.thumb ?? s.illust),
      })),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

type RawContent = {
  date: string;
  url: string;
  minutes?: number;
  title: { text: string };
  words?: { word: string; meaning: { text: string } | string; color?: string }[];
  stories: {
    anchor: string;
    url: string;
    tag: string;
    color: string;
    title: { text: string };
    dek: { text: string };
    illustration?: { url?: string; src?: string; alt?: string };
    infographic?: { url?: string; file?: string; title?: string; viewBox?: string };
    qa?: { q: string; a: { text: string } }[];
    sources?: { name: string; date?: string; url: string }[];
    audio?: { url?: string; file?: string; duration?: number };
  }[];
};

const ratioOf = (viewBox?: string) => {
  const p = (viewBox ?? '').split(/\s+/).map(Number);
  return p.length === 4 && p[2] > 0 && p[3] > 0 ? p[2] / p[3] : 2;
};

const dayCache = new Map<string, Day>();

export async function fetchDay(date: string): Promise<Day> {
  const hit = dayCache.get(date);
  if (hit) return hit;
  const r = await getJSON<RawContent>(`content/${date}.json`);
  const day: Day = {
    date: r.date,
    url: r.url,
    minutes: r.minutes ?? 5,
    title: plain(r.title.text),
    words: [],
    stories: r.stories.map((s) => {
      const g = s.infographic;
      const gUrl = abs(g?.url ?? g?.file);
      const aUrl = abs(s.audio?.url ?? s.audio?.file);
      return {
        anchor: s.anchor,
        url: s.url,
        tag: s.tag,
        color: s.color,
        title: plain(s.title.text),
        dek: plain(s.dek.text),
        image: abs(s.illustration?.url ?? s.illustration?.src),
        imageAlt: s.illustration?.alt ?? '',
        graphic: gUrl ? { url: gUrl, title: g?.title ?? '', ratio: ratioOf(g?.viewBox) } : undefined,
        qa: (s.qa ?? []).map((x) => ({ q: x.q, a: x.a.text })),
        sources: s.sources ?? [],
        audio: aUrl ? { url: aUrl, duration: s.audio?.duration } : undefined,
      };
    }),
  };
  day.words = (r.words ?? []).map((w) => ({
    word: w.word,
    meaning: typeof w.meaning === 'string' ? w.meaning : w.meaning.text,
    color: w.color ?? 'yellow',
  }));
  dayCache.set(date, day);
  return day;
}
