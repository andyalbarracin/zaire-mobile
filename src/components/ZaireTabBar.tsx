import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { getEnabledMobileModules, type ModuleId } from '@/lib/modules';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Barra inferior de Zaire Mobile (recreada del prototipo): Jornada · Field · Assets ·
 * Stock · Más, con un FAB de cámara central. Las tabs de módulo (field/assets/stock)
 * se muestran solo si están habilitadas (enabled_modules ∩ móvil). Trace no es tab.
 *
 * Tipamos las props del tab bar localmente (subset estructural de las de expo-router)
 * para no depender de @react-navigation/bottom-tabs.
 */
interface TabRoute {
  key: string;
  name: string;
}
interface ZaireTabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit(event: { type: 'tabPress'; target: string; canPreventDefault: true }): { defaultPrevented: boolean };
    navigate(name: string): void;
  };
}
interface TabItem {
  route: TabRoute;
  focused: boolean;
  label: string;
  icon: IconName;
}

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Hoy', icon: 'home' },
  field: { label: 'Field', icon: 'layers' },
  assets: { label: 'Assets', icon: 'box' },
  stock: { label: 'Stock', icon: 'grid' },
  more: { label: 'Más', icon: 'menu' },
};

const ORDER = ['index', 'field', 'assets', 'stock', 'more'];

export function ZaireTabBar({ state, navigation }: ZaireTabBarProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const enabled = getEnabledMobileModules();

  const routesByName = new Map(state.routes.map((r) => [r.name, r]));
  const activeKey = state.routes[state.index]?.key;

  const items: TabItem[] = ORDER.filter((n) => n === 'index' || n === 'more' || enabled.includes(n as ModuleId))
    .map((n) => routesByName.get(n))
    .filter((r): r is TabRoute => Boolean(r))
    .map((route) => ({ route, focused: route.key === activeKey, ...TAB_META[route.name] }));

  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);

  const go = (route: TabRoute) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(route.name);
  };

  const renderBtn = (it: TabItem) => (
    <Pressable key={it.route.key} onPress={() => go(it.route)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Icon name={it.icon} size={26} color={it.focused ? brand.orange : c.fg3} strokeWidth={it.focused ? 2.3 : 2} />
      <Text style={{ fontFamily: fonts.interSb, fontSize: 10, letterSpacing: 0.2, color: it.focused ? brand.orange : c.fg3 }}>
        {it.label}
      </Text>
    </Pressable>
  );

  return (
    <View
      style={{
        paddingTop: 8,
        paddingBottom: insets.bottom + 12,
        paddingHorizontal: 8,
        backgroundColor: c.nav,
        borderTopWidth: 1,
        borderTopColor: c.navLine,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {left.map(renderBtn)}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Pressable
          onPress={() => Alert.alert('Cámara', 'Disponible próximamente.')}
          style={{
            width: 58,
            height: 58,
            marginTop: -26,
            borderRadius: 29,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: brand.navy,
            borderWidth: 4,
            borderColor: c.nav,
            shadowColor: '#0E1522',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Icon name="camera" size={26} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
      {right.map(renderBtn)}
    </View>
  );
}
