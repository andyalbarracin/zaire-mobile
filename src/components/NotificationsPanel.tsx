import { router, type Href } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { MOCK_NOTIFICATIONS, NOTIF_META } from '@/lib/notifications/mock';
import { tint } from '@/theme/color';
import { brand, fonts, moduleBrand } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Preview de notificaciones (campana del header). Datos de MUESTRA (ver lib/notifications/mock) —
 * demo-able hoy, listo para enchufar un feed real más adelante sin tocar esta UI.
 */
export function NotificationsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const preview = MOCK_NOTIFICATIONS.slice(0, 4);

  function go(route: Href) {
    onClose();
    router.navigate(route);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(8,11,18,0.35)' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: insets.top + 58,
            right: 20,
            left: 20,
            backgroundColor: c.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: c.line,
            overflow: 'hidden',
            shadowColor: '#0E1626',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 15, paddingBottom: 11, borderBottomWidth: 1, borderBottomColor: c.line }}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg }}>Notificaciones</Text>
          </View>
          {preview.map((n, i) => (
            <NotifRow key={n.id} title={n.title} subtitle={n.subtitle} time={n.time} icon={NOTIF_META[n.kind].icon} accent={NOTIF_META[n.kind].accent} last={i === preview.length - 1} onPress={() => go(n.route)} />
          ))}
          <Pressable onPress={() => go('/notificaciones')} style={{ paddingVertical: 13, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: brand.orange }}>Ver todas</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function NotifRow({
  title,
  subtitle,
  time,
  icon,
  accent,
  last,
  onPress,
}: {
  title: string;
  subtitle: string;
  time: string;
  icon: Parameters<typeof Icon>[0]['name'];
  accent: keyof typeof moduleBrand;
  last?: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const color = moduleBrand[accent][colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line, alignItems: 'center' }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tint(color, colorScheme === 'dark' ? 0.2 : 0.14), alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={color} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: c.fg }}>{title}</Text>
        <Text numberOfLines={1} style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg2, marginTop: 1 }}>{subtitle}</Text>
      </View>
      <Text style={{ fontFamily: fonts.interM, fontSize: 10.5, color: c.fg3 }}>{time}</Text>
    </Pressable>
  );
}
