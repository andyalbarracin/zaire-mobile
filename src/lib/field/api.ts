import type { SupabaseClient } from '@supabase/supabase-js';

import type { FieldVisit } from './types';

// Espejo (curado) del VISIT_SELECT de la webapp: solo lo que necesita lista + detalle.
const VISIT_SELECT = `
  id, visit_number, status, purpose, vehicle_id, scheduled_at, started_at, arrived_at, departed_at, ended_at, planned_notes,
  client:clients(id, business_name),
  site:field_sites(id, name, city, province, latitude, longitude, geofence_radius_m)
`;

// Supabase puede devolver un join to-one como objeto o como array de 1; normalizamos.
function firstOrObj<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

function normalizeOne(row: Record<string, unknown>): FieldVisit {
  return {
    ...(row as unknown as FieldVisit),
    client: firstOrObj(row.client as never),
    site: firstOrObj(row.site as never),
  };
}

/** technician_id del técnico vinculado al usuario logueado (o null si el usuario no es técnico). */
export async function resolveTechnicianId(sb: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await sb.from('field_technicians').select('id').eq('user_id', userId).maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/** Visitas del técnico logueado. Si el usuario no es técnico (ej. admin), devuelve todas (para testear). */
export async function getMyVisits(sb: SupabaseClient, userId: string): Promise<FieldVisit[]> {
  const techId = await resolveTechnicianId(sb, userId);
  let q = sb
    .from('field_visits')
    .select(VISIT_SELECT)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(500);
  if (techId) q = q.eq('technician_id', techId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeOne);
}

export async function getVisit(sb: SupabaseClient, id: string): Promise<FieldVisit | null> {
  const { data, error } = await sb
    .from('field_visits')
    .select(VISIT_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeOne(data as Record<string, unknown>) : null;
}
