import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/lib/store';
import '@/lib/notify';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { ready, settings } = useApp();
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-Black': require('../../assets/fonts/Pretendard-Black.otf'),
  });
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // 알림을 눌러 들어오면 오늘 화면으로 가요.
  useEffect(() => {
    if (!loaded || !settings.onboarded || Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/'));
    return () => sub.remove();
  }, [loaded, settings.onboarded]);

  if (!loaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground } }}>
        <Stack.Protected guard={settings.onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="briefing/[date]" options={{ contentStyle: { backgroundColor: C.paper } }} />
        </Stack.Protected>
        <Stack.Protected guard={!settings.onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
