import type { SupabaseClient } from '@supabase/supabase-js';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DEFAULT_TENANT, getTenant, type TenantConfig, type TenantKey } from '@/config/tenants';
import { createSupabaseForTenant } from '@/lib/supabase';

interface TenantContextValue {
  tenant: TenantConfig;
  tenantKey: TenantKey;
  supabase: SupabaseClient;
}

const TenantContext = createContext<TenantContextValue | null>(null);

/** Provee el tenant activo y su cliente Supabase. En M0 el tenant es fijo ("dev"). */
export function TenantProvider({
  children,
  tenantKey = DEFAULT_TENANT,
}: {
  children: ReactNode;
  tenantKey?: TenantKey;
}) {
  const value = useMemo<TenantContextValue>(
    () => ({
      tenant: getTenant(tenantKey),
      tenantKey,
      supabase: createSupabaseForTenant(tenantKey),
    }),
    [tenantKey],
  );
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant debe usarse dentro de <TenantProvider>');
  return ctx;
}
