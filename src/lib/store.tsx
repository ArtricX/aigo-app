// 설정과 저장한 소식은 휴대폰 안에 저장해요.
// 로그인하면 저장한 소식은 계정에도 함께 보관해요(휴대폰을 바꿔도 남게). 설정은 휴대폰마다 따로예요.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { FONT_SCALES, type FontSizeName } from '@/theme';
import { useAccount } from '@/lib/account';
import { scheduleMorning, cancelMorning } from '@/lib/notify';
import { supabase } from '@/lib/supabase';

export type SavedStory = {
  date: string;
  anchor: string;
  tag: string;
  color: string;
  title: string;
  thumb?: string;
  savedAt: number;
};

const keyOf = (x: { date: string; anchor: string }) => `${x.date}#${x.anchor}`;

type Row = { date: string; anchor: string; tag: string; color: string; title: string; thumb: string | null; saved_at: string };
const toRow = (x: SavedStory, user_id: string) => ({
  user_id,
  date: x.date,
  anchor: x.anchor,
  tag: x.tag,
  color: x.color,
  title: x.title,
  thumb: x.thumb ?? null,
  saved_at: new Date(x.savedAt).toISOString(),
});
const fromRow = (r: Row): SavedStory => ({
  date: r.date,
  anchor: r.anchor,
  tag: r.tag,
  color: r.color,
  title: r.title,
  thumb: r.thumb ?? undefined,
  savedAt: Date.parse(r.saved_at) || Date.now(),
});

type Settings = {
  onboarded: boolean;
  notify: boolean;
  minutes: number; // 알림 시각 (자정부터 몇 분)
  fontSize: FontSizeName;
};

const DEFAULTS: Settings = { onboarded: false, notify: false, minutes: 7 * 60, fontSize: '크게' };
const K_SETTINGS = 'aigo:settings';
const K_SAVED = 'aigo:saved';

type Ctx = {
  ready: boolean;
  settings: Settings;
  scale: number;
  update: (patch: Partial<Settings>) => void;
  saved: SavedStory[];
  isSaved: (date: string, anchor: string) => boolean;
  toggleSave: (s: Omit<SavedStory, 'savedAt'>) => void;
  // 홈에서 보고 있는 날 (0 = 오늘). 아래 메뉴 '오늘'을 누르면 0으로 돌아와요.
  homeDay: number;
  setHomeDay: (n: number) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState<SavedStory[]>([]);
  const [homeDay, setHomeDay] = useState(0);
  const { user } = useAccount();
  const userId = user?.id;

  useEffect(() => {
    (async () => {
      try {
        const [s, v] = await Promise.all([AsyncStorage.getItem(K_SETTINGS), AsyncStorage.getItem(K_SAVED)]);
        if (s) {
          const loaded = { ...DEFAULTS, ...JSON.parse(s) };
          setSettings(loaded);
          // 브라우저 미리보기는 창을 열 때마다 알림 시계를 다시 켜야 해요
          if (Platform.OS === 'web' && loaded.notify) scheduleMorning(loaded.minutes).catch(() => {});
        }
        if (v) setSaved(JSON.parse(v));
      } catch {
        // 저장된 값을 못 읽으면 기본값으로 시작해요.
      }
      setReady(true);
    })();
  }, []);

  // 로그인하면: 계정에 있던 것 + 이 휴대폰에 있던 것을 합쳐서 양쪽에 똑같이 맞춰요.
  useEffect(() => {
    if (!ready || !userId || !supabase) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('saved_stories').select('date,anchor,tag,color,title,thumb,saved_at');
      if (error || !alive) return;
      const remote = (data as Row[]).map(fromRow);
      const remoteKeys = new Set(remote.map(keyOf));
      setSaved((local) => {
        const onlyLocal = local.filter((x) => !remoteKeys.has(keyOf(x)));
        if (onlyLocal.length) {
          supabase!.from('saved_stories').upsert(onlyLocal.map((x) => toRow(x, userId))).then(() => {});
        }
        const merged = [...remote, ...onlyLocal].sort((a, b) => b.savedAt - a.savedAt);
        AsyncStorage.setItem(K_SAVED, JSON.stringify(merged)).catch(() => {});
        return merged;
      });
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, userId]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(K_SETTINGS, JSON.stringify(next)).catch(() => {});
      if ('notify' in patch || 'minutes' in patch) {
        if (next.notify) scheduleMorning(next.minutes).catch(() => {});
        else cancelMorning().catch(() => {});
      }
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (date: string, anchor: string) => saved.some((x) => x.date === date && x.anchor === anchor),
    [saved],
  );

  const toggleSave = useCallback((s: Omit<SavedStory, 'savedAt'>) => {
    setSaved((prev) => {
      const exists = prev.some((x) => x.date === s.date && x.anchor === s.anchor);
      const next = exists
        ? prev.filter((x) => !(x.date === s.date && x.anchor === s.anchor))
        : [{ ...s, savedAt: Date.now() }, ...prev];
      AsyncStorage.setItem(K_SAVED, JSON.stringify(next)).catch(() => {});
      if (userId && supabase) {
        // 계정에도 똑같이 (인터넷이 끊겨 실패하면 다음 로그인 때 다시 맞춰요)
        if (exists) supabase.from('saved_stories').delete().match({ date: s.date, anchor: s.anchor }).then(() => {});
        else supabase.from('saved_stories').upsert(toRow(next[0], userId)).then(() => {});
      }
      return next;
    });
  }, [userId]);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      settings,
      scale: FONT_SCALES[settings.fontSize] ?? 1,
      update,
      saved,
      isSaved,
      toggleSave,
      homeDay,
      setHomeDay,
    }),
    [ready, settings, update, saved, isSaved, toggleSave, homeDay],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function clockLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { ampm: h < 12 ? '오전' : '오후', clock: `${h12}:${String(m).padStart(2, '0')}` };
}
