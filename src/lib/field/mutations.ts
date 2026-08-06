import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Marca el arribo a la visita: estado → `en_sitio` + `arrived_at`. Online.
 * La versión offline (encolada en sync_outbox) llega en la slice de mutaciones.
 * Devuelve el timestamp de arribo para actualización optimista.
 */
export async function markArrival(sb: SupabaseClient, visitId: string): Promise<string> {
  const now = new Date().toISOString();
  const { error } = await sb.from('field_visits').update({ status: 'en_sitio', arrived_at: now }).eq('id', visitId);
  if (error) throw error;
  return now;
}
