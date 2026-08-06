/**
 * Tipos (subset) de Zaire Activos, espejo de zaire-industrial/src/lib/assets/types.ts.
 * Solo lo que la Slice 1 (lista + detalle) necesita. No divergir de los nombres del backend.
 */

export type AssetType = 'bomba' | 'sello' | 'compresor' | 'motor' | 'valvula' | 'otro';
export type AssetStatus = 'operativo' | 'en_reparacion' | 'standby' | 'baja';
export type EventType =
  | 'servicio'
  | 'inspeccion'
  | 'falla'
  | 'traslado'
  | 'lectura'
  | 'alta'
  | 'baja'
  | 'garantia'
  | 'nota';

export interface AssetClient {
  id: string;
  business_name: string | null;
}

export interface Asset {
  id: string;
  tag: string | null;
  name: string;
  type: AssetType | null;
  brand: string | null;
  model: string | null;
  serial: string | null;
  client_id: string | null;
  site_id: string | null;
  status: AssetStatus;
  criticidad: number; // 1..5
  installed_at: string | null;
  warranty_until: string | null;
  expected_life_years: number | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: AssetClient | null;
  health?: number; // 0-100, calculado on-read
}

export interface AssetEvent {
  id: string;
  asset_id: string;
  type: EventType;
  event_date: string;
  description: string | null;
  cost: number | null;
  currency: string;
  downtime_hours: number | null;
  created_at: string;
}

export interface AssetDocument {
  id: string;
  asset_id: string;
  doc_type: string | null;
  name: string | null;
  file_path: string;
  expires_at: string | null;
  created_at: string;
}

export interface AssetComponent {
  id: string;
  asset_id: string;
  name: string | null;
  serial: string | null;
  qty: number;
  notes: string | null;
  product?: { id: string; code: string | null; name: string; unit: string } | null;
}
