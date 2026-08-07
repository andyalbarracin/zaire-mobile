import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { assetIcon, EVENT_TYPE_LABELS } from '@/lib/assets/map';
import { registerEvent } from '@/lib/assets/mutations';
import type { EventType } from '@/lib/assets/types';
import { useAsset } from '@/lib/assets/useAssets';
import { useAuth } from '@/lib/auth';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';
import { tint } from '@/theme/color';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

// Tipos de novedad que carga el técnico en campo (los de ciclo de vida —alta/baja/traslado/garantía— van por la web).
const TYPES: EventType[] = ['falla', 'servicio', 'inspeccion', 'lectura', 'nota'];

export default function Novedad() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { supabase } = useTenant();
  const { session } = useAuth();
  const { isOnline } = useConnectivity();
  const { data } = useAsset(id);
  const asset = data?.asset ?? null;

  const [type, setType] = useState<EventType>('falla');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  const [downtime, setDowntime] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await registerEvent(supabase, isOnline, id, session?.user?.id ?? null, {
        type,
        event_date: new Date().toISOString().slice(0, 10),
        description: desc.trim() || null,
        cost: cost.trim() ? Number(cost.replace(',', '.')) : null,
        currency: 'ARS',
        downtime_hours: downtime.trim() ? Number(downtime.replace(',', '.')) : null,
      });
      // Volvemos a la ficha: online se ve el evento nuevo; offline queda encolado (pill de pendientes).
      router.replace({ pathname: '/asset/[id]', params: { id } });
    } catch {
      Alert.alert('No se pudo registrar', 'Reintentá en un momento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <OfflinePill />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 24, color: c.fg, letterSpacing: -0.3, marginBottom: 4 }}>Registrar novedad</Text>

          {/* Equipo destino */}
          {asset ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, marginBottom: 22, padding: 12, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
              <View style={{ width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(brand.orange, 0.13) }}>
                <Icon name={assetIcon(asset)} size={21} color={brand.orange} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 15, color: c.fg }}>{asset.name}</Text>
                {asset.tag ? <Text style={{ fontFamily: fonts.interM, fontSize: 12.5, color: c.fg3 }}>{asset.tag}</Text> : null}
              </View>
            </View>
          ) : (
            <View style={{ height: 22 }} />
          )}

          {/* Tipo */}
          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>TIPO DE NOVEDAD</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {TYPES.map((t) => {
              const active = t === type;
              return (
                <Text
                  key={t}
                  onPress={() => setType(t)}
                  style={{
                    fontFamily: fonts.interSb,
                    fontSize: 13.5,
                    color: active ? c.onPrimary : c.fg2,
                    backgroundColor: active ? brand.orange : c.surface,
                    borderWidth: 1,
                    borderColor: active ? brand.orange : c.line,
                    paddingVertical: 9,
                    paddingHorizontal: 15,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {EVENT_TYPE_LABELS[t]}
                </Text>
              );
            })}
          </View>

          {/* Descripción */}
          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>DESCRIPCIÓN</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="¿Qué pasó? Detalle del servicio, falla o lectura…"
            placeholderTextColor={c.fg3}
            multiline
            style={{ minHeight: 96, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, padding: 14, fontFamily: fonts.inter, fontSize: 15, color: c.fg, textAlignVertical: 'top', marginBottom: 18 }}
          />

          {/* Costo / parada */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <NumField label="COSTO (ARS)" value={cost} onChange={setCost} placeholder="0" c={c} />
            <NumField label="HORAS DE PARADA" value={downtime} onChange={setDowntime} placeholder="0" c={c} />
          </View>

          <PrimaryButton label="Registrar novedad" onPress={save} loading={saving} />
          <Text style={{ fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, color: c.fg3, textAlign: 'center', marginTop: 12 }}>
            La hoja de vida es append-only: esto suma un evento, no modifica los anteriores.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NumField({
  label,
  value,
  onChange,
  placeholder,
  c,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: c.fg3, marginBottom: 8, letterSpacing: 0.2 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9.,]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={c.fg3}
        keyboardType="decimal-pad"
        style={{ height: 48, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, fontFamily: fonts.interM, fontSize: 15, color: c.fg }}
      />
    </View>
  );
}
