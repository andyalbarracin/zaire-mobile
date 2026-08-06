import { Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { useConnectivity } from '@/lib/connectivity';
import { fonts } from '@/theme/tokens';

/** Píldora persistente de "sin conexión" (ámbar, calma) — se muestra solo cuando estás offline. */
export function OfflinePill() {
  const { isOnline } = useConnectivity();
  if (isOnline) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: 'rgba(224,160,58,0.15)' }}>
      <Icon name="wifiOff" size={13} color="#B87A1E" strokeWidth={2.2} />
      <Text style={{ fontFamily: fonts.interB, fontSize: 11, color: '#B87A1E', letterSpacing: 0.3 }}>SIN CONEXIÓN</Text>
    </View>
  );
}
