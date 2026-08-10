import { getDb } from '@/lib/db';

/** Cola de salida (sync_outbox): mutaciones hechas offline, para subir al reconectar. */
export interface OutboxItem {
  id: number;
  entity: string;
  op: string;
  payload: string | null;
  status: string;
  retry_count: number;
  last_error: string | null;
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

/** Todos los ítems (pendientes + fallidos), más nuevos primero — para la pantalla de estado. */
export async function getAllItems(): Promise<OutboxItem[]> {
  return getDb().getAllAsync<OutboxItem>('SELECT * FROM sync_outbox ORDER BY created_at DESC');
}

export async function markDone(id: number): Promise<void> {
  await getDb().runAsync('DELETE FROM sync_outbox WHERE id = ?', id);
}

/** Falló pero todavía no llegó al máximo de reintentos: queda 'pending', se reintenta solo. */
export async function markRetry(id: number, error: string): Promise<void> {
  await getDb().runAsync('UPDATE sync_outbox SET retry_count = retry_count + 1, last_error = ? WHERE id = ?', error, id);
}

/** Llegó al máximo de reintentos: se saca de la cola activa para no bloquear a los demás. */
export async function markFailed(id: number, error: string): Promise<void> {
  await getDb().runAsync("UPDATE sync_outbox SET status = 'failed', last_error = ? WHERE id = ?", error, id);
}

/** Vuelve a poner en cola los ítems fallidos (botón "Reintentar" del usuario). */
export async function retryFailed(): Promise<void> {
  await getDb().runAsync("UPDATE sync_outbox SET status = 'pending', retry_count = 0, last_error = NULL WHERE status = 'failed'");
}

export async function countPending(): Promise<number> {
  const r = await getDb().getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE status = 'pending'");
  return r?.n ?? 0;
}

export async function countFailed(): Promise<number> {
  const r = await getDb().getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM sync_outbox WHERE status = 'failed'");
  return r?.n ?? 0;
}
