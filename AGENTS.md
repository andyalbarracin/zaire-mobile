# AGENTS — Zaire Mobile

App móvil Expo/React Native, companion de la webapp `zaire-industrial`. Consume el mismo backend
Supabase (la app es otro cliente del backend, no re-desarrolla nada del server).

## 🔒 Regla sagrada (no negociable)
- Escribí **solo** dentro de `code/zaire-mobile`.
- **Nunca** edites/borres `code/zaire-industrial` (la webapp) ni `code/.docs`. Solo lectura como referencia.
- Podés **editar** los docs de `code/.docs-mobile` (log, roadmap) — ahí se registran los avances.
- Solo la **anon key** de Supabase va en la app (por `.env`). **Jamás** la `service_role`. Desarrollo contra **DEV**.

## Antes de tocar código
- La brújula es `../.docs-mobile/base-docs-project/roadmap-mobile.md` (M0→M5). No te adelantes de etapa.
- Diseño: recrear del prototipo `../.docs-mobile/prototipo/project/` (fuente visual), no copiar el HTML.
- Auth/tenant/offline: `../.docs-mobile/architecture-and-techniques/`.
- Expo SDK 57 — leé los docs versionados en https://docs.expo.dev/versions/v57.0.0/ ante dudas.

## Convenciones
- **Estructura**: `src/app` (rutas Expo Router), `src/components`, `src/lib`, `src/config`, `src/theme`.
  Imports con alias `@/*` → `src/*`.
- **Estilos**: NativeWind (clases `bg-surface`, `text-fg`, …) apoyadas en variables CSS de `src/global.css`
  (remapean claro/oscuro). La **fuente de verdad** de tokens es `src/theme/tokens.ts`; para SVG/colores
  programáticos usar `useThemeColors()`.
- **Tipografía**: Raleway (títulos/números) + Inter (UI). Números con `fontVariant:['tabular-nums']`.
- **Componente firma**: `FolderCard` (chaflán 45° vía SVG). Toda la fila es táctil.
- **No dividir del backend**: reutilizar tabla `profiles` (rol `role`) y los keys de módulos
  `trace|field|crm|stock|assets` (ver `src/lib/modules.ts`, espejo de la web).
- **git**: mensajes claros, **sin mención a herramientas/IA**; push solo si el usuario lo autoriza.

## Estado actual
M0 (cimientos) hecho: login OTP passwordless, tenant fijo `dev`, bootstrap rol+módulos, tabs gateadas
con placeholders, Login + Home recreados. Deuda M1+: biometría, SQLite offline, features de módulos.
