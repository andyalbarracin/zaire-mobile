import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useConnectivity } from '@/lib/connectivity';
import { useSync } from '@/lib/sync/SyncProvider';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/** Estado de conexión / sync. Clickeable → Ajustes (Más), donde se togglea el modo offline. */
export function OfflinePill() {
  const c = useThemeColors();
  const { isOnline } = useConnectivity();
  const { pending, syncing } = useSync();

  let text: string | null = null;
  if (syncing) text = 'SINCRONIZANDO…';
  else if (!isOnline) text = pending > 0 ? `SIN CONEXIÓN · ${pending}` : 'SIN CONEXIÓN';
  else if (pending > 0) text = `${pending} PENDIENTE${pending > 1 ? 'S' : ''}`;
  if (!text) return null;

  return (
    <Pressable
      onPress={() => router.navigate('/more')}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(224,160,58,0.15)', opacity: pressed ? 0.7 : 1 })}
    >
      {!isOnline ? <Icon name="wifiOff" size={13} color={c.warn} strokeWidth={2.2} /> : null}
      <Text style={{ fontFamily: fonts.interB, fontSize: 11, color: c.warn, letterSpacing: 0.3 }}>{text}</Text>
    </Pressable>
  );
}
