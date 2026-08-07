import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';
import { getEnabledMobileModules, type ModuleId } from '@/lib/modules';
import { useTenant } from '@/lib/tenant';
import type { Profile, UserRole } from '@/lib/types';

interface BootstrapData {
  profile: Profile | null;
  role: UserRole;
  companyName: string;
  modules: ModuleId[];
}

interface BootstrapContextValue extends BootstrapData {
  loading: boolean;
  updateProfileName: (name: string) => void;
}

const BootstrapContext = createContext<BootstrapContextValue | null>(null);

/**
 * Tras autenticar, lee de la base del tenant el perfil (rol) y el nombre de la empresa,
 * y resuelve los módulos habilitados (curados a móvil). Deja todo en un contexto global.
 * Si no hay fila de perfil (usuario OTP nuevo), cae a rol `viewer`.
 */
export function BootstrapProvider({ children }: { children: ReactNode }) {
  const { supabase, tenant } = useTenant();
  const { session } = useAuth();
  const [data, setData] = useState<BootstrapData>({
    profile: null,
    role: 'viewer',
    companyName: tenant.name,
    modules: getEnabledMobileModules(),
  });
  const [loading, setLoading] = useState(false);

  // Refleja localmente el nombre a mostrar tras editarlo (evita recargar todo el bootstrap).
  const updateProfileName = (name: string) =>
    setData((d) => ({ ...d, profile: d.profile ? { ...d.profile, full_name: name } : d.profile }));

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) {
      setData({ profile: null, role: 'viewer', companyName: tenant.name, modules: getEnabledMobileModules() });
      return;
    }
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      // Nombre de empresa (best-effort): company_settings es fila singleton (id=1).
      let companyName = tenant.name;
      const { data: company } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle();
      const c = company as Record<string, unknown> | null;
      const maybeName = c?.name ?? c?.company_name ?? c?.nombre;
      if (typeof maybeName === 'string' && maybeName.length > 0) companyName = maybeName;

      if (!mounted) return;
      const typed = (profile as Profile | null) ?? null;
      setData({
        profile: typed,
        role: typed?.role ?? 'viewer',
        companyName,
        modules: getEnabledMobileModules(),
      });
      setLoading(false);
    })().catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [userId, supabase, tenant.name]);

  return <BootstrapContext.Provider value={{ ...data, loading, updateProfileName }}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): BootstrapContextValue {
  const ctx = useContext(BootstrapContext);
  if (!ctx) throw new Error('useBootstrap debe usarse dentro de <BootstrapProvider>');
  return ctx;
}
