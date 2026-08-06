import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
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

/** Bloqueo biométrico opt-in: bloquea al mandar la app a segundo plano; se desbloquea con huella/cara. */
export function LockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const authenticating = useRef(false);

  useEffect(() => {
    isBiometricEnabled().then((e) => {
      setEnabledState(e);
      if (e && session) setLocked(true);
    });
  }, [session]);

  useEffect(() => {
    // Bloqueamos al IR a background (no al volver): el prompt de huella deja la app en
    // 'inactive', no 'background', así que no re-dispara el bloqueo (evita el loop).
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'background' && enabled && session) setLocked(true);
    });
    return () => sub.remove();
  }, [enabled, session]);

  const unlock = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    try {
      if (await authenticate()) setLocked(false);
    } finally {
      authenticating.current = false;
    }
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

/** Overlay que difumina la pantalla actual (no la tapa) mientras está bloqueado. */
export function LockOverlay() {
  const { locked, unlock } = useLock();
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (locked) unlock();
  }, [locked, unlock]);

  if (!locked) return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={38} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 }]}>
        <View style={{ width: 88, height: 88, borderRadius: 26, backgroundColor: 'rgba(27,42,68,0.10)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="shieldCheck" size={40} color={brand.navy} strokeWidth={2} />
        </View>
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg }}>App bloqueada</Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 14, color: c.fg2, textAlign: 'center' }}>Usá tu huella o cara para volver a entrar.</Text>
        <View style={{ width: 240, marginTop: 6 }}>
          <PrimaryButton variant="navy" label="Desbloquear" iconRight="shieldCheck" onPress={unlock} />
        </View>
      </View>
    </View>
  );
}
