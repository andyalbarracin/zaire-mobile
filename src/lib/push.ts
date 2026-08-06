import type { SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth';
import { resolveTechnicianId } from '@/lib/field/api';
import { useTenant } from '@/lib/tenant';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Registra el token de push del dispositivo en `field_device_tokens` (una vez por token). */
export async function registerForPush(sb: SupabaseClient, userId: string): Promise<void> {
  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

    if ((await SecureStore.getItemAsync('push_token')) === token) return; // ya registrado
    const technician_id = await resolveTechnicianId(sb, userId);
    await sb.from('field_device_tokens').insert({ token, platform: Platform.OS, technician_id, is_active: true });
    await SecureStore.setItemAsync('push_token', token);
  } catch {
    // best-effort: simulador, permisos denegados o sin projectId no rompen la app.
  }
}

/** Registra el push al entrar a la app (cuando hay sesión). */
export function usePushRegistration(): void {
  const { supabase } = useTenant();
  const { session } = useAuth();
  const userId = session?.user?.id;
  useEffect(() => {
    if (userId) void registerForPush(supabase, userId);
  }, [userId, supabase]);
}
