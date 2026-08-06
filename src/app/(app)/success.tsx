import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/** Momento "premiado" al finalizar una visita. Digno, sin confeti (dignidad industrial). */
export default function Success() {
  const c = useThemeColors();
  const { done, total } = useLocalSearchParams<{ done?: string; total?: string }>();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(62,190,106,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#3EBE6A', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={40} color="#fff" strokeWidth={3} />
          </View>
        </View>
        <Text style={{ fontFamily: fonts.ralewayXb, fontSize: 28, color: c.fg, letterSpacing: -0.3, textAlign: 'center' }}>Visita finalizada</Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 15, lineHeight: 22, color: c.fg2, textAlign: 'center', marginTop: 8 }}>
          Buen trabajo{done && total ? ` · ${done} de ${total} ítems` : ''}. Se registró y se sincroniza solo.
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 22 }}>
          {['#E03A3A', '#F26A21', '#E0A03A'].map((col) => (
            <View key={col} style={{ width: 34, height: 7, borderRadius: 4, backgroundColor: col }} />
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <PrimaryButton label="Volver al inicio" onPress={() => router.dismissAll()} />
      </View>
    </SafeAreaView>
  );
}
