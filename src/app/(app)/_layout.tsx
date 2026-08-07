import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { usePushRegistration } from '@/lib/push';

/** Grupo autenticado: Stack que contiene las tabs y las pantallas de detalle (visit/[id]). */
export default function AppLayout() {
  const { session, devBypass } = useAuth();
  usePushRegistration();
  if (!session && !devBypass) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="visit/[id]" />
      <Stack.Screen name="asset/[id]" />
      <Stack.Screen name="asset/[id]/novedad" />
      <Stack.Screen name="asset/nuevo" />
      <Stack.Screen name="stock/producto/[id]" />
      <Stack.Screen name="stock/producto/[id]/movimiento" />
      <Stack.Screen name="soporte" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
    </Stack>
  );
}
