import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

type Variant = 'orange' | 'outline';

/**
 * Botón primario del design system: **primario = naranja sólido** (visibilidad en el campo),
 * `outline` = secundario (contorno navy).
 *
 * La caja se dibuja en un `View` interno con estilo ESTÁTICO; el `Pressable` solo captura el
 * toque. Con NativeWind, un `style` como FUNCIÓN en Pressable se dropea (el fondo no se pintaba).
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
  const [pressed, setPressed] = useState(false);
  const off = disabled || loading;
  const outline = variant === 'outline';
  const bg = outline ? 'transparent' : off ? '#F2A279' : brand.orange;
  const fg = outline ? c.fg : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View
        style={{
          height: 56,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
          borderWidth: outline ? 1.5 : 0,
          borderColor: outline ? c.fg : 'transparent',
          opacity: off && !loading ? 0.55 : 1,
          transform: [{ translateY: pressed && !off ? 1 : 0 }],
          shadowColor: '#F26A21',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: outline ? 0 : 0.3,
          shadowRadius: 10,
          elevation: outline ? 0 : 3,
        }}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontFamily: fonts.interB, fontSize: 15, letterSpacing: 0.9, textTransform: 'uppercase', color: fg }}>
              {label}
            </Text>
            {iconRight ? <Icon name={iconRight} size={20} color={fg} strokeWidth={2.4} /> : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}
