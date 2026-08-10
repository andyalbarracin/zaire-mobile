import { router, usePathname, type Href } from 'expo-router';
import { useRef, type ReactNode } from 'react';
import { PanResponder, View } from 'react-native';

import { getVisibleTabPaths } from '@/lib/modules';

/**
 * Swipe horizontal para cambiar entre pantallas del navbar (experimento — ver roadmap M6).
 * Envuelve `<Tabs>` una sola vez; no toca la navegación de React Navigation/Expo Router en sí,
 * solo detecta el gesto y llama `router.navigate()` a la pantalla siguiente/anterior en el mismo
 * orden que ya usa `ZaireTabBar`. **Reversible**: si no anda bien, se saca este wrapper de
 * `(tabs)/_layout.tsx` y todo vuelve a depender solo de tocar los ítems del menú.
 *
 * Umbral alto + exige que el gesto sea claramente más horizontal que vertical, para no pisarle
 * el scroll a las pantallas (mismo criterio ya probado en el archivero de Home, revertido).
 */
export function SwipeNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 70) return;
        const order = getVisibleTabPaths();
        const idx = order.indexOf(pathname);
        if (idx === -1) return;
        if (g.dx < 0 && idx < order.length - 1) router.navigate(order[idx + 1] as Href);
        else if (g.dx > 0 && idx > 0) router.navigate(order[idx - 1] as Href);
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
