import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotifRow } from '@/components/NotificationsPanel';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { MOCK_NOTIFICATIONS, NOTIF_META } from '@/lib/notifications/mock';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

export default function Notificaciones() {
  const c = useThemeColors();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Notificaciones</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
          {MOCK_NOTIFICATIONS.map((n, i) => (
            <NotifRow
              key={n.id}
              title={n.title}
              subtitle={n.subtitle}
              time={n.time}
              icon={NOTIF_META[n.kind].icon}
              accent={NOTIF_META[n.kind].accent}
              last={i === MOCK_NOTIFICATIONS.length - 1}
              onPress={() => router.navigate(n.route)}
            />
          ))}
        </View>
        <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3, textAlign: 'center', marginTop: 16 }}>
          Vista de demostración — todavía no conectada a datos reales.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
