# Zaire Mobile

App móvil (iOS/Android) companion de la webapp **Zaire Industrial**. Construida con Expo +
React Native. Consume **el mismo backend Supabase** que la web (la app es otro cliente del backend).

Estado: **M0 — Cimientos** (login passwordless, resolución de tenant, bootstrap de rol+módulos,
navegación modular gateada con placeholders, y Login + Home recreados del prototipo). Sin features
de negocio todavía. La brújula del desarrollo está en `../.docs-mobile/base-docs-project/roadmap-mobile.md`.

## Requisitos
- Node 20+ y npm.
- App **Expo Go** en tu celular (iOS/Android).
- Acceso a un proyecto **Supabase de DESARROLLO** con **email OTP habilitado**
  (Authentication → Providers → Email → *Enable email OTP* / magic link).

## Puesta en marcha
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno — copiá `.env.example` a `.env` y completá con los valores de tu
   Supabase de DEV (los mismos que `zaire-industrial/.env.local`):
   ```bash
   cp .env.example .env
   ```
   ```
   EXPO_PUBLIC_DEV_URL=https://<tu-proyecto-dev>.supabase.co
   EXPO_PUBLIC_DEV_ANON=<tu-anon-key-dev>
   # Módulos habilitados (coma, minúsculas). Vacío = todos. Keys: trace,field,crm,stock,assets
   EXPO_PUBLIC_ENABLED_MODULES=
   ```
   > Solo la **anon key** (pública). Nunca la `service_role`.
3. Correr:
   ```bash
   npx expo start
   ```
   Escaneá el QR con Expo Go. La app abre en el Login → ingresás tu email → te llega un **código de
   6 dígitos** → lo tipeás → entrás.

## Variables de entorno
| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_DEV_URL` | URL del proyecto Supabase de DEV. |
| `EXPO_PUBLIC_DEV_ANON` | Anon key (pública) de ese proyecto. |
| `EXPO_PUBLIC_ENABLED_MODULES` | Módulos habilitados (coma). Vacío/sin match = todos. Mismo criterio que la web (`NEXT_PUBLIC_ENABLED_MODULES`). |

## Scripts
- `npx expo start` — dev server + QR para Expo Go.
- `npx tsc --noEmit` — typecheck.
- `npx expo lint` — lint.

## Estructura
```
src/
  app/            Rutas (Expo Router). (auth)=acceso, (app)=app con tabs.
  components/     FolderCard (firma), FolderSurface, íconos, tab bar, ui/.
  lib/            supabase, tenant, auth (OTP), bootstrap, modules, db/biometrics (stubs).
  config/         tenants.ts (mapa empresa→backend; en M0 solo "dev").
  theme/          tokens.ts (fuente de verdad), useThemeColors, color util.
  global.css      Variables de tema (claro/oscuro) para NativeWind.
assets/brand/     Logos del prototipo (iso-navy, iso-white).
```

## Notas
- **Tenant**: cada cliente tiene su propia base Supabase. En M0 el tenant es fijo (`dev`).
- **Auth**: passwordless por **email OTP** (`signInWithOtp` + `verifyOtp`). La sesión persiste cifrada
  en `expo-secure-store`; al reabrir la app seguís logueado.
- **Módulos**: la navegación (tabs) se gatea por `EXPO_PUBLIC_ENABLED_MODULES` + rol, curados al set
  móvil (Field/Assets/Stock/Trace). Trace se llega desde "Más".
- **Deuda de M0** (llega en M1+): biometría/PIN, SQLite offline + cola de sync, features de módulos.
  `expo-sqlite` y `expo-local-authentication` quedan instalados con wrapper stub.
- **Publicación (M4)**: se hace con EAS Build/Submit; no es necesario para desarrollar en Expo Go.
