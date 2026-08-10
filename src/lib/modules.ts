/**
 * Gateo de módulos — espejo de la webapp (`zaire-industrial/src/lib/modules.ts`).
 * La web lee `NEXT_PUBLIC_ENABLED_MODULES`; acá `EXPO_PUBLIC_ENABLED_MODULES`,
 * con los mismos keys y la misma semántica (vacío / sin match = todos habilitados).
 */

export type ModuleId = 'trace' | 'field' | 'crm' | 'stock' | 'assets';

const ALL_MODULES: ModuleId[] = ['trace', 'field', 'crm', 'stock', 'assets'];

/** Módulos con sentido en el celular (curados). `crm` queda solo en la web. */
export const MOBILE_MODULES: ModuleId[] = ['field', 'assets', 'stock', 'trace'];

/** Lee EXPO_PUBLIC_ENABLED_MODULES (coma, minúsculas). Vacío / sin match => todos. */
export function getEnabledModules(): ModuleId[] {
  const raw = String(process.env.EXPO_PUBLIC_ENABLED_MODULES ?? '')
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);
  const matched = raw.filter((m: string): m is ModuleId => (ALL_MODULES as string[]).includes(m));
  return matched.length > 0 ? matched : ALL_MODULES;
}

/** Habilitados que además existen en móvil, en orden de prioridad de campo. */
export function getEnabledMobileModules(): ModuleId[] {
  const enabled = getEnabledModules();
  return MOBILE_MODULES.filter((m) => enabled.includes(m));
}

export function isModuleEnabled(mod: ModuleId): boolean {
  return getEnabledModules().includes(mod);
}

// Mismo orden que ZaireTabBar (Hoy → módulos habilitados en orden de prioridad → Más).
const TAB_ORDER: string[] = ['index', ...MOBILE_MODULES, 'more'];
const TAB_PATH: Record<string, string> = { index: '/', field: '/field', assets: '/assets', stock: '/stock', trace: '/trace', more: '/more' };

/** Paths de las pantallas del navbar que están visibles hoy (según enabled_modules), en orden. Para el swipe. */
export function getVisibleTabPaths(): string[] {
  const enabled = getEnabledMobileModules();
  return TAB_ORDER.filter((n) => n === 'index' || n === 'more' || enabled.includes(n as ModuleId)).map((n) => TAB_PATH[n]);
}

/** Metadatos de presentación por módulo (label + subtítulo + ícono del prototipo). */
export const MODULE_META: Record<ModuleId, { label: string; sub: string; icon: string }> = {
  field: { label: 'Field', sub: 'Visitas', icon: 'layers' },
  assets: { label: 'Assets', sub: 'Equipos', icon: 'box' },
  stock: { label: 'Stock', sub: 'Existencias', icon: 'grid' },
  trace: { label: 'Trace', sub: 'Órdenes', icon: 'route' },
  crm: { label: 'CRM', sub: 'Clientes', icon: 'users' },
};
