import { useCallback, useEffect, useState } from 'react';

import { readCache, writeCache } from '@/lib/cache';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';

import { getAssets, getAssetFull, type AssetFull } from './api';
import type { Asset } from './types';

/**
 * Equipos de la empresa con caché read-through (mismo molde que useMyVisits):
 * muestra lo guardado al instante, refresca de red si hay conexión, y si no hay red
 * (o modo offline) se queda con lo cacheado (`stale = true`).
 */
export function useAssets() {
  const { supabase } = useTenant();
  const { forceOffline } = useConnectivity();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    const key = 'assets:all';
    setError(null);
    const cached = await readCache<Asset[]>(key);
    if (cached) {
      setAssets(cached);
      setLoading(false);
    }
    if (forceOffline) {
      setStale(!!cached);
      setLoading(false);
      return;
    }
    try {
      const fresh = await getAssets(supabase);
      setAssets(fresh);
      setStale(false);
      void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudieron cargar los equipos.');
    } finally {
      setLoading(false);
    }
  }, [supabase, forceOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return { assets, loading, error, stale, refetch: load };
}

export function useAsset(id: string | undefined) {
  const { supabase } = useTenant();
  const { forceOffline } = useConnectivity();
  const [data, setData] = useState<AssetFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const key = `asset:${id}`;
    setError(null);
    const cached = await readCache<AssetFull>(key);
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
      const fresh = await getAssetFull(supabase, id);
      setData(fresh);
      setStale(false);
      if (fresh) void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudo cargar el equipo.');
    } finally {
      setLoading(false);
    }
  }, [supabase, id, forceOffline]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, stale, refetch: load };
}
