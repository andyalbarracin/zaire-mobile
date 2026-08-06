import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useThemeColors } from '@/theme/useThemeColors';

/** Botón cuadrado de header (menu, campana, back). Caja en View estático; toque ampliado (guantes). */
export function HeaderIconButton({
  icon,
  onPress,
  size = 46,
  iconSize = 22,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
}) {
  const c = useThemeColors();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable onPress={onPress} hitSlop={10} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: c.line,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        }}
      >
        <Icon name={icon} size={iconSize} color={c.fg} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}
