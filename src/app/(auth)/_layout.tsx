import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function AuthLayout() {
  const { session, devBypass } = useAuth();
  if (session || devBypass) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
