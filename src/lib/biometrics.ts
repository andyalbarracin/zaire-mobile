import * as LocalAuthentication from 'expo-local-authentication';

/*
 * Andamiaje M0: expo-local-authentication queda instalado con este wrapper mínimo.
 * El desbloqueo real (huella/cara/PIN al abrir la app) se implementa en M1.
 * Ver `.docs-mobile/architecture-and-techniques/acceso-y-auth.md`.
 */

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

/** Stub M0: todavía no bloquea el acceso. Se activa en M1. */
export async function unlock(): Promise<{ ok: boolean; reason: string }> {
  return { ok: true, reason: 'not-implemented-until-m1' };
}
