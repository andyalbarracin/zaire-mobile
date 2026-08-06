import { useColorScheme } from 'nativewind';
import { Text, View } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { Icon } from '@/components/icons/Icon';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Mapa "dummy" estilizado (grilla + calles + geocerca + marcador), recreado del prototipo.
 * No usa react-native-maps ni permisos: el mapa real interactivo llega en la Slice 3 (geocerca).
 */
export function DummyMap({ radiusM }: { radiusM?: number | null }) {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const mapBg = dark ? '#12161A' : '#E7E1D4';
  const road = dark ? 'rgba(246,244,241,0.06)' : 'rgba(27,42,68,0.09)';
  const road2 = dark ? 'rgba(246,244,241,0.045)' : 'rgba(27,42,68,0.06)';

  return (
    <View style={{ height: 190, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: c.line, backgroundColor: mapBg }}>
      {/* Grilla */}
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse">
            <Path d="M 46 0 L 0 0 0 46" fill="none" stroke={road} strokeWidth="2" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>

      {/* Calles diagonales */}
      <View style={{ position: 'absolute', top: -10, left: 64, width: 9, height: 220, backgroundColor: road2, transform: [{ rotate: '14deg' }] }} />
      <View style={{ position: 'absolute', top: 52, left: -20, width: 260, height: 11, backgroundColor: road2, transform: [{ rotate: '-7deg' }] }} />

      {/* Geocerca + marcador (centrado) */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: brand.orange, backgroundColor: 'rgba(242,106,33,0.10)' }} />
        <View style={{ position: 'absolute', width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: 'rgba(242,106,33,0.45)' }} />
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#2E6BE6', borderWidth: 3, borderColor: '#fff' }} />
      </View>

      {/* Chip de área de trabajo */}
      <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: c.surface }}>
        <Icon name="pin" size={13} color={brand.orange} strokeWidth={2.2} />
        <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: c.fg }}>
          Área de trabajo · {radiusM ?? 150} m
        </Text>
      </View>
    </View>
  );
}
