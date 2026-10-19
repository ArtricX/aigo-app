import { Pressable, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { clockLabel } from '@/lib/store';
import { C } from '@/theme';

// 하루 24시간 중 아무 때나: 시는 1시간, 분은 5분씩 바꿔요.
export function TimePicker({ minutes, onChange }: { minutes: number; onChange: (m: number) => void }) {
  const { ampm, clock } = clockLabel(minutes);
  const add = (d: number) => onChange((minutes + d + 1440) % 1440);
  const Step = ({ label, a11y, d }: { label: string; a11y: string; d: number }) => (
    <Pressable
      onPress={() => add(d)}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({ width: 64, height: 40, borderRadius: 10, backgroundColor: pressed ? C.rule : C.paper, alignItems: 'center', justifyContent: 'center' })}>
      <Txt size={22} weight={900}>
        {label}
      </Txt>
    </Pressable>
  );
  const Col = ({ unit, step, name }: { unit: string; step: number; name: string }) => (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Step label="+" a11y={`${name} 늦게`} d={step} />
      <Txt size={12} weight={700} color={C.sub}>
        {unit}
      </Txt>
      <Step label="−" a11y={`${name} 일찍`} d={-step} />
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.ground, borderRadius: 14, padding: 8 }}>
      <Col unit="시" step={60} name="한 시간" />
      <View accessibilityLiveRegion="polite" style={{ alignItems: 'center', gap: 2 }}>
        <Txt size={15} weight={700}>
          {ampm}
        </Txt>
        <Txt size={40} weight={900}>
          {clock}
        </Txt>
      </View>
      <Col unit="분" step={5} name="5분" />
    </View>
  );
}
