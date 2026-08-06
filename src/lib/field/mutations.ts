import type { SupabaseClient } from '@supabase/supabase-js';

import { enqueue } from '@/lib/sync/outbox';

import type { FieldVisit, VisitStatus } from './types';

/** Timestamp que corresponde setear según el nuevo estado. */
function tsField(next: VisitStatus): 'started_at' | 'arrived_at' | 'ended_at' | null {
  return next === 'en_curso' ? 'started_at' : next === 'en_sitio' ? 'arrived_at' : next === 'finalizada' ? 'ended_at' : null;
}

/**
 * Cambia el estado de una visita. Online → PATCH directo. Offline → se encola en `sync_outbox`.
 * En ambos casos devuelve el `patch` para actualizar la UI de forma optimista.
 */
export async function changeStatus(
  sb: SupabaseClient,
  isOnline: boolean,
  visit: FieldVisit,
  next: VisitStatus,
): Promise<Partial<FieldVisit>> {
  const ts = new Date().toISOString();
  const field = tsField(next);
  const patch: Record<string, unknown> = { status: next };
  if (field) patch[field] = ts;

  if (isOnline) {
    const { error } = await sb.from('field_visits').update(patch).eq('id', visit.id);
    if (error) throw error;
  } else {
    await enqueue('field_visits', 'set_status', { id: visit.id, patch });
  }
  return patch as Partial<FieldVisit>;
}
