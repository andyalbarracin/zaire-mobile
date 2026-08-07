import { useCallback, useEffect, useState } from 'react';

import { readCache, writeCache } from '@/lib/cache';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';

import { getProductStock, getStockLevels, type ProductStock } from './api';
import type { StockLevel } from './types';

/** Niveles de stock con caché read-through (mismo molde que useAssets/useMyVisits). */
export function useStockLevels() {
  const { supabase } = useTenant();
  const { forceOffline } = useConnectivity();
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    const key = 'stock:levels';
    setError(null);
    const cached = await readCache<StockLevel[]>(key);
    if (cached) {
      setLevels(cached);
      setLoading(false);
    }
    if (forceOffline) {
      setStale(!!cached);
      setLoading(false);
      return;
    }
    try {
      const fresh = await getStockLevels(supabase);
      setLevels(fresh);
      setStale(false);
      void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudieron cargar las existencias.');
    } finally {
      setLoading(false);
    }
  }, [supabase, forceOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return { levels, loading, error, stale, refetch: load };
}

export function useProductStock(id: string | undefined) {
  const { supabase } = useTenant();
  const { forceOffline } = useConnectivity();
  const [data, setData] = useState<ProductStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const key = `stock:product:${id}`;
    setError(null);
    const cached = await readCache<ProductStock>(key);
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
      const fresh = await getProductStock(supabase, id);
      setData(fresh);
      setStale(false);
      if (fresh) void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudo cargar el producto.');
    } finally {
      setLoading(false);
    }
  }, [supabase, id, forceOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, stale, refetch: load };
}
