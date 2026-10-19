import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { fetchDay, fetchDays, type Day, type DaySummary } from '@/lib/api';

type Load<T> = { data?: T; error?: unknown; loading: boolean; reload: () => void };

let daysMemo: DaySummary[] | undefined;

// 날짜 목록. 앱을 다시 열 때마다(아침 알림을 눌렀을 때 등) 새로 받아요.
export function useDays(): Load<DaySummary[]> {
  const [data, setData] = useState(daysMemo);
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(!daysMemo);

  const reload = useCallback(() => {
    setLoading(true);
    setError(undefined);
    fetchDays()
      .then((d) => {
        daysMemo = d;
        setData(d);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') reload();
    });
    return () => sub.remove();
  }, [reload]);

  return { data, error, loading, reload };
}

export function useDay(date?: string): Load<Day> {
  const [data, setData] = useState<Day>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!date) return;
    let alive = true;
    setLoading(true);
    setError(undefined);
    fetchDay(date)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [date, n]);

  return { data, error, loading, reload: () => setN((x) => x + 1) };
}
