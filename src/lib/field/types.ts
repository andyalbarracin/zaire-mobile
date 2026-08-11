/**
 * Tipos (subset) de Zaire Field, espejo de `zaire-industrial/src/lib/field/types.ts`.
 * Solo lo que la Slice 1 (lista + detalle) necesita. No divergir de los nombres del backend.
 */

export type VisitStatus = 'planificada' | 'en_curso' | 'en_sitio' | 'finalizada' | 'cancelada';

export type VisitPurpose =
  | 'relevamiento'
  | 'reparacion'
  | 'entrega'
  | 'visita_comercial'
  | 'mantenimiento'
  | 'otro';

export interface VisitClient {
  id: string;
  business_name: string | null;
}

export interface VisitSite {
  id: string;
  name: string;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number | null;
}

export interface FieldVisit {
  id: string;
  visit_number: string | null;
  status: VisitStatus;
  purpose: VisitPurpose | null;
  vehicle_id: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  arrived_at: string | null;
  departed_at: string | null;
  ended_at: string | null;
  planned_notes: string | null;
  client: VisitClient | null;
  site: VisitSite | null;
}
