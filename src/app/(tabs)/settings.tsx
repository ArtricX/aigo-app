import Constants from 'expo-constants';
import { Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { TimePicker } from '@/components/TimePicker';
import { Txt } from '@/components/Txt';
import { SITE } from '@/lib/api';
import { askPermission, permissionState } from '@/lib/notify';
import { useApp } from '@/lib/store';
import { C, F, FONT_SCALES, type FontSizeName } from '@/theme';

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={{ backgroundColor: C.paper, borderRadius: 16, padding: 16, gap: 14 }}>{children}</View>
);

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { settings, update } = useApp();
  const [perm, setPerm] = useState<'granted' | 'ask' | 'blocked'>('ask');

  useEffect(() => {
    permissionState().then(setPerm).catch(() => {});
  }, [settings.notify]);

  const toggleNotify = async (on: boolean) => {
    if (!on) return update({ notify: false });
    const ok = await askPermission();
    setPerm(ok ? 'granted' : await permissionState());
    update({ notify: ok });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}>
      <Txt size={28} weight={900} accessibilityRole="header">
        설정
      </Txt>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2, flex: 1 }}>
            <Txt size={17} weight={700}>
              아침 알림
            </Txt>
            <Txt size={14} color={C.sub}>
              새 소식이 오면 알려 드려요
            </Txt>
          </View>
          <Switch
            value={settings.notify}
            onValueChange={toggleNotify}
            accessibilityLabel="아침 알림"
            trackColor={{ true: C.green, false: C.faint }}
            thumbColor={C.paper}
            style={{ transform: [{ scale: 1.2 }] }}
          />
        </View>
        {perm === 'blocked' && (
          <Pressable onPress={() => Linking.openSettings()} accessibilityRole="button">
            <Txt size={14} weight={700} color={C.warn} lh={1.5}>
              휴대폰 설정에서 알림이 꺼져 있어요. 여기를 눌러 휴대폰 설정 &gt; 알림에서 켜 주세요.
            </Txt>
          </Pressable>
        )}
        <TimePicker minutes={settings.minutes} onChange={(m) => update({ minutes: m })} />
        {settings.minutes < 7 * 60 && (
          <Txt size={13} weight={700} color={C.warn} lh={1.5}>
            새 소식은 아침 7시에 올라와요. 7시 전에는 어제 소식이 와요.
          </Txt>
        )}
      </Card>

      <Card>
        <Txt size={17} weight={700}>
          글자 크기
        </Txt>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(Object.keys(FONT_SCALES) as FontSizeName[]).map((name) => {
            const on = settings.fontSize === name;
            return (
              <Pressable
                key={name}
                onPress={() => update({ fontSize: name })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{ flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: on ? C.ink : C.ground, alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={16} weight={700} color={on ? C.paper : C.ink}>
                  {name}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <View style={{ backgroundColor: C.ground, borderRadius: 10, padding: 12 }}>
          <Txt size={16} lh={1.6} scaled>
            카카오톡에 말로 부르는 AI 비서가 와요.
          </Txt>
        </View>
      </Card>

      <Card>
        <Txt size={17} weight={700}>
          읽어 주는 목소리
        </Txt>
        <Txt size={15} color={C.sub} lh={1.6}>
          아이고 아나운서가 매일 아침 소식을 읽어 드려요. 빠르기는 듣는 화면에서 바꿀 수 있어요.
        </Txt>
      </Card>

      <View style={{ gap: 4, paddingTop: 6 }}>
        <Pressable onPress={() => Linking.openURL(`${SITE}/privacy.html`)} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt size={15} weight={700} style={{ textDecorationLine: 'underline' }}>
            개인정보처리방침
          </Txt>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(SITE)} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt size={15} weight={700} style={{ textDecorationLine: 'underline' }}>
            아이고 블로그 열기
          </Txt>
        </Pressable>
        <Txt size={13} color={C.muted} style={{ fontFamily: F[400] }}>
          아이고 AI-go · 버전 {Constants.expoConfig?.version ?? '1.0.0'}
        </Txt>
      </View>
    </ScrollView>
  );
}
