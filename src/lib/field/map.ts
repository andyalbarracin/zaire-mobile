import type { FolderCardProps } from '@/components/FolderCard';
import type { IconName } from '@/components/icons/Icon';
import type { StatusKey } from '@/theme/tokens';

import type { FieldVisit, VisitPurpose, VisitStatus } from './types';

/** Estado del backend → clave de estado de FolderCard (tokens del prototipo). */
export const STATUS_TO_KEY: Record<VisitStatus, StatusKey> = {
  planificada: 'planificada',
  en_curso: 'encurso',
  en_sitio: 'ensitio',
  finalizada: 'finalizada',
  cancelada: 'cancelada',
};

const PURPOSE_ICON: Record<VisitPurpose, IconName> = {
  relevamiento: 'gauge',
  reparacion: 'wrench',
  entrega: 'box',
  visita_comercial: 'doc',
  mantenimiento: 'wrench',
  otro: 'factory',
};

export function visitTime(v: FieldVisit): string {
  if (!v.scheduled_at) return '';
  const d = new Date(v.scheduled_at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function visitToCard(v: FieldVisit): FolderCardProps {
  return {
    title: v.client?.business_name || 'Sin cliente',
    subtitle: v.site?.name || v.site?.city || 'Sin sitio',
    status: STATUS_TO_KEY[v.status] ?? 'none',
    time: visitTime(v),
    icon: v.purpose ? PURPOSE_ICON[v.purpose] : 'gauge',
  };
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
