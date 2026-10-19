import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { StoryRow, TagPill } from '@/components/ui';
import { shortDate } from '@/lib/api';
import { useApp } from '@/lib/store';
import { C } from '@/theme';

export default function Saved() {
  const insets = useSafeAreaInsets();
  const { saved } = useApp();

  return (
    <FlatList
      data={saved}
      keyExtractor={(s) => `${s.date}#${s.anchor}`}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 24, gap: 10, flexGrow: 1 }}
      ListHeaderComponent={
        <View style={{ gap: 6, marginBottom: 6 }}>
          <Txt size={28} weight={900} accessibilityRole="header">
            저장한 소식
          </Txt>
          <Txt size={15} color={C.sub} lh={1.5}>
            로그인 없이 이 휴대폰에 저장돼요.
          </Txt>
        </View>
      }
      renderItem={({ item: s }) => (
        <StoryRow
          size={76}
          thumb={s.thumb}
          title={s.title}
          top={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TagPill tag={s.tag} color={s.color} />
              <Txt size={13} weight={700} color={C.sub}>
                {shortDate(s.date)}
              </Txt>
            </View>
          }
          onPress={() => router.push({ pathname: '/briefing/[date]', params: { date: s.date, story: s.anchor } })}
        />
      )}
      ListEmptyComponent={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 }}>
          <Icon name="bookmark" size={40} color={C.faint} />
          <Txt size={17} weight={700} center>
            아직 저장한 소식이 없어요
          </Txt>
          <Txt size={15} color={C.sub} center lh={1.5}>
            소식을 읽다가 아래의 &apos;저장하기&apos;를 누르면{'\n'}여기에 모여요.
          </Txt>
        </View>
      }
    />
  );
}
