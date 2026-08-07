import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, Text as RNText } from 'react-native';

/**
 * Escala de tipografía global (accesibilidad). "grande" multiplica el `fontSize`/`lineHeight`
 * de cada <Text> por 1.15 (~+2pt en cuerpo). Se hace con UN parche del render de Text que:
 *  - lee la escala del contexto (cada Text queda suscripto → re-render al cambiar), y
 *  - es no-op cuando la escala es 1 (por eso "normal" no toca nada y no puede romper el layout).
 * Los TextInput heredan el patrón visual pero no se escalan (evita saltos de caret).
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

// Parche único del render de Text.
type Patchable = { render?: (props: any, ref: any) => any; __zaireOrig?: (props: any, ref: any) => any; __zairePatched?: boolean };
const T = RNText as unknown as Patchable;
if (!T.__zairePatched && typeof T.render === 'function') {
  T.__zaireOrig = T.render;
  T.render = function zaireScaledText(props: any, ref: any) {
    const { scale } = useContext(FontScaleContext);
    const el = T.__zaireOrig!(props, ref);
    if (scale === 1 || !el) return el;
    const flat = StyleSheet.flatten(el.props?.style) as { fontSize?: number; lineHeight?: number } | undefined;
    if (!flat?.fontSize) return el;
    return React.cloneElement(el, {
      style: [el.props.style, { fontSize: flat.fontSize * scale, lineHeight: flat.lineHeight ? flat.lineHeight * scale : undefined }],
    });
  };
  T.__zairePatched = true;
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
