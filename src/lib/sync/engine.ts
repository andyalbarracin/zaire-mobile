import type { SupabaseClient } from '@supabase/supabase-js';

import { getPending, markDone, markFailed, markRetry } from './outbox';

const MAX_RETRIES = 5;

/** `isOnline` se basa en `isConnected`, poco confiable (wifi conectado ≠ internet real) — si el
 * fetch en sí falló (no una respuesta del servidor), no cuenta como intento fallido del ítem. */
function isNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('timed out');
}

/**
 * Aplica la cola de salida al backend. Soporta `set_status` (payload: { id, patch }) e
 * `insert` (payload: { row }).
 *
 * Antes, el primer ítem que fallaba cortaba el loop (`break`) — un solo cambio trabado (ej. un
 * registro borrado del otro lado, o un error de validación permanente) bloqueaba TODA la cola
 * para siempre, incluso ítems de otras visitas/equipos que sí podrían subir bien. Ahora cada
 * ítem se intenta de forma independiente: si falla, sigue con el resto y anota el reintento;
 * recién después de `MAX_RETRIES` fallos consecutivos lo saca de la cola activa (`status:
 * 'failed'`) para dejar de reintentarlo solo — pero queda visible en "Ver estado sin señal",
 * donde el usuario puede reintentarlo a mano.
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
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      if (it.retry_count + 1 >= MAX_RETRIES) {
        await markFailed(it.id, message);
      } else {
        await markRetry(it.id, message);
      }
      // sin `break`: un ítem trabado no debe frenar al resto de la cola.
    }
  }
  return done;
}
