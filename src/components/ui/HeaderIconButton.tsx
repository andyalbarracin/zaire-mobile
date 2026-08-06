import { Pressable } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { useThemeColors } from '@/theme/useThemeColors';

/** Botón cuadrado de header (menu, campana, back), 42px, borde fino + superficie. */
export function HeaderIconButton({
  icon,
  onPress,
  size = 42,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.line,
        backgroundColor: c.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Icon name={icon} size={20} color={c.fg} strokeWidth={2.2} />
    </Pressable>
  );
}
