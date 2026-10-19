import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Player } from '@/components/Player';
import { Txt } from '@/components/Txt';
import { ErrorBox, Loading, TagPill } from '@/components/ui';
import { dateLabel, shortDate, type Story } from '@/lib/api';
import { useDay, useDays } from '@/lib/hooks';
import { useApp } from '@/lib/store';
import { C, FONT_SCALES, storyColor, type FontSizeName } from '@/theme';

const SHORT = (s: Story) => (s.title.length > 9 ? `${s.title.slice(0, 8)}…` : s.title);

export default function Briefing() {
  const { date, story, play } = useLocalSearchParams<{ date: string; story?: string; play?: string }>();
  const insets = useSafeAreaInsets();
  const { data: day, loading, reload } = useDay(date);
  const { data: days } = useDays();
  const { settings, update, isSaved, toggleSave } = useApp();

  const scroller = useRef<ScrollViewInstance>(null);
  const offsets = useRef<number[]>([]);
  const jumped = useRef(false);
  const audioJump = useRef<(i: number) => void>(() => {});
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goHome = () => router.navigate('/');

  const scrollTo = (i: number, animated = true) => {
    const y = offsets.current[i];
    if (y === undefined) return;
    scroller.current?.scrollTo({ y: Math.max(0, y - 8), animated });
    setActive(i);
  };

  const onSectionLayout = (i: number) => (e: LayoutChangeEvent) => {
    offsets.current[i] = e.nativeEvent.layout.y;
    // 홈에서 특정 소식을 눌러 들어왔으면 그 소식으로 바로 가요.
    if (!jumped.current && day && story) {
      const target = day.stories.findIndex((s) => s.anchor === story);
      if (target > 0 && offsets.current[target] !== undefined) {
        jumped.current = true;
        setTimeout(() => scrollTo(target, false), 0);
      } else if (target <= 0) jumped.current = true;
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.height - layoutMeasurement.height;
    setProgress(max > 0 ? Math.min(1, Math.max(0, contentOffset.y / max)) : 0);
    let a = 0;
    offsets.current.forEach((y, i) => {
      if (y !== undefined && y <= contentOffset.y + 80) a = i;
    });
    if (a !== active) setActive(a);
  };

  // 글자 크게 버튼: 보통 → 크게 → 아주 크게 → 보통
  const cycleFont = () => {
    const names = Object.keys(FONT_SCALES) as FontSizeName[];
    update({ fontSize: names[(names.indexOf(settings.fontSize) + 1) % names.length] });
  };

  useEffect(() => {
    jumped.current = false;
    offsets.current = [];
  }, [date]);

  if (!day) return loading ? <Loading /> : <ErrorBox onRetry={reload} />;

  const idx = days?.findIndex((d) => d.date === day.date) ?? -1;
  const prevDay = idx >= 0 ? days?.[idx + 1] : undefined;
  const isLatest = idx === 0;
  const hasAudio = day.stories.some((s) => s.audio);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      {/* 머리: 뒤로 · 날짜와 읽은 만큼 · 글자 크게 · 홈 */}
      <View style={{ paddingTop: insets.top + 4, backgroundColor: C.paper }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, minHeight: 52 }}>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="이전 화면으로" style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 4, paddingRight: 10 }}>
            <Icon name="back" stroke={2.4} />
            <Txt size={15} weight={700}>
              뒤로
            </Txt>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Txt size={15} weight={900}>
              {dateLabel(day.date)}
            </Txt>
            <Txt size={12} weight={700} color={C.sub}>
              {Math.round(progress * 100)}% 읽음
            </Txt>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Pressable onPress={cycleFont} accessibilityRole="button" accessibilityLabel={`글자 크기 바꾸기, 지금 ${settings.fontSize}`} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={18} weight={900}>
                가<Txt size={12} weight={900}>+</Txt>
              </Txt>
            </Pressable>
            <Pressable onPress={goHome} accessibilityRole="button" accessibilityLabel="홈으로" style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="home" stroke={2.2} />
            </Pressable>
          </View>
        </View>
        {/* 읽은 만큼 차오르는 줄 */}
        <View style={{ height: 3, backgroundColor: C.ground }}>
          <View style={{ height: 3, width: `${progress * 100}%`, backgroundColor: C.ink }} />
        </View>
        {/* 소식 이동 탭: 글자 + 밑줄 */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.rule }} accessibilityRole="tablist">
          {day.stories.map((s, i) => {
            const on = active === i;
            return (
              <Pressable
                key={s.anchor}
                onPress={() => {
                  scrollTo(i);
                  audioJump.current(i);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${i + 1}번째 소식, ${s.title}`}
                style={{ flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: storyColor(s.color)[0] }} />
                  <Txt size={14} weight={700} color={on ? C.ink : C.muted} numberOfLines={1}>
                    {SHORT(s)}
                  </Txt>
                </View>
                <View style={{ width: 56, height: 3, borderRadius: 2, backgroundColor: on ? C.ink : 'transparent' }} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView ref={scroller} onScroll={onScroll} scrollEventThrottle={32} contentContainerStyle={{ paddingBottom: 28 }}>
        {day.stories.map((s, i) => {
          const saved = isSaved(day.date, s.anchor);
          return (
            <View key={s.anchor} onLayout={onSectionLayout(i)} style={{ paddingHorizontal: 20, paddingTop: i === 0 ? 18 : 30, gap: 14 }}>
              {s.image && (
                <Image source={s.image} accessibilityLabel={s.imageAlt} contentFit="cover" transition={150} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 14, backgroundColor: storyColor(s.color)[0] }} />
              )}
              <TagPill tag={s.tag} color={s.color} prefix={String(i + 1)} />
              <Txt size={25} weight={900} lh={1.3} scaled accessibilityRole="header">
                {s.title}
              </Txt>
              <Txt size={17} lh={1.6} color="#333333" scaled>
                {s.dek}
              </Txt>
              {s.graphic && (
                <Image source={s.graphic.url} accessibilityLabel={s.graphic.title} contentFit="contain" style={{ width: '100%', aspectRatio: s.graphic.ratio, backgroundColor: C.ground, borderRadius: 12 }} />
              )}
              {s.qa.map((x) => (
                <View key={x.q} style={{ gap: 6 }}>
                  <Txt size={16} weight={900} scaled>
                    {x.q}
                  </Txt>
                  <Txt size={17} lh={1.75} scaled>
                    {x.a}
                  </Txt>
                </View>
              ))}
              {s.sources.length > 0 && (
                <View style={{ gap: 2 }}>
                  <Txt size={13} weight={700} color={C.sub}>
                    출처
                  </Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 }}>
                    {s.sources.map((src) => (
                      <Pressable key={src.url} onPress={() => Linking.openURL(src.url)} accessibilityRole="link" style={{ minHeight: 36, justifyContent: 'center' }}>
                        <Txt size={13} color={C.sub} style={{ textDecorationLine: 'underline' }}>
                          {src.name}
                          {src.date ? ` (${src.date})` : ''}
                        </Txt>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
                <Pressable
                  onPress={() => toggleSave({ date: day.date, anchor: s.anchor, tag: s.tag, color: s.color, title: s.title, thumb: s.image })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: saved }}
                  style={{ flex: 1, minHeight: 52, borderRadius: 14, backgroundColor: saved ? C.yellow : C.ground, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="bookmark" size={20} fill={saved ? C.ink : 'none'} />
                  <Txt size={15} weight={700}>
                    {saved ? '저장됨' : '저장하기'}
                  </Txt>
                </Pressable>
                <Pressable
                  onPress={() => Share.share({ message: `[아이고] ${s.title}\n${s.url}` }).catch(() => {})}
                  accessibilityRole="button"
                  style={{ flex: 1, minHeight: 52, borderRadius: 14, backgroundColor: C.ground, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="share" size={20} />
                  <Txt size={15} weight={700}>
                    공유하기
                  </Txt>
                </Pressable>
              </View>
            </View>
          );
        })}

        {day.words.length > 0 && (
          <View style={{ marginHorizontal: 20, marginTop: 34, gap: 10 }}>
            <Txt size={20} weight={900} scaled accessibilityRole="header">
              오늘의 말
            </Txt>
            {day.words.map((w) => (
              <View key={w.word} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: C.ground, borderRadius: 12, padding: 14 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 8, backgroundColor: storyColor(w.color)[0] }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt size={17} weight={700} scaled>
                    {w.word}
                  </Txt>
                  <Txt size={16} lh={1.55} color="#333333" scaled>
                    {w.meaning}
                  </Txt>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ margin: 20, marginTop: 30, padding: 18, borderRadius: 16, backgroundColor: C.ink, gap: 12 }}>
          <Txt size={17} weight={900} color={C.paper}>
            {isLatest ? '오늘 소식을 다 읽었어요' : '이날 소식을 다 읽었어요'}
          </Txt>
          {isLatest && (
            <Txt size={14} color="#CFCFCF" lh={1.5}>
              다음 소식은 내일 아침에 알려 드릴게요.
            </Txt>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {prevDay && (
              <Pressable
                onPress={() => router.replace({ pathname: '/briefing/[date]', params: { date: prevDay.date } })}
                accessibilityRole="button"
                style={{ flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}>
                <Icon name="chevronLeft" size={16} stroke={2.6} />
                <Txt size={15} weight={700}>
                  {shortDate(prevDay.date)} 소식
                </Txt>
              </Pressable>
            )}
            <Pressable onPress={goHome} accessibilityRole="button" style={{ flex: 1, minHeight: 52, borderRadius: 12, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={15} weight={700}>
                홈으로
              </Txt>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {hasAudio && (
        <Player
          stories={day.stories}
          current={active}
          autoPlay={play === '1'}
          bottomInset={insets.bottom}
          onStoryChange={(i) => scrollTo(i)}
          registerJump={(fn) => {
            audioJump.current = fn;
          }}
        />
      )}

      {/* 맨 위로: 조금 내려 읽으면 나타나요 */}
      {progress > 0.12 && (
        <Pressable
          onPress={() => scroller.current?.scrollTo({ y: 0, animated: true })}
          accessibilityRole="button"
          accessibilityLabel="맨 위로"
          style={{
            position: 'absolute',
            right: 16,
            bottom: (hasAudio ? 150 : 16) + insets.bottom,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: C.paper,
            borderWidth: 1,
            borderColor: C.rule,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.16,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}>
          <Icon name="up" size={20} stroke={2.4} />
          <Txt size={11} weight={700}>
            위로
          </Txt>
        </Pressable>
      )}
    </View>
  );
}
