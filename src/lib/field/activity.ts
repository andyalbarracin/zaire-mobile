import type { SupabaseClient } from '@supabase/supabase-js';

import { enqueue } from '@/lib/sync/outbox';

/**
 * Bitácora de la visita (`field_visit_events`). La tabla ya existe en el backend (la usa la web
 * para `cambio_estado`/`geocerca_entrada`/`geocerca_salida`/`salida`, con `event_type` restringido
 * por CHECK a un set fijo que ya incluye `'nota'` y `'foto'` sin usar) — mobile es el primer
 * consumidor de esos dos, y lo que se escriba acá también aparece en el timeline de la web.
 */
export interface VisitActivityEntry {
  id: string;
  event_type: string;
  description: string | null;
  occurred_at: string;
  author?: { full_name: string | null } | null;
  pending?: boolean;
}

const ACTIVITY_SELECT = 'id, event_type, description, occurred_at, author:profiles(full_name)';

export async function getVisitActivity(sb: SupabaseClient, visitId: string): Promise<VisitActivityEntry[]> {
  const { data, error } = await sb
    .from('field_visit_events')
    .select(ACTIVITY_SELECT)
    .eq('visit_id', visitId)
    .order('occurred_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as VisitActivityEntry[];
}

/**
 * Nota manual en la bitácora de la visita. Online → INSERT directo; offline → se encola (mismo
 * op `insert` del outbox que ya usan las novedades de Assets) y se devuelve una entrada local
 * para mostrar optimista hasta que sincronice. Append-only: corregir es una nota nueva, no editar.
 */
export async function addVisitNote(
  sb: SupabaseClient,
  isOnline: boolean,
  visitId: string,
  createdBy: string | null,
  authorName: string | null,
  text: string,
): Promise<VisitActivityEntry> {
  const occurred_at = new Date().toISOString();
  const row = { visit_id: visitId, event_type: 'nota', description: text, created_by: createdBy, occurred_at };

  if (isOnline) {
    const { data, error } = await sb.from('field_visit_events').insert(row).select(ACTIVITY_SELECT).single();
    if (error) throw error;
    return data as unknown as VisitActivityEntry;
  }
  await enqueue('field_visit_events', 'insert', { row });
  return { id: `local-${Date.now()}`, event_type: 'nota', description: text, occurred_at, author: { full_name: authorName }, pending: true };
}

/** Deja constancia en la bitácora de que se agregó una foto. Best-effort: si falla, no rompe (la foto ya quedó subida). */
export async function logPhotoActivity(sb: SupabaseClient, visitId: string, createdBy: string | null): Promise<VisitActivityEntry | null> {
  const { data, error } = await sb
    .from('field_visit_events')
    .insert({ visit_id: visitId, event_type: 'foto', description: 'Agregó una foto', created_by: createdBy })
    .select(ACTIVITY_SELECT)
    .single();
  if (error) return null;
  return data as unknown as VisitActivityEntry;
}
