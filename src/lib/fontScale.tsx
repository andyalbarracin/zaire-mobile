import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

/**
 * Escala de tipografía global (accesibilidad). "grande" = ×1.15 (~+2pt en cuerpo).
 *
 * En esta versión de RN, `Text` (TextImpl) no expone `.render`, así que en vez de parchear el
 * render, **redefinimos el getter `Text` del module.exports real** (por eso `require`, no
 * `import *`, que devuelve una copia). Cada `<Text>` pasa a ser este wrapper: consume la escala
 * (re-render al cambiar) y multiplica su `fontSize`/`lineHeight`. Es **no-op cuando la escala es 1**,
 * por eso "normal" no altera nada y no puede romper el layout. Los TextInput no se tocan.
 */

export type FontSize = 'normal' | 'grande';
const MULT: Record<FontSize, number> = { normal: 1, grande: 1.15 };
const KEY = 'zaire_font_size';

interface Ctx {
  size: FontSize;
  scale: number;
  setSize: (s: FontSize) => void;
}
const FontScaleContext = createContext<Ctx>({ size: 'normal', scale: 1, setSize: () => {} });

// @ts-ignore — require nos da el module.exports compartido (mismo objeto que ven los `import { Text }`).
const RN = require('react-native');
const OriginalText = RN.Text;
const ScaledText = React.forwardRef<unknown, { style?: unknown }>(function ScaledText(props, ref) {
  const { scale } = useContext(FontScaleContext);
  if (scale === 1) return <OriginalText ref={ref} {...props} />;
  const flat = StyleSheet.flatten(props.style as never) as { fontSize?: number; lineHeight?: number } | undefined;
  if (!flat?.fontSize) return <OriginalText ref={ref} {...props} />;
  return (
    <OriginalText
      ref={ref}
      {...props}
      style={[props.style, { fontSize: flat.fontSize * scale, lineHeight: flat.lineHeight ? flat.lineHeight * scale : undefined }]}
    />
  );
});
try {
  Object.defineProperty(RN, 'Text', { configurable: true, enumerable: true, get: () => ScaledText });
} catch {
  // Si no se puede redefinir, el toggle queda inerte (sin romper nada).
}

export function FontScaleProvider({ children }: { children: ReactNode }) {
  const [size, setSizeState] = useState<FontSize>('normal');

  useEffect(() => {
    SecureStore.getItemAsync(KEY).then((v) => {
      if (v === 'grande' || v === 'normal') setSizeState(v);
    });
  }, []);

  const setSize = (s: FontSize) => {
    setSizeState(s);
    void SecureStore.setItemAsync(KEY, s);
  };

  return <FontScaleContext.Provider value={{ size, scale: MULT[size], setSize }}>{children}</FontScaleContext.Provider>;
}

export function useFontSize(): Ctx {
  return useContext(FontScaleContext);
}
