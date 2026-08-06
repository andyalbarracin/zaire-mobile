import { getDb } from '@/lib/db';

/**
 * Cola de salida (sync_outbox) — andamiaje. Cuando lleguen las mutaciones offline
 * (cambio de estado de visita, reporte, etc. en slices siguientes), se encolan acá y
 * se suben cuando vuelve la conexión. En esta slice NO se usa todavía.
 */
export interface OutboxItem {
  id: number;
  entity: string;
  op: string;
  payload: string | null;
  status: string;
  created_at: number;
}

export async function enqueue(entity: string, op: string, payload: unknown): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO sync_outbox (entity, op, payload, created_at) VALUES (?, ?, ?, ?)',
    entity,
    op,
    JSON.stringify(payload),
    Date.now(),
  );
}

export async function getPending(): Promise<OutboxItem[]> {
  return getDb().getAllAsync<OutboxItem>("SELECT * FROM sync_outbox WHERE status = 'pending' ORDER BY created_at ASC");
}
