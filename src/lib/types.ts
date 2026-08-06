/**
 * Tipos espejo del backend `zaire-industrial` (src/lib/types/database.ts) — se replican
 * a mano para no divergir. Fuente: tabla `profiles`.
 */

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Etiquetas de rol (es) — mismas que la webapp (configuracion). */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  operator: 'Operador',
  viewer: 'Visualizador',
};
