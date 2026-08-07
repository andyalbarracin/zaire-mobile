import { useCallback, useEffect, useState } from 'react';

import { readCache, writeCache } from '@/lib/cache';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';

import { getOrderFull, getOrders, type OrderFull } from './api';
import type { WorkOrder } from './types';

/** Órdenes con caché read-through (mismo molde que useAssets/useMyVisits). */
export function useOrders() {
  const { supabase } = useTenant();
  const { forceOffline } = useConnectivity();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    const key = 'trace:orders';
    setError(null);
    const cached = await readCache<WorkOrder[]>(key);
    if (cached) {
      setOrders(cached);
      setLoading(false);
    }
    if (forceOffline) {
      setStale(!!cached);
      setLoading(false);
      return;
    }
    try {
      const fresh = await getOrders(supabase);
      setOrders(fresh);
      setStale(false);
      void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudieron cargar las órdenes.');
    } finally {
      setLoading(false);
    }
  }, [supabase, forceOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, loading, error, stale, refetch: load };
}

export function useOrder(id: string | undefined) {
  const { supabase } = useTenant();
  const { forceOffline } = useConnectivity();
  const [data, setData] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const key = `trace:order:${id}`;
    setError(null);
    const cached = await readCache<OrderFull>(key);
    if (cached) {
      setData(cached);
      setLoading(false);
    }
    if (forceOffline) {
      setStale(!!cached);
      setLoading(false);
      return;
    }
    try {
      const fresh = await getOrderFull(supabase, id);
      setData(fresh);
      setStale(false);
      if (fresh) void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudo cargar la orden.');
    } finally {
      setLoading(false);
    }
  }, [supabase, id, forceOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, stale, refetch: load };
}
