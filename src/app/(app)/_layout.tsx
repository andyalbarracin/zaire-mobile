import { Redirect, Tabs } from 'expo-router';

import { ZaireTabBar } from '@/components/ZaireTabBar';
import { useAuth } from '@/lib/auth';

export default function AppLayout() {
  const { session, devBypass } = useAuth();
  if (!session && !devBypass) return <Redirect href="/(auth)/login" />;

  // La barra custom decide qué tabs mostrar (gateo por enabled_modules). Trace existe
  // como ruta pero no como tab (se llega desde "Más").
  return (
    <Tabs tabBar={(props) => <ZaireTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="field" />
      <Tabs.Screen name="assets" />
      <Tabs.Screen name="stock" />
      <Tabs.Screen name="trace" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
