/**
 * Fuente de verdad de los tokens de diseño de Zaire Mobile.
 * Sistema NAVY-FORWARD (v2): navy = marca/estructura (90% del trabajo visual);
 * el naranja es SOLO acción principal + foco + progreso (≤10% de la superficie).
 * Basado en el design system corregido (ClaudeChat, 2026-08). El dark `bg` se mantiene
 * en el negro neutro actual (#0A0D0F) por decisión de producto (no el navy #0E1626).
 * Para revertir: `git revert` del commit de esta paleta.
 */

export const light = {
  bg: '#F5F1EA',
  surface: '#FFFFFF',
  surface2: '#EFEAE0',
  fg: '#16223A',
  fg2: '#5A6474',
  fg3: '#666E80', // antes #8B93A3 (2.74:1 sobre bg, no llegaba al mínimo AA de 4.5:1 para texto)
  nav: '#FFFFFF',
  line: 'rgba(22,34,58,0.10)',
  navLine: 'rgba(22,34,58,0.08)',
  tile: '#E7E9EF',
  primary: '#E85D16', // acción principal (más profundo en claro → mejor contraste sobre crema)
  primaryPressed: '#C64F12',
  onPrimary: '#FFFFFF',
  warn: '#956318', // texto "pendiente" (antes #B87A1E fijo, 3.19:1 en claro)
  danger: '#C43333', // texto "fallido" / peligro
  bgGrad: ['#EAE8E1', '#F5F1EA'],
  hero: ['#E7E9EC', '#F4EFEA', '#FBE0CE'],
};

export const dark: typeof light = {
  bg: '#0A0D0F', // negro neutro (se mantiene)
  surface: '#17191E', // negro/gris premium (NO navy — quedaba "apagado")
  surface2: '#22252B',
  fg: '#F4F1EA',
  fg2: '#AEB6C4',
  fg3: '#8892A0',
  nav: '#0C0E11',
  line: 'rgba(244,241,234,0.10)',
  navLine: 'rgba(244,241,234,0.08)',
  tile: '#24272E',
  primary: '#F26A21',
  primaryPressed: '#D85C17',
  onPrimary: '#0E1626',
  warn: '#B87A1E', // en oscuro este tono ya pasa AA cómodo (5.4:1) — no hace falta cambiarlo
  danger: '#D45B5B', // más claro que en light: #C43333 baja de 4.5:1 sobre fondos oscuros
  bgGrad: ['#070809', '#0F1317'],
  hero: ['#1B2024', '#191D20', '#2C1C11'],
};

/** Marca / acento. `orange` = foco/acento/anillo (#F26A21 en ambos modos). */
export const brand = {
  orange: '#F26A21',
  orangeHi: '#F5843F',
  navy: '#1B2A44',
  cream: '#E7E1D5',
  white: '#FFFFFF',
};

/**
 * Degradés "hero" por módulo — MISMO formato que `hero` (arriba): arranca del mismo gris neutro
 * y termina con un shift de color real hacia el final (igual de perceptible que el shift de
 * `hero` de gris→peach), solo que rotado por módulo. Field sigue usando `hero` (naranja, sin
 * cambios). Trace = navy, Assets = gris/negro premium, Stock = verde premium.
 */
export const moduleHero = {
  trace: {
    light: ['#E7E9EC', '#E3E8F2', '#C7D7F0'],
    dark: ['#1B2024', '#181D26', '#101B38'],
  },
  assets: {
    light: ['#E7E9EC', '#DADCDF', '#BFC1C5'],
    dark: ['#1B2024', '#212327', '#34363B'],
  },
  stock: {
    light: ['#E7E9EC', '#E1EDE4', '#BEE1C7'],
    dark: ['#1B2024', '#182119', '#0E2A18'],
  },
} as const;

/**
 * Color "de marca" sólido por módulo — para íconos/anillos/acentos que deben leerse como ESE
 * módulo (mini-branding), no como un semáforo de estado/salud. Field usa el naranja de siempre.
 */
export const moduleBrand = {
  field: { light: '#F26A21', dark: '#F26A21' },
  trace: { light: '#2A4D8C', dark: '#6E96D6' },
  assets: { light: '#4B4F56', dark: '#B7BABF' },
  stock: { light: '#1F6B45', dark: '#57A576' },
} as const;

/** Estados (color + etiqueta) — semáforo desaturado (dignidad industrial). */
export const status = {
  planificada: { color: '#8B93A3', label: 'Planificada' },
  encurso: { color: '#F26A21', label: 'En curso' },
  ensitio: { color: '#2F7D51', label: 'En sitio' },
  finalizada: { color: '#16223A', label: 'Finalizada' },
  cancelada: { color: '#8B93A3', label: 'Cancelada' },
  operativo: { color: '#2F7D51', label: 'Operativo' },
  atencion: { color: '#B4832E', label: 'Atención' },
  critico: { color: '#B23B36', label: 'Crítico' },
  none: { color: '#8B93A3', label: '' },
} as const;

export type StatusKey = keyof typeof status;

/** Color de estado ajustado por tema: algunos oscuros (finalizada = navy) no se ven en dark. */
export function statusColorFor(key: StatusKey, isDark: boolean): string {
  if (isDark && key === 'finalizada') return '#8AA0BE';
  return status[key].color;
}

/** Nombres de familia exactos que exportan @expo-google-fonts/{raleway,inter}. */
export const fonts = {
  raleway: 'Raleway_500Medium',
  ralewaySb: 'Raleway_600SemiBold',
  ralewayB: 'Raleway_700Bold',
  ralewayXb: 'Raleway_800ExtraBold',
  inter: 'Inter_400Regular',
  interM: 'Inter_500Medium',
  interSb: 'Inter_600SemiBold',
  interB: 'Inter_700Bold',
};

export const radii = { tile: 13, input: 14, card: 18, hero: 20, btn: 16 };

export type ThemeColors = typeof light;
