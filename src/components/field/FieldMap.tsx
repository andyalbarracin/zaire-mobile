import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useThemeColors } from '@/theme/useThemeColors';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  color?: string;
}

/** Mapa del listado de Field: un pin por visita (con coords) + tu ubicación. Interactivo. */
export function FieldMap({ points }: { points: MapPoint[] }) {
  const c = useThemeColors();
  if (points.length === 0) return null;

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.08, (maxLat - minLat) * 1.7),
    longitudeDelta: Math.max(0.08, (maxLng - minLng) * 1.7),
  };

  return (
    <View style={{ height: 180, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: c.line, marginBottom: 16 }}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation showsMyLocationButton={false}>
        {points.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor={p.color ?? '#F26A21'} />
        ))}
      </MapView>
    </View>
  );
}
