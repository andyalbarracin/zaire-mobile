import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

type Variant = 'orange' | 'navy' | 'outline';

/**
 * Botón primario. Paleta: **navy = app industrial / confirmaciones**, naranja = acento
 * (Zaire Technologies). `outline` = acción secundaria/temporal (ej. geocerca manual del MVP).
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
      style={({ pressed }) => [
        styles.btn,
        outline
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.fg, opacity: off ? 0.5 : 1 }
          : { backgroundColor: off ? offBg : solidBg, shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 4 },
        { transform: [{ translateY: pressed && !off ? 1 : 0 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
          {iconRight ? <Icon name={iconRight} size={19} color={fg} strokeWidth={2.4} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontFamily: fonts.interB, fontSize: 14.5, letterSpacing: 0.9, textTransform: 'uppercase' },
});
