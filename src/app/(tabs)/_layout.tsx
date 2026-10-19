import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { C } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tabBar={(props) => <TabBar {...(props as any)} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.ground } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="archive" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
