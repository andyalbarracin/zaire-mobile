import { Alert, Linking } from 'react-native';

interface PermissionCopy {
  title: string;
  message: string;
  deniedMessage: string;
}

interface PermissionResult {
  granted: boolean;
  canAskAgain?: boolean;
}

/**
 * Pide un permiso del SO explicando ANTES para qué lo usamos (el diálogo nativo no lo dice) y,
 * si ya fue denegado antes (`canAskAgain: false` — iOS no vuelve a mostrar el diálogo nativo),
 * ofrece ir directo a Ajustes en vez de reintentar en silencio y quedar en un callejón sin salida.
 */
export function askPermission(
  copy: PermissionCopy,
  getCurrent: () => Promise<PermissionResult>,
  request: () => Promise<PermissionResult>,
): Promise<boolean> {
  return getCurrent().then((current) => {
    if (current.granted) return true;
    if (current.canAskAgain === false) {
      return new Promise<boolean>((resolve) => {
        Alert.alert(copy.title, copy.deniedMessage, [
          { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Abrir Ajustes',
            onPress: () => {
              Linking.openSettings();
              resolve(false);
            },
          },
        ]);
      });
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert(copy.title, copy.message, [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Continuar',
          onPress: () => {
            request()
              .then((res) => resolve(res.granted))
              .catch(() => resolve(false));
          },
        },
      ]);
    });
  });
}
