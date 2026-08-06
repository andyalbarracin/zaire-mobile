import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { brand, fonts } from '@/theme/tokens';

/** Botón primario: full-width, 56px, naranja, texto mayúsculas, sombra. Estilo Duolingo. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  iconRight,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconRight?: IconName;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: off ? '#F2A279' : brand.orange, transform: [{ translateY: pressed && !off ? 1 : 0 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          {iconRight ? <Icon name={iconRight} size={19} color="#fff" strokeWidth={2.4} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F26A21',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: {
    color: '#fff',
    fontFamily: fonts.interB,
    fontSize: 14.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
