import { getDb } from '@/lib/db';

/** Caché local key→value (JSON) sobre SQLite. Lecturas para funcionar sin conexión. */
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const row = await getDb().getFirstAsync<{ value: string }>('SELECT value FROM cache WHERE key = ?', key);
    return row ? (JSON.parse(row.value) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await getDb().runAsync(
      'INSERT OR REPLACE INTO cache (key, value, updated_at) VALUES (?, ?, ?)',
      key,
      JSON.stringify(value),
      Date.now(),
    );
  } catch {
    // el caché es best-effort: si falla, seguimos sin cachear.
  }
}
