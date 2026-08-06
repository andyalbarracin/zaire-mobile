import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { Icon } from '@/components/icons/Icon';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Mapa real de la visita: marcador del sitio + círculo de geocerca + tu ubicación.
 * En iOS/Expo Go usa Apple Maps (sin API key). Vista de preview (no interactiva).
 */
export function VisitMap({
  latitude,
  longitude,
  radiusM,
}: {
  latitude: number;
  longitude: number;
  radiusM?: number | null;
}) {
  const c = useThemeColors();
  const radius = radiusM ?? 150;
  const delta = Math.max(0.006, (radius * 8) / 111320);

  return (
    <View style={{ height: 190, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: c.line }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude, longitude, latitudeDelta: delta, longitudeDelta: delta }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Circle
          center={{ latitude, longitude }}
          radius={radius}
          strokeColor={brand.orange}
          strokeWidth={2}
          fillColor="rgba(242,106,33,0.12)"
        />
        <Marker coordinate={{ latitude, longitude }} pinColor={brand.orange} />
      </MapView>

      <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: c.surface }}>
        <Icon name="pin" size={13} color={brand.orange} strokeWidth={2.2} />
        <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: c.fg }}>Área de trabajo · {radius} m</Text>
      </View>
    </View>
  );
}
