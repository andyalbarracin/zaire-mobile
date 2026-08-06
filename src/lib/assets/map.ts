import type { FolderCardProps } from '@/components/FolderCard';
import type { IconName } from '@/components/icons/Icon';
import type { StatusKey } from '@/theme/tokens';

import type { Asset, AssetStatus, AssetType, EventType } from './types';

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  operativo: 'Operativo',
  en_reparacion: 'En reparación',
  standby: 'Standby',
  baja: 'Baja',
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  bomba: 'Bomba',
  sello: 'Sello',
  compresor: 'Compresor',
  motor: 'Motor',
  valvula: 'Válvula',
  otro: 'Otro',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  servicio: 'Servicio',
  inspeccion: 'Inspección',
  falla: 'Falla',
  traslado: 'Traslado',
  lectura: 'Lectura',
  alta: 'Alta',
  baja: 'Baja',
  garantia: 'Garantía',
  nota: 'Nota',
};

export const CRITICIDAD_LABELS: Record<number, string> = {
  1: 'Muy baja',
  2: 'Baja',
  3: 'Media',
  4: 'Alta',
  5: 'Crítica',
};

/** Estado del activo → clave de estado (para el COLOR de la FolderCard). El texto va en statusLabel. */
export const ASSET_STATUS_TO_KEY: Record<AssetStatus, StatusKey> = {
  operativo: 'ensitio', // verde
  en_reparacion: 'atencion', // ámbar
  standby: 'planificada', // gris
  baja: 'critico', // rojo
};

const TYPE_ICON: Record<AssetType, IconName> = {
  bomba: 'drop',
  sello: 'valve',
  compresor: 'factory',
  motor: 'bolt',
  valvula: 'valve',
  otro: 'box',
};

export function assetIcon(a: Asset): IconName {
  return a.type ? TYPE_ICON[a.type] : 'box';
}

/** Color del semáforo de salud (verde ≥70, ámbar ≥40, rojo <40) — mismos hex que los estados. */
export function healthColor(h: number): string {
  return h >= 70 ? '#2F7D51' : h >= 40 ? '#B4832E' : '#B23B36';
}

function assetSubtitle(a: Asset): string {
  const bm = [a.brand, a.model].filter(Boolean).join(' ');
  return [a.tag, bm].filter(Boolean).join(' · ') || (a.client?.business_name ?? 'Sin datos');
}

export function assetToCard(a: Asset): FolderCardProps {
  return {
    title: a.name,
    subtitle: assetSubtitle(a),
    status: ASSET_STATUS_TO_KEY[a.status],
    statusLabel: ASSET_STATUS_LABELS[a.status],
    icon: assetIcon(a),
  };
}
