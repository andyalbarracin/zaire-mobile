import * as SQLite from 'expo-sqlite';

/*
 * Andamiaje M0: dejamos expo-sqlite instalado y con un wrapper mínimo, pero NO se usa
 * todavía. El store local real (tablas offline + cola de sync `sync_outbox`) llega en M1.
 * Ver `.docs-mobile/base-docs-project/roadmap-mobile.md`.
 */
let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('zaire-mobile.db');
  return db;
}
