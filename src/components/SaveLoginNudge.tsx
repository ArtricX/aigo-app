// 로그인하지 않은 사람이 소식을 처음 저장할 때 딱 한 번만 로그인을 알려 줘요.
// '괜찮아요'를 누르거나 창을 닫으면 다시는 띄우지 않아요. (저장은 로그인 없이도 그대로 돼요)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { LoginButtons } from '@/components/LoginButtons';
import { Txt } from '@/components/Txt';
import { Btn } from '@/components/ui';
import { useAccount } from '@/lib/account';
import { supabase } from '@/lib/supabase';
import { C } from '@/theme';

const K_SHOWN = 'aigo:saveNudgeShown';

export function useSaveLoginNudge() {
  const { user } = useAccount();
  const [open, setOpen] = useState(false);

  // 저장한 직후에 불러요. 조건이 맞을 때만 창을 띄워요.
  const afterSave = useCallback(async () => {
    if (user || !supabase) return;
    try {
      if (await AsyncStorage.getItem(K_SHOWN)) return;
      await AsyncStorage.setItem(K_SHOWN, '1');
    } catch {
      return;
    }
    setOpen(true);
  }, [user]);

  const nudge = <SaveLoginNudge visible={open} onClose={() => setOpen(false)} />;
  return { afterSave, nudge };
}

function SaveLoginNudge({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable onPress={onClose} accessibilityLabel="닫기" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <View
        style={{
          backgroundColor: C.ground,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: insets.bottom + 16,
          gap: 16,
          width: '100%',
          maxWidth: 430,
          alignSelf: 'center',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bookmark" size={20} fill={C.ink} />
          </View>
          <Txt size={22} weight={900} accessibilityRole="header">
            저장했어요!
          </Txt>
        </View>
        <Txt size={16} color="#444444" lh={1.6}>
          {'로그인하면 휴대폰을 바꾸거나 앱을 다시 깔아도\n저장한 소식이 그대로 남아요.'}
        </Txt>
        <LoginButtons onDone={onClose} />
        <Btn label="괜찮아요, 이대로 쓸게요" kind="ghost" onPress={onClose} />
      </View>
    </Modal>
  );
}
