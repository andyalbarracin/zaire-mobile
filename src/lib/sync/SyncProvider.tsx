import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useConnectivity } from '@/lib/connectivity';
import { flushOutbox } from '@/lib/sync/engine';
import { countPending } from '@/lib/sync/outbox';
import { useTenant } from '@/lib/tenant';

interface SyncValue {
  pending: number;
  syncing: boolean;
  refresh: () => void;
  sync: () => void;
}
const Ctx = createContext<SyncValue | null>(null);

/** Cuenta los cambios pendientes y los sube cuando vuelve la conexión o la app pasa a primer plano. */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { supabase } = useTenant();
  const { isOnline } = useConnectivity();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const busy = useRef(false);

  const refresh = useCallback(() => {
    countPending().then(setPending).catch(() => {});
  }, []);

  const sync = useCallback(async () => {
    if (busy.current || !isOnline) return;
    busy.current = true;
    setSyncing(true);
    try {
      await flushOutbox(supabase);
    } catch {
      // se reintenta en el próximo disparo
    } finally {
      busy.current = false;
      setSyncing(false);
      refresh();
    }
  }, [supabase, isOnline, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (isOnline) sync();
  }, [isOnline, sync]);

  useEffect(() => {
    const s = AppState.addEventListener('change', (st) => {
      if (st === 'active') sync();
    });
    return () => s.remove();
  }, [sync]);

  return <Ctx.Provider value={{ pending, syncing, refresh, sync }}>{children}</Ctx.Provider>;
}

export function useSync(): SyncValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSync debe usarse dentro de <SyncProvider>');
  return c;
}
