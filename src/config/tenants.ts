/**
 * Resolución de tenant. Cada cliente Zaire tiene su propia base Supabase
 * (igual que la webapp). En M0 solo existe el tenant "dev", con credenciales
 * por variables de entorno (nunca hardcodeadas, nunca service_role).
 * La arquitectura queda lista para sumar tenants / resolución por dominio de email.
 */

export type TenantKey = 'dev';

export interface TenantConfig {
  key: TenantKey;
  name: string;
  supabaseUrl: string;
  anonKey: string;
}

export const TENANTS: Record<TenantKey, TenantConfig> = {
  dev: {
    key: 'dev',
    name: 'Zaire DEV',
    supabaseUrl: process.env.EXPO_PUBLIC_DEV_URL ?? '',
    anonKey: process.env.EXPO_PUBLIC_DEV_ANON ?? '',
  },
};

export const DEFAULT_TENANT: TenantKey = 'dev';

export function getTenant(key: TenantKey = DEFAULT_TENANT): TenantConfig {
  return TENANTS[key];
}
