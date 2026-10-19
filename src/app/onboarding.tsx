import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { TimePicker } from '@/components/TimePicker';
import { Txt } from '@/components/Txt';
import { Btn } from '@/components/ui';
import { askPermission } from '@/lib/notify';
import { clockLabel, useApp } from '@/lib/store';
import { C } from '@/theme';

// 휴대폰 허용 창을 바로 띄우지 않고, 이유를 먼저 설명한 뒤 '알림 받기'를 누른 사람에게만 띄워요.
// (안드로이드는 두 번 거절하면 앱이 다시 물어볼 수 없어요.)
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { update } = useApp();
  const [step, setStep] = useState(1);
  const [minutes, setMinutes] = useState(7 * 60);
  const [allowed, setAllowed] = useState(false);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    setBusy(true);
    const ok = await askPermission().catch(() => false);
    setAllowed(ok);
    setBusy(false);
    setStep(3);
  };

  const finish = () => update({ onboarded: true, notify: allowed, minutes });
  const { ampm, clock } = clockLabel(minutes);

  return (
    <View style={{ flex: 1, backgroundColor: C.ground, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }} accessibilityLabel={`3단계 중 ${step}단계`}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={{ width: n === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: n === step ? C.ink : C.faint }} />
        ))}
      </View>

      {step === 1 && (
        <>
          <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
            <Image source={require('../../assets/brand/lockup.png')} accessibilityLabel="아이고 AI-go" contentFit="contain" style={{ width: 280, height: 124, alignSelf: 'center' }} />
            <Txt size={16} weight={700} color={C.sub} center>
              AI + go = 아이고!
            </Txt>
            <Txt size={30} weight={900} lh={1.3} center accessibilityRole="header">
              {'매일 아침,\nAI 소식 세 가지를\n쉽게 알려 드려요'}
            </Txt>
            <Txt size={17} color="#444444" lh={1.6} center>
              {'읽어도 되고, 들어도 돼요.\n가입 없이 바로 시작해요.'}
            </Txt>
          </View>
          <Btn label="시작하기" onPress={() => setStep(2)} />
        </>
      )}

      {step === 2 && (
        <>
          <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
            <View style={{ alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={60} stroke={1.8} />
            </View>
            <Txt size={28} weight={900} lh={1.3} center accessibilityRole="header">
              {'새 소식이 오면\n알려 드릴까요?'}
            </Txt>
            <Txt size={17} color="#444444" lh={1.6} center>
              {'하루에 한 번, 정한 시간에만 알려 드려요.\n광고 알림은 보내지 않아요.'}
            </Txt>
            <View style={{ backgroundColor: C.paper, borderRadius: 16, padding: 10, gap: 8 }}>
              <Txt size={14} weight={700} color={C.sub} style={{ paddingLeft: 6 }}>
                알림 시간
              </Txt>
              <TimePicker minutes={minutes} onChange={setMinutes} />
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Btn label="알림 받기" onPress={ask} disabled={busy} />
            <Btn label="나중에 할게요" kind="ghost" onPress={() => { setAllowed(false); setStep(3); }} />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <View style={{ flex: 1, justifyContent: 'center', gap: 20 }}>
            <Image source={require('../../assets/brand/symbol-512.png')} accessibilityLabel="외치는 로봇 까치" contentFit="contain" style={{ width: 150, height: 173, alignSelf: 'center' }} />
            <Txt size={28} weight={900} lh={1.3} center accessibilityRole="header">
              {allowed ? `준비 끝!\n${ampm} ${clock}에 만나요` : '준비 끝!'}
            </Txt>
            <Txt size={17} color="#444444" lh={1.6} center>
              {allowed ? '알림이 오면 눌러서\n바로 듣거나 읽으면 돼요.' : '알림은 꺼 두었어요.\n언제든 설정에서 켤 수 있어요.'}
            </Txt>
          </View>
          <Btn label="오늘 소식 보러 가기" onPress={finish} />
        </>
      )}
    </View>
  );
}
