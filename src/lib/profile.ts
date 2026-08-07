import type { SupabaseClient } from '@supabase/supabase-js';

/** Actualiza el nombre a mostrar del usuario (profiles.full_name). Online. */
export async function updateDisplayName(sb: SupabaseClient, userId: string, name: string): Promise<void> {
  const { error } = await sb.from('profiles').update({ full_name: name }).eq('id', userId);
  if (error) throw error;
}
