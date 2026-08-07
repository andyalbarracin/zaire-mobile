import type { FolderCardProps } from '@/components/FolderCard';
import type { StatusKey } from '@/theme/tokens';

import type { OrderStatus, WorkOrder } from './types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ingresada: 'Ingresada',
  en_revision: 'En revisión',
  cotizada: 'Cotizada',
  aprobada: 'Aprobada',
  en_reparacion: 'En reparación',
  lista_para_entregar: 'Lista para entregar',
  remitido: 'Remitido',
  facturada: 'Facturada',
  cancelada: 'Cancelada',
};

// State machine real del backend (zaire-industrial/lib/trace/constants.ts) — portado tal cual.
// No se ejecuta en Slice 1 (solo lectura); queda listo para cuando se habilite la mutación.
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ingresada: ['en_revision', 'cancelada'],
  en_revision: ['cotizada', 'en_reparacion', 'cancelada'],
  cotizada: ['aprobada', 'cancelada'],
  aprobada: ['en_reparacion', 'cancelada'],
  en_reparacion: ['lista_para_entregar', 'cancelada'],
  lista_para_entregar: ['remitido'],
  remitido: ['facturada'],
  facturada: [],
  cancelada: [],
};

/** Estado → clave de color. Reusa la semántica existente (no inventa 9 colores nuevos). */
export const ORDER_STATUS_TO_KEY: Record<OrderStatus, StatusKey> = {
  ingresada: 'planificada',
  en_revision: 'atencion',
  cotizada: 'atencion',
  aprobada: 'encurso',
  en_reparacion: 'encurso',
  lista_para_entregar: 'ensitio',
  remitido: 'ensitio',
  facturada: 'finalizada',
  cancelada: 'cancelada',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function orderToCard(o: WorkOrder): FolderCardProps {
  return {
    title: o.client?.business_name || 'Sin cliente',
    subtitle: `${o.order_type} ${o.order_number}`,
    status: ORDER_STATUS_TO_KEY[o.status],
    statusLabel: ORDER_STATUS_LABELS[o.status],
    icon: 'doc',
    time: fmtShortDate(o.date_in),
  };
}
