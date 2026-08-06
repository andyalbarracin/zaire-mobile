import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { readCache, writeCache } from '@/lib/cache';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';

import { getMyVisits, getVisit } from './api';
import type { FieldVisit } from './types';

/**
 * Visitas del técnico logueado con caché read-through:
 * muestra lo guardado al instante, refresca de red cuando hay conexión, y si no hay red
 * (o modo offline) se queda con lo cacheado (`stale = true`).
 */
export function useMyVisits() {
  const { supabase } = useTenant();
  const { session } = useAuth();
  const { isOnline } = useConnectivity();
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setVisits([]);
      setLoading(false);
      return;
    }
    const key = `visits:${userId}`;
    setError(null);

    // 1) caché instantáneo
    const cached = await readCache<FieldVisit[]>(key);
    if (cached) {
      setVisits(cached);
      setLoading(false);
    }
    // 2) offline → nos quedamos con lo guardado
    if (!isOnline) {
      setStale(!!cached);
      setLoading(false);
      return;
    }
    // 3) refrescar de red
    try {
      const fresh = await getMyVisits(supabase, userId);
      setVisits(fresh);
      setStale(false);
      void writeCache(key, fresh);
    } catch {
      setStale(!!cached);
      if (!cached) setError('No se pudieron cargar las visitas.');
    } finally {
      setLoading(false);
    }
  }, [supabase, userId, isOnline]);

  useEffect(() => {
    load();
  }, [load]);

  return { visits, loading, error, stale, refetch: load };
}

export function useVisit(id: string | undefined) {
  const { supabase } = useTenant();
  const { isOnline } = useConnectivity();
  const [visit, setVisit] = useState<FieldVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setLoading(false);
      return;
    }
    const key = `visit:${id}`;

    (async () => {
      const cached = await readCache<FieldVisit>(key);
      if (cached && mounted) {
        setVisit(cached);
        setLoading(false);
      }
      if (!isOnline) {
        if (mounted) {
          setStale(!!cached);
          setLoading(false);
        }
        return;
      }
      try {
        const fresh = await getVisit(supabase, id);
        if (mounted) {
          setVisit(fresh);
          setStale(false);
        }
        if (fresh) void writeCache(key, fresh);
      } catch {
        if (mounted) {
          setStale(!!cached);
          if (!cached) setError('No se pudo cargar la visita.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase, id, isOnline]);

  return { visit, loading, error, stale };
}
