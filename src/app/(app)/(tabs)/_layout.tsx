import { Tabs } from 'expo-router';

import { ZaireTabBar } from '@/components/ZaireTabBar';

/**
 * Tabs de la app. La barra custom decide qué mostrar (gateo por enabled_modules).
 * Trace existe como ruta pero no como tab (se llega desde "Más").
 */
export default function TabsLayout() {
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
