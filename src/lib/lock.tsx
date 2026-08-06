import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { authenticate, isBiometricEnabled, setBiometricEnabled } from '@/lib/biometrics';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

interface LockValue {
  locked: boolean;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  unlock: () => void;
}
const Ctx = createContext<LockValue | null>(null);

/** Bloqueo biométrico opt-in: si está activado, pide huella/cara al abrir la app o al volver del fondo. */
export function LockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    isBiometricEnabled().then((e) => {
      setEnabledState(e);
      if (e && session) setLocked(true);
    });
  }, [session]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (appState.current.match(/inactive|background/) && st === 'active' && enabled && session) {
        setLocked(true);
      }
      appState.current = st;
    });
    return () => sub.remove();
  }, [enabled, session]);

  const unlock = useCallback(async () => {
    if (await authenticate()) setLocked(false);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    void setBiometricEnabled(v);
  }, []);

  return (
    <Ctx.Provider value={{ locked: locked && enabled && !!session, enabled, setEnabled, unlock }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLock(): LockValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useLock debe usarse dentro de <LockProvider>');
  return c;
}

/** Overlay a pantalla completa mientras está bloqueado. */
export function LockOverlay() {
  const { locked, unlock } = useLock();
  const c = useThemeColors();

  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  if (!locked) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 40 }]}>
      <View style={{ width: 88, height: 88, borderRadius: 26, backgroundColor: 'rgba(242,106,33,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="shieldCheck" size={40} color={brand.orange} strokeWidth={2} />
      </View>
      <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg }}>App bloqueada</Text>
      <View style={{ alignSelf: 'stretch' }}>
        <PrimaryButton label="Desbloquear" onPress={unlock} />
      </View>
    </View>
  );
}
