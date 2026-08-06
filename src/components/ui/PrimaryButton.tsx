import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

type Variant = 'orange' | 'navy' | 'outline';

/**
 * Botón primario. Paleta: **navy = app industrial / confirmaciones**, naranja = acento
 * (Zaire Technologies). `outline` = acción secundaria/temporal (ej. geocerca manual del MVP).
 *
 * IMPORTANTE: el `style` es un ÚNICO objeto plano (sin array ni StyleSheet.create): con
 * NativeWind, el array + StyleSheet dropeaba los estilos inline (el fondo no se pintaba).
 */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  iconRight,
  variant = 'orange',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconRight?: IconName;
  variant?: Variant;
}) {
  const c = useThemeColors();
  const off = disabled || loading;
  const outline = variant === 'outline';
  const solidBg = variant === 'navy' ? brand.navy : brand.orange;
  const offBg = variant === 'navy' ? '#5C6B86' : '#F2A279';
  const fg = outline ? c.fg : '#fff';
  const shadowColor = variant === 'navy' ? '#0E1522' : '#F26A21';

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: outline ? 'transparent' : off ? offBg : solidBg,
        borderWidth: outline ? 1.5 : 0,
        borderColor: outline ? c.fg : 'transparent',
        opacity: off && !loading ? 0.6 : 1,
        transform: [{ translateY: pressed && !off ? 1 : 0 }],
        ...(outline
          ? {}
          : { shadowColor, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 3 }),
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontFamily: fonts.interB, fontSize: 14.5, letterSpacing: 0.9, textTransform: 'uppercase', color: fg }}>
            {label}
          </Text>
          {iconRight ? <Icon name={iconRight} size={19} color={fg} strokeWidth={2.4} /> : null}
        </View>
      )}
    </Pressable>
  );
}
