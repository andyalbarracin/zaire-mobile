import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useTenant } from '@/lib/tenant';

import { getMyVisits, getVisit } from './api';
import type { FieldVisit } from './types';

/** Carga las visitas del técnico logueado. Sin sesión (bypass dev) devuelve lista vacía. */
export function useMyVisits() {
  const { supabase } = useTenant();
  const { session } = useAuth();
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setVisits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setVisits(await getMyVisits(supabase, userId));
    } catch {
      setError('No se pudieron cargar las visitas.');
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { visits, loading, error, refetch: load };
}

export function useVisit(id: string | undefined) {
  const { supabase } = useTenant();
  const [visit, setVisit] = useState<FieldVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getVisit(supabase, id)
      .then((v) => {
        if (mounted) setVisit(v);
      })
      .catch(() => {
        if (mounted) setError('No se pudo cargar la visita.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [supabase, id]);

  return { visit, loading, error };
}
