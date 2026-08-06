import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

/** Grupo autenticado: Stack que contiene las tabs y las pantallas de detalle (visit/[id]). */
export default function AppLayout() {
  const { session, devBypass } = useAuth();
  if (!session && !devBypass) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="visit/[id]" />
    </Stack>
  );
}
