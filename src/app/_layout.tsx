import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from '@expo-google-fonts/raleway';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { BootstrapProvider } from '@/lib/bootstrap';
import { ConnectivityProvider } from '@/lib/connectivity';
import { FontScaleProvider } from '@/lib/fontScale';
import { LockOverlay, LockProvider } from '@/lib/lock';
import { SyncProvider } from '@/lib/sync/SyncProvider';
import { TenantProvider } from '@/lib/tenant';

SplashScreen.preventAutoHideAsync();

/**
 * Red de seguridad global: si algo revienta al renderizar (bug, dato inesperado del backend),
 * Expo Router muestra esto en vez de pantalla en blanco/crash. Estilos fijos (no tokens de tema):
 * si el árbol de providers es justamente lo que crasheó, no puede depender de ellos.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D0F', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <Text style={{ color: '#F4F1EA', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Algo salió mal</Text>
      <Text style={{ color: '#AEB6C4', fontSize: 14, textAlign: 'center', marginTop: 10, maxWidth: 300 }}>
        {__DEV__ ? error.message : 'Probá de nuevo. Si el problema sigue, contactanos desde Soporte.'}
      </Text>
      <Pressable
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Reintentar"
        style={{ marginTop: 24, backgroundColor: '#F26A21', borderRadius: 14, paddingHorizontal: 26, paddingVertical: 14 }}
      >
        <Text style={{ color: '#0E1626', fontSize: 15, fontWeight: '700' }}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

function RootNav({ fontsReady }: { fontsReady: boolean }) {
  const { initializing } = useAuth();
  const ready = fontsReady && !initializing;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <LockOverlay />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // Si las fuentes fallan al cargar (raro, pero posible), no dejar la app trabada en el splash
  // para siempre — seguimos igual, React Native cae a una fuente del sistema.
  const fontsReady = fontsLoaded || !!fontError;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FontScaleProvider>
        <ConnectivityProvider>
          <TenantProvider>
            <AuthProvider>
              <BootstrapProvider>
                <SyncProvider>
                  <LockProvider>
                    <StatusBar style="auto" />
                    <RootNav fontsReady={fontsReady} />
                  </LockProvider>
                </SyncProvider>
              </BootstrapProvider>
            </AuthProvider>
          </TenantProvider>
        </ConnectivityProvider>
        </FontScaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
