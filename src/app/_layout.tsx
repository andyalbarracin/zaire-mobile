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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth';
import { BootstrapProvider } from '@/lib/bootstrap';
import { ConnectivityProvider } from '@/lib/connectivity';
import { LockOverlay, LockProvider } from '@/lib/lock';
import { SyncProvider } from '@/lib/sync/SyncProvider';
import { TenantProvider } from '@/lib/tenant';

SplashScreen.preventAutoHideAsync();

function RootNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { initializing } = useAuth();
  const ready = fontsLoaded && !initializing;

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
  const [fontsLoaded] = useFonts({
    Raleway_500Medium,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Raleway_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConnectivityProvider>
          <TenantProvider>
            <AuthProvider>
              <BootstrapProvider>
                <SyncProvider>
                  <LockProvider>
                    <StatusBar style="auto" />
                    <RootNav fontsLoaded={fontsLoaded} />
                  </LockProvider>
                </SyncProvider>
              </BootstrapProvider>
            </AuthProvider>
          </TenantProvider>
        </ConnectivityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
