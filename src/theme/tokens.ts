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
  fg3: '#8B93A3',
  nav: '#FFFFFF',
  line: 'rgba(22,34,58,0.10)',
  navLine: 'rgba(22,34,58,0.08)',
  tile: '#E7E9EF',
  primary: '#E85D16', // acción principal (más profundo en claro → mejor contraste sobre crema)
  primaryPressed: '#C64F12',
  onPrimary: '#FFFFFF',
  bgGrad: ['#EAE8E1', '#F5F1EA'],
  hero: ['#E7E9EC', '#F4EFEA', '#FBE0CE'],
};

export const dark: typeof light = {
  bg: '#0A0D0F', // negro neutro (se mantiene; NO el navy #0E1626 de la paleta)
  surface: '#182338',
  surface2: '#202C44',
  fg: '#F4F1EA',
  fg2: '#AEB6C4',
  fg3: '#727C8E',
  nav: '#0C1013',
  line: 'rgba(244,241,234,0.10)',
  navLine: 'rgba(244,241,234,0.08)',
  tile: '#212E48',
  primary: '#F26A21',
  primaryPressed: '#D85C17',
  onPrimary: '#0E1626',
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

/** Acentos por módulo (navy-family, sutiles). La ACCIÓN sigue siendo naranja en todos. */
export const moduleAccents = {
  field: { light: { accent: '#1B2A44', soft: '#E7E9EF' }, dark: { accent: '#7E8BA6', soft: '#212E48' } },
  assets: { light: { accent: '#2E4A6B', soft: '#E4E9F0' }, dark: { accent: '#8AA0BE', soft: '#1E2C44' } },
  stock: { light: { accent: '#7A2E3A', soft: '#F0E4E4' }, dark: { accent: '#C57883', soft: '#2C1B22' } },
  trace: { light: { accent: '#3F5140', soft: '#E6EAE3' }, dark: { accent: '#8FA588', soft: '#1E2A22' } },
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
