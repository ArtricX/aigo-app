import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { ErrorBox, Loading, StoryRow, TagPill } from '@/components/ui';
import { dateLabel } from '@/lib/api';
import { useDays } from '@/lib/hooks';
import { useApp } from '@/lib/store';
import { C } from '@/theme';

export default function Today() {
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useDays();
  const { homeDay, setHomeDay } = useApp();

  if (!data) return loading ? <Loading /> : <ErrorBox onRetry={reload} />;
  if (error && !data.length) return <ErrorBox onRetry={reload} />;

  const i = Math.min(homeDay, data.length - 1);
  const day = data[i];
  const isToday = i === 0;
  const isLast = i === data.length - 1;
  const hints = ['아침', '· 어제 소식', '· 이틀 전 소식'];
  // 큰 검정 버튼은 처음부터 소리로 읽어 줘요(녹음이 있을 때). 소식 카드는 그 소식부터 읽기.
  const open = (anchor?: string) =>
    router.push({ pathname: '/briefing/[date]', params: { date: day.date, story: anchor ?? '', play: anchor ? '' : '1' } });

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
          <Image source={require('../../../assets/brand/lockup.png')} accessibilityLabel="아이고 AI-go" style={{ height: 44, width: 100 }} contentFit="contain" />
          <Txt size={12} weight={700} color={C.muted} style={{ paddingBottom: 6 }}>
            AI-go
          </Txt>
        </View>
        {!isToday && (
          <Pressable
            onPress={() => setHomeDay(0)}
            accessibilityRole="button"
            style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.ink, justifyContent: 'center' }}>
            <Txt size={14} weight={700} color={C.paper}>
              오늘로 돌아가기
            </Txt>
          </Pressable>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Txt size={14} weight={700} color={C.sub}>
          [ {dateLabel(day.date)} {hints[i] ?? ''} ]
        </Txt>
        <Txt size={27} weight={900} lh={1.3} scaled accessibilityRole="header">
          {day.title}
        </Txt>
      </View>

      <Pressable
        onPress={() => open()}
        accessibilityRole="button"
        accessibilityLabel={isToday ? '오늘 소식 보기' : '이날 소식 보기'}
        style={({ pressed }) => ({
          minHeight: 64,
          borderRadius: 16,
          backgroundColor: C.ink,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          paddingRight: 20,
          opacity: pressed ? 0.8 : 1,
        })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="play" size={18} />
          </View>
          <Txt size={18} weight={700} color={C.paper}>
            {isToday ? '오늘 소식 듣고 읽기' : '이날 소식 듣고 읽기'}
          </Txt>
        </View>
        <Txt size={15} color="#CFCFCF">
          {day.minutes}분
        </Txt>
      </Pressable>

      <View style={{ gap: 10 }}>
        {day.stories.map((s) => (
          <StoryRow
            key={s.anchor}
            thumb={s.thumb}
            title={s.title}
            top={<TagPill tag={s.tag} color={s.color} />}
            onPress={() => open(s.anchor)}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {!isLast && (
          <Pressable
            onPress={() => setHomeDay(i + 1)}
            accessibilityRole="button"
            style={{ flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: C.faint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Icon name="chevronLeft" size={16} stroke={2.6} />
            <Txt size={15} weight={700}>
              {isToday ? '어제 소식 보기' : '전날 소식'}
            </Txt>
          </Pressable>
        )}
        {!isToday && (
          <Pressable
            onPress={() => setHomeDay(i - 1)}
            accessibilityRole="button"
            style={{ flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1.5, borderColor: C.faint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Txt size={15} weight={700}>
              다음 날 소식
            </Txt>
            <Icon name="chevronRight" size={16} stroke={2.6} />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
