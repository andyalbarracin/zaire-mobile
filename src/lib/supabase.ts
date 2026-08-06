import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { getTenant, type TenantKey } from '@/config/tenants';

/*
 * Adapter de almacenamiento para la sesión Supabase sobre expo-secure-store.
 * SecureStore limita cada valor a ~2048 bytes y la sesión (JWT + refresh) puede
 * excederlo, así que partimos el valor en chunks: en `<key>` guardamos la cantidad
 * de chunks y en `<key>.<i>` cada pedazo. Funciones standalone (sin `this`) para que
 * Supabase pueda invocarlas incluso desestructuradas.
 */
const CHUNK_SIZE = 2000;
const partKey = (key: string, i: number) => `${key}.${i}`;

async function removeItem(key: string): Promise<void> {
  const meta = await SecureStore.getItemAsync(key);
  if (meta != null) {
    const count = parseInt(meta, 10);
    if (!Number.isNaN(count)) {
      for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(partKey(key, i));
    }
  }
  await SecureStore.deleteItemAsync(key);
}

async function getItem(key: string): Promise<string | null> {
  const meta = await SecureStore.getItemAsync(key);
  if (meta == null) return null;
  const count = parseInt(meta, 10);
  if (Number.isNaN(count)) return meta; // valor simple (no chunked)
  let out = '';
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(partKey(key, i));
    if (part == null) return null;
    out += part;
  }
  return out;
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);
  const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(partKey(key, i), value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(key, String(count));
}

const SecureStoreAdapter = { getItem, setItem, removeItem };

const clients = new Map<TenantKey, SupabaseClient>();

/** Devuelve (memoizado) el cliente Supabase del backend de ese tenant. */
export function createSupabaseForTenant(tenantKey: TenantKey): SupabaseClient {
  const cached = clients.get(tenantKey);
  if (cached) return cached;
  const t = getTenant(tenantKey);
  const client = createClient(t.supabaseUrl, t.anonKey, {
    auth: {
      storage: SecureStoreAdapter,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  clients.set(tenantKey, client);
  return client;
}
