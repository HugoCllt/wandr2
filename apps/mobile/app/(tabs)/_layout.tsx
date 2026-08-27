import { Tabs } from 'expo-router';
import { GlassTabBar } from '../../src/components/GlassTabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="explore" options={{ title: 'Explorer' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendrier' }} />
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
