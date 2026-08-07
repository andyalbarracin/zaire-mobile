import type { SupabaseClient } from '@supabase/supabase-js';

import { getPending, markDone } from './outbox';

/**
 * Aplica la cola de salida al backend. Soporta `set_status` (payload: { id, patch }) e
 * `insert` (payload: { row }). Se corta al primer fallo (probablemente sin señal de nuevo).
 * Devuelve cuántos ítems se sincronizaron.
 */
export async function flushOutbox(sb: SupabaseClient): Promise<number> {
  const items = await getPending();
  let done = 0;
  for (const it of items) {
    try {
      const payload = JSON.parse(it.payload ?? '{}') as {
        id?: string;
        patch?: Record<string, unknown>;
        row?: Record<string, unknown>;
      };
      if (it.op === 'set_status' && payload.id && payload.patch) {
        const { error } = await sb.from(it.entity).update(payload.patch).eq('id', payload.id);
        if (error) throw error;
      } else if (it.op === 'insert' && payload.row) {
        const { error } = await sb.from(it.entity).insert(payload.row);
        if (error) throw error;
      }
      await markDone(it.id);
      done++;
    } catch {
      break;
    }
  }
  return done;
}
