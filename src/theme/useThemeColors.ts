import { useColorScheme } from 'nativewind';

import { dark, light, type ThemeColors } from './tokens';

/**
 * Devuelve los colores del tema activo (claro/oscuro) para usos programáticos
 * que NativeWind no cubre bien: fills/strokes de SVG, gradientes, sombras.
 * Para estilos de Views/Text usar clases NativeWind (`bg-surface`, `text-fg`, …).
 */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? dark : light;
}
