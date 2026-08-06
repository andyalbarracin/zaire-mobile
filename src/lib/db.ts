import * as SQLite from 'expo-sqlite';

/*
 * Store local (SQLite). En M1/Slice offline lo usamos para:
 *  - `cache`: caché key→value (JSON) de lecturas (visitas, etc.) para funcionar sin conexión.
 *  - `sync_outbox`: cola de cambios pendientes (andamiaje; las mutaciones llegan en slices siguientes).
 */
let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('zaire-mobile.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        op TEXT NOT NULL,
        payload TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}
