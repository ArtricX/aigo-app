// 아침 알림: 서버 없이 휴대폰이 매일 정한 시각에 스스로 알려 줘요.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'morning';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: '아침 소식',
    description: '하루 한 번, 정한 시간에 새 소식을 알려 드려요.',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

// 휴대폰 허용 창을 띄워요. 이미 허용했으면 창 없이 true.
export async function askPermission(): Promise<boolean> {
  await ensureChannel(); // 안드로이드 13 이상은 채널이 있어야 허용 창이 떠요.
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return res.granted;
}

export async function permissionState(): Promise<'granted' | 'ask' | 'blocked'> {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'ask' : 'blocked';
}

export async function cancelMorning() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleMorning(minutes: number) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '아이고! 오늘 아침 AI 소식 도착',
      body: '세 가지 소식, 5분이면 들을 수 있어요.',
      data: { url: '/' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(minutes / 60),
      minute: minutes % 60,
      channelId: CHANNEL,
    },
  });
}
