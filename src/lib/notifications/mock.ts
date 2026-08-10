import type { Href } from 'expo-router';

import type { IconName } from '@/components/icons/Icon';
import type { moduleBrand } from '@/theme/tokens';

/**
 * Datos de MUESTRA para demostrar el flujo de notificaciones (campana + "Ver todas").
 * Todavía no hay backend de notificaciones real — ver roadmap-mobile.md (M6). Cuando exista,
 * este archivo se reemplaza por un hook que lea de la tabla/feed real; la UI (NotificationsPanel,
 * notificaciones.tsx) no debería necesitar cambios grandes, solo la fuente de datos.
 */

export type NotificationKind = 'ot_asignada' | 'vencimiento_visita' | 'salud_critica' | 'falta_stock' | 'cliente_urgente';

export interface MockNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  time: string;
  route: Href;
}

export const NOTIF_META: Record<NotificationKind, { icon: IconName; accent: keyof typeof moduleBrand }> = {
  ot_asignada: { icon: 'route', accent: 'trace' },
  vencimiento_visita: { icon: 'layers', accent: 'field' },
  salud_critica: { icon: 'box', accent: 'assets' },
  falta_stock: { icon: 'grid', accent: 'stock' },
  cliente_urgente: { icon: 'bell', accent: 'field' },
};

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: '1', kind: 'ot_asignada', title: 'Nueva OT asignada', subtitle: 'OT-2026-BB-0142 · Industrias del Sur', time: 'Hace 12 min', route: '/trace' },
  { id: '2', kind: 'vencimiento_visita', title: 'Visita próxima a vencer', subtitle: 'Planta Norte · vence en 2 h', time: 'Hace 40 min', route: '/field' },
  { id: '3', kind: 'salud_critica', title: 'Salud crítica de un equipo', subtitle: 'Bomba centrífuga #3 · 28%', time: 'Hoy, 09:15', route: '/assets' },
  { id: '4', kind: 'falta_stock', title: 'Falta de stock para una visita', subtitle: 'Sello mecánico 40mm · sin disponible', time: 'Ayer, 17:30', route: '/stock' },
  { id: '5', kind: 'cliente_urgente', title: 'Cliente marcó urgencia', subtitle: 'Se generó una visita nueva', time: 'Ayer, 14:02', route: '/field' },
  { id: '6', kind: 'vencimiento_visita', title: 'Visita vencida', subtitle: 'Depósito Este · ayer 18:00', time: 'Hace 1 día', route: '/field' },
];
