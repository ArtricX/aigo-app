// 아침 알림: 서버 없이 휴대폰이 매일 정한 시각에 스스로 알려 줘요.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL = 'morning';
const IS_WEB = Platform.OS === 'web';
const TITLE = '아이고! 오늘 아침 AI 소식 도착';
const BODY = '세 가지 소식, 5분이면 들을 수 있어요.';

// ---------- 브라우저 미리보기용 ----------
// 브라우저는 창을 닫으면 알림을 보낼 수 없어요. 그래서 미리보기 창이 열려 있는 동안만
// 정한 시각에 브라우저 알림(허용했을 때)과 화면 위 안내 띠를 띄워 시험할 수 있게 해요.
type WebPerm = 'granted' | 'denied' | 'default' | 'unsupported';
const webPerm = (): WebPerm =>
  typeof window !== 'undefined' && 'Notification' in window ? (window.Notification.permission as WebPerm) : 'unsupported';
let webTimer: ReturnType<typeof setInterval> | undefined;
let webFiredOn = '';
const webListeners = new Set<() => void>();

// 화면 위 안내 띠가 알림 시각을 들을 수 있게 해요(브라우저에서만 쓰여요).
export function onWebMorning(cb: () => void) {
  webListeners.add(cb);
  return () => {
    webListeners.delete(cb);
  };
}

function webFire() {
  webListeners.forEach((cb) => cb());
  try {
    if (webPerm() === 'granted') {
      const n = new window.Notification(TITLE, { body: BODY });
      n.onclick = () => window.focus();
    }
  } catch {
    // 휴대폰 브라우저 등은 이 방식의 알림을 지원하지 않아요. 화면 위 안내 띠로 대신해요.
  }
}

function webSchedule(minutes: number) {
  if (webTimer) clearInterval(webTimer);
  const check = () => {
    const d = new Date();
    const today = d.toDateString();
    if (d.getHours() * 60 + d.getMinutes() === minutes && webFiredOn !== today) {
      webFiredOn = today;
      webFire();
    }
  };
  webFiredOn = '';
  check();
  webTimer = setInterval(check, 10000);
}

if (!IS_WEB) Notifications.setNotificationHandler({
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
  if (IS_WEB) {
    const p = webPerm();
    if (p === 'unsupported') return true; // 화면 위 안내 띠로 대신 알려요
    if (p === 'granted') return true;
    if (p === 'denied') return true; // 브라우저 알림은 막혀도 안내 띠는 떠요
    return (await window.Notification.requestPermission()) !== 'default';
  }
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
  if (IS_WEB) return 'granted';
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return 'granted';
  return p.canAskAgain ? 'ask' : 'blocked';
}

export async function cancelMorning() {
  if (IS_WEB) {
    if (webTimer) clearInterval(webTimer);
    webTimer = undefined;
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleMorning(minutes: number) {
  if (IS_WEB) return webSchedule(minutes);
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: TITLE,
      body: BODY,
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
