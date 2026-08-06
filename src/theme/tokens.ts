/**
 * Fuente de verdad de los tokens de diseño de Zaire Mobile.
 * Valores tomados del prototipo aprobado (ZaireMobile.dc.html → themeVars / FolderCard.dc.html).
 * Los colores semánticos también viven en `global.css` + `tailwind.config.js` para las clases
 * NativeWind; acá se exponen para usos programáticos (SVG de FolderCard, anillo de progreso, etc.).
 */

export const light = {
  bg: '#F6F4F1',
  surface: '#FFFFFF',
  surface2: '#ECEAE4',
  fg: '#1B2A44',
  fg2: '#5A6474',
  fg3: '#9AA1AD',
  nav: '#FFFFFF',
  line: 'rgba(27,42,68,0.09)',
  navLine: 'rgba(27,42,68,0.08)',
  tile: 'rgba(226,204,156,0.5)',
  bgGrad: ['#EAE8E1', '#F6F4F1'],
  hero: ['#E7E9EC', '#F4EFEA', '#FBE0CE'],
};

export const dark: typeof light = {
  bg: '#0A0D0F',
  surface: '#161A1D',
  surface2: '#20262A',
  fg: '#F6F4F1',
  fg2: '#AEB4BC',
  fg3: '#7C838B',
  nav: '#0C1013',
  line: 'rgba(246,244,241,0.10)',
  navLine: 'rgba(246,244,241,0.08)',
  tile: 'rgba(226,204,156,0.16)',
  bgGrad: ['#070809', '#0F1317'],
  hero: ['#1B2024', '#191D20', '#2C1C11'],
};

/** Marca / acento — independiente del esquema claro/oscuro. */
export const brand = {
  orange: '#F26A21',
  orangeHi: '#F5843F',
  navy: '#1B2A44',
  cream: '#E7E1D5',
  white: '#FFFFFF',
};

/** Estados (color + etiqueta) — idéntico al `renderVals()` del prototipo. */
export const status = {
  planificada: { color: '#8B93A3', label: 'Planificada' },
  encurso: { color: '#F26A21', label: 'En curso' },
  ensitio: { color: '#3EBE6A', label: 'En sitio' },
  finalizada: { color: '#1B2A44', label: 'Finalizada' },
  operativo: { color: '#3EBE6A', label: 'Operativo' },
  atencion: { color: '#E0A03A', label: 'Atención' },
  critico: { color: '#E03A3A', label: 'Crítico' },
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
