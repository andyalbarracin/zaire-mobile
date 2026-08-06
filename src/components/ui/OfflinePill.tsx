import { Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useConnectivity } from '@/lib/connectivity';
import { useSync } from '@/lib/sync/SyncProvider';
import { fonts } from '@/theme/tokens';

/** Estado de conexión / sincronización: offline, sincronizando o cambios pendientes. */
export function OfflinePill() {
  const { isOnline } = useConnectivity();
  const { pending, syncing } = useSync();

  let text: string | null = null;
  if (syncing) text = 'SINCRONIZANDO…';
  else if (!isOnline) text = pending > 0 ? `SIN CONEXIÓN · ${pending}` : 'SIN CONEXIÓN';
  else if (pending > 0) text = `${pending} PENDIENTE${pending > 1 ? 'S' : ''}`;
  if (!text) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(224,160,58,0.15)' }}>
      {!isOnline ? <Icon name="wifiOff" size={13} color="#B87A1E" strokeWidth={2.2} /> : null}
      <Text style={{ fontFamily: fonts.interB, fontSize: 11, color: '#B87A1E', letterSpacing: 0.3 }}>{text}</Text>
    </View>
  );
}
