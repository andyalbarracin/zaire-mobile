import { Tabs } from 'expo-router';

import { SwipeNav } from '@/components/SwipeNav';
import { ZaireTabBar } from '@/components/ZaireTabBar';

/**
 * Tabs de la app. La barra custom decide qué mostrar (gateo por enabled_modules).
 * `SwipeNav` agrega cambio de pantalla por swipe (experimento reversible, ver su comentario).
 */
export default function TabsLayout() {
  return (
    <SwipeNav>
      <Tabs tabBar={(props) => <ZaireTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="field" />
        <Tabs.Screen name="assets" />
        <Tabs.Screen name="stock" />
        <Tabs.Screen name="trace" />
        <Tabs.Screen name="more" />
      </Tabs>
    </SwipeNav>
  );
}
