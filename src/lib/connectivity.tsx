import * as Network from 'expo-network';
import { createContext, useContext, useState, type ReactNode } from 'react';

interface ConnectivityValue {
  /** Estado efectivo: hay red real Y no está forzado el modo offline. */
  isOnline: boolean;
  /** Modo offline forzado (toggle en "Más", para probar sin apagar el WiFi). */
  forceOffline: boolean;
  setForceOffline: (v: boolean) => void;
}

const Ctx = createContext<ConnectivityValue | null>(null);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const net = Network.useNetworkState();
  const [forceOffline, setForceOffline] = useState(false);

  // Asumimos online hasta que el SO diga lo contrario (isInternetReachable puede ser null al inicio).
  const networkOnline = (net?.isConnected ?? true) && (net?.isInternetReachable ?? true);
  const isOnline = !forceOffline && networkOnline;

  return <Ctx.Provider value={{ isOnline, forceOffline, setForceOffline }}>{children}</Ctx.Provider>;
}

export function useConnectivity(): ConnectivityValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useConnectivity debe usarse dentro de <ConnectivityProvider>');
  return c;
}
