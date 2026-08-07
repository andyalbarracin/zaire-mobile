import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAssets } from '@/lib/assets/useAssets';
import { resolveScan, type ScanTarget } from '@/lib/scan/resolve';
import { fonts } from '@/theme/tokens';

/**
 * Escáner de QR — capacidad COMPARTIDA (entrada por el FAB central). Hoy resuelve la etiqueta
 * de un equipo → pantalla de novedad. El botón "Simular escaneo" permite probar el flujo en
 * Expo Go / sin QR físico. Pantalla siempre oscura (overlay de cámara), independiente del tema.
 */
export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const { assets } = useAssets();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);

  function goTo(target: ScanTarget) {
    handled.current = true;
    router.replace({ pathname: '/asset/[id]/novedad', params: { id: target.id } });
  }

  function onScanned(data: string) {
    if (handled.current) return;
    const target = resolveScan(data);
    if (!target) {
      setError('QR no reconocido. Escaneá la etiqueta de un equipo Zaire.');
      return;
    }
    setError(null);
    goTo(target);
  }

  function simulate() {
    if (assets.length === 0) {
      setError('No hay equipos para simular. Cargá equipos primero.');
      return;
    }
    goTo({ kind: 'asset', id: assets[0].id });
  }

  const granted = permission?.granted === true;

  return (
    <View style={{ flex: 1, backgroundColor: '#05070A' }}>
      {granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => onScanned(data)}
        />
      ) : null}

      {/* Oscurecido para dar contraste al overlay incluso con cámara activa */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,7,10,0.35)' }]} pointerEvents="none" />

      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6 }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <Icon name="chevronLeft" size={24} color="#fff" strokeWidth={2.4} />
          </Pressable>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 15, color: '#fff' }}>Escanear equipo</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Visor */}
        <View style={{ alignItems: 'center', gap: 18 }}>
          <View style={{ width: 244, height: 244, borderRadius: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.92)' }} />
          <Text style={{ fontFamily: fonts.interM, fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 280 }}>
            {granted ? 'Apuntá al QR de la etiqueta del equipo' : 'Necesitamos la cámara para escanear el QR'}
          </Text>
        </View>

        {/* Acciones */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {error ? (
            <Text style={{ fontFamily: fonts.interM, fontSize: 13, color: '#FF8A7A', textAlign: 'center' }}>{error}</Text>
          ) : null}
          {!granted ? <PrimaryButton label="Permitir cámara" onPress={requestPermission} /> : null}
          <Pressable
            onPress={simulate}
            style={{ height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          >
            <Icon name="gauge" size={19} color="#fff" strokeWidth={2} />
            <Text style={{ fontFamily: fonts.interSb, fontSize: 15, color: '#fff' }}>Simular escaneo de QR</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
