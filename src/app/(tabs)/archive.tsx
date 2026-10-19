import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Txt } from '@/components/Txt';
import { ErrorBox, Loading, StoryRow } from '@/components/ui';
import { dateLabel } from '@/lib/api';
import { useDays } from '@/lib/hooks';
import { C } from '@/theme';

export default function Archive() {
  const insets = useSafeAreaInsets();
  const { data, loading, reload } = useDays();
  const [tag, setTag] = useState('전체');

  const tags = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((d) => d.stories.forEach((s) => set.add(s.tag)));
    return ['전체', ...set];
  }, [data]);

  const days = useMemo(
    () => (data ?? []).filter((d) => tag === '전체' || d.stories.some((s) => s.tag === tag)),
    [data, tag],
  );

  if (!data) return loading ? <Loading /> : <ErrorBox onRetry={reload} />;

  return (
    <FlatList
      data={days}
      keyExtractor={(d) => d.date}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 6 }}>
          <Txt size={28} weight={900} accessibilityRole="header">
            지난 브리핑
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {tags.map((t) => {
              const on = t === tag;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTag(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? C.ink : C.paper }}>
                  <Txt size={15} weight={700} color={on ? C.paper : C.ink}>
                    {t}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      renderItem={({ item: d }) => {
        const first = d.stories.find((s) => tag === '전체' || s.tag === tag) ?? d.stories[0];
        const titles = d.stories.map((s) => s.title);
        return (
          <StoryRow
            size={76}
            thumb={first?.thumb}
            title={`${titles[0]}${titles.length > 1 ? ` 외 ${titles.length - 1}개` : ''}`}
            top={
              <Txt size={14} weight={700} color={C.sub}>
                {dateLabel(d.date)}
              </Txt>
            }
            onPress={() => router.push({ pathname: '/briefing/[date]', params: { date: d.date, story: first?.anchor ?? '' } })}
          />
        );
      }}
      ListEmptyComponent={
        <Txt size={16} color={C.sub} center style={{ marginTop: 40 }}>
          이 주제의 소식이 아직 없어요.
        </Txt>
      }
    />
  );
}
