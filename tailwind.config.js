/**
 * Tokens de diseño Zaire Mobile (espejo de `src/theme/tokens.ts`).
 * Colores semánticos (bg/surface/fg…) salen de variables CSS en `src/global.css`
 * y remapean solo/oscuro. Marca y estados son independientes del tema.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // semánticos (remapean light/dark vía global.css)
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        fg2: 'rgb(var(--color-fg2) / <alpha-value>)',
        fg3: 'rgb(var(--color-fg3) / <alpha-value>)',
        nav: 'rgb(var(--color-nav) / <alpha-value>)',
        // tokens con alpha fija
        line: 'var(--line)',
        navline: 'var(--nav-line)',
        tile: 'var(--tile)',
        // marca / acento
        orange: '#F26A21',
        'orange-hi': '#F5843F',
        navy: '#1B2A44',
        'navy-900': '#0E1522',
        cream: '#E7E1D5',
        // estados (del prototipo)
        planificada: '#8B93A3',
        encurso: '#F26A21',
        ensitio: '#3EBE6A',
        finalizada: '#1B2A44',
        atencion: '#E0A03A',
        critico: '#E03A3A',
        success: '#3EBE6A',
        warning: '#E0A03A',
        error: '#E03A3A',
        danger: '#C43333',
      },
      fontFamily: {
        // Raleway (display / títulos / números grandes)
        raleway: ['Raleway_500Medium'],
        'raleway-sb': ['Raleway_600SemiBold'],
        'raleway-b': ['Raleway_700Bold'],
        'raleway-xb': ['Raleway_800ExtraBold'],
        // Inter (UI / cuerpo)
        inter: ['Inter_400Regular'],
        'inter-m': ['Inter_500Medium'],
        'inter-sb': ['Inter_600SemiBold'],
        'inter-b': ['Inter_700Bold'],
      },
      borderRadius: {
        tile: '13px',
        input: '14px',
        card: '18px',
        hero: '20px',
        btn: '16px',
      },
    },
  },
  plugins: [],
};
