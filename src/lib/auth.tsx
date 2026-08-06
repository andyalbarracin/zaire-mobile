import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useTenant } from '@/lib/tenant';

interface AuthContextValue {
  session: Session | null;
  initializing: boolean;
  /** Envía el código OTP al email (passwordless). */
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  /** Verifica el código y crea la sesión. */
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** Bypass SOLO para desarrollo: entra sin sesión real. Nunca disponible en producción. */
  devBypass: boolean;
  enableDevBypass: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { supabase } = useTenant();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function sendOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    return { error: error?.message ?? null };
  }

  async function verifyOtp(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    setDevBypass(false);
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{ session, initializing, sendOtp, verifyOtp, signOut, devBypass, enableDevBypass: () => setDevBypass(true) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
