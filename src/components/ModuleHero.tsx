import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

import { FolderSurface } from '@/components/FolderSurface';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Card "hero" de estado de módulo: mismo lenguaje visual que el hero de Field en Home
 * (bisel 45° + degradé suave + borde), tonalizado por módulo vía `moduleHero` en tokens.ts.
 * Va al inicio de cada pantalla de módulo (Assets/Stock/Trace); Field conserva el suyo en Home.
 */
export function ModuleHero({
  gradient,
  contentStyle,
  children,
}: {
  gradient: readonly string[];
  contentStyle?: ViewStyle;
  children: ReactNode;
}) {
  const c = useThemeColors();
  return (
    <FolderSurface
      radius={20}
      cut={24}
      gradient={[...gradient]}
      border={c.line}
      style={{ marginBottom: 18 }}
      contentStyle={contentStyle ?? { paddingHorizontal: 19, paddingTop: 18, paddingBottom: 17 }}
    >
      {children}
    </FolderSurface>
  );
}
