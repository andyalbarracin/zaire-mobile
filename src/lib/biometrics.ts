import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const [hw, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hw && enrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY)) === '1';
}

export async function setBiometricEnabled(v: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEY, v ? '1' : '0');
}

export async function authenticate(): Promise<boolean> {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloqueá Zaire Mobile',
    fallbackLabel: 'Usar PIN',
    cancelLabel: 'Cancelar',
  });
  return r.success;
}
