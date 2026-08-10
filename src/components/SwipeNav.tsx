import { router, usePathname, type Href } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { type ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/icons/Icon';
import { getVisibleTabPaths } from '@/lib/modules';
import { moduleBrand } from '@/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;
const THRESHOLD_DIST = SCREEN_W * 0.28;
const THRESHOLD_VELOCITY = 750;
const ORDER = getVisibleTabPaths(); // enabled_modules es estático en runtime, se calcula una vez

const PATH_META: Record<string, { icon: IconName; accent: keyof typeof moduleBrand | null }> = {
  '/': { icon: 'home', accent: null },
  '/field': { icon: 'layers', accent: 'field' },
  '/assets': { icon: 'box', accent: 'assets' },
  '/stock': { icon: 'grid', accent: 'stock' },
  '/trace': { icon: 'route', accent: 'trace' },
  '/more': { icon: 'menu', accent: null },
};

/**
 * Swipe horizontal "de verdad" entre pantallas del navbar (no solo detectar el gesto y saltar):
 * la pantalla actual se arrastra 1:1 con el dedo (Reanimated, hilo de UI) dejando ver un fondo
 * con el color/ícono del módulo de destino — si soltás antes del umbral, vuelve con resorte
 * (cancelable en cualquier punto del gesto); si lo cruzás, termina de deslizar y ahí recién se
 * llama `router.navigate()` — la navegación real sigue siendo 100% de Expo Router (no se toca
 * `<Tabs>`), así que deep-links, `router.navigate('/stock')` desde "Más", etc. siguen intactos.
 *
 * Experimento — ver roadmap M6. **Reversible**: sacar este wrapper de `(tabs)/_layout.tsx`.
 */
export function SwipeNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const idx = ORDER.indexOf(pathname);

  const translateX = useSharedValue(0);
  const previewPath = useSharedValue<string | null>(null);

  function commitNavigate(path: string) {
    router.navigate(path as Href);
    translateX.value = 0;
    previewPath.value = null;
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      if (idx === -1) return;
      const dir = e.translationX < 0 ? 1 : -1;
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= ORDER.length) {
        // en la punta de la cadena: se puede arrastrar un poco igual, pero con resistencia (rubber-band)
        translateX.value = e.translationX * 0.25;
        return;
      }
      translateX.value = e.translationX;
      previewPath.value = ORDER[targetIdx];
    })
    .onEnd((e) => {
      const dir = e.translationX < 0 ? 1 : -1;
      const targetIdx = idx + dir;
      const crossed = Math.abs(e.translationX) > THRESHOLD_DIST || Math.abs(e.velocityX) > THRESHOLD_VELOCITY;
      if (idx !== -1 && crossed && targetIdx >= 0 && targetIdx < ORDER.length) {
        const target = ORDER[targetIdx];
        translateX.value = withTiming(dir === 1 ? -SCREEN_W : SCREEN_W, { duration: 200 }, (finished) => {
          if (finished) runOnJS(commitNavigate)(target);
        });
      } else {
        translateX.value = withTiming(0, { duration: 220 });
        previewPath.value = null;
      }
    });

  const foregroundStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.abs(translateX.value) / 80) }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <SwipeBackdrop previewPath={previewPath} isDark={isDark} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ flex: 1 }, foregroundStyle]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

/**
 * Fondo que se "revela" detrás de la pantalla mientras se arrastra: color + ícono grande del
 * módulo de destino (no el contenido real — mostrar la pantalla de verdad requeriría montar dos
 * rutas en simultáneo, que es lo que justamente NO se quiso hacer para no arriesgar el routing).
 *
 * Los 6 íconos posibles se apilan absolutos y cada uno resuelve su propia opacidad con
 * `useAnimatedStyle` (reactivo de verdad, en el hilo de UI) — leer `sharedValue.value` suelto
 * dentro del cuerpo de un componente NO es reactivo, por eso no alcanza con un solo ícono "activo".
 */
function SwipeBackdrop({ previewPath, isDark }: { previewPath: SharedValue<string | null>; isDark: boolean }) {
  const bgStyle = useAnimatedStyle(() => {
    const meta = previewPath.value ? PATH_META[previewPath.value] : null;
    const bg = meta?.accent ? moduleBrand[meta.accent][isDark ? 'dark' : 'light'] : isDark ? '#22252B' : '#EFEAE0';
    return { backgroundColor: bg };
  });

  return (
    <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, bgStyle]}>
      {ORDER.map((path) => (
        <PreviewIconLayer key={path} path={path} previewPath={previewPath} />
      ))}
    </Animated.View>
  );
}

function PreviewIconLayer({ path, previewPath }: { path: string; previewPath: SharedValue<string | null> }) {
  const meta = PATH_META[path];
  const style = useAnimatedStyle(() => ({ opacity: previewPath.value === path ? 1 : 0 }));
  if (!meta) return null;
  return (
    <Animated.View style={[{ position: 'absolute' }, style]}>
      <Icon name={meta.icon} size={72} color="rgba(255,255,255,0.34)" strokeWidth={1.5} />
    </Animated.View>
  );
}
