import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ASSET_STATUS_LABELS, ASSET_TYPE_LABELS, CRITICIDAD_LABELS } from '@/lib/assets/map';
import { createAsset } from '@/lib/assets/mutations';
import type { AssetStatus, AssetType } from '@/lib/assets/types';
import { useAuth } from '@/lib/auth';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];
const STATUSES = Object.keys(ASSET_STATUS_LABELS) as AssetStatus[];
const CRITICIDADES = [1, 2, 3, 4, 5];

export default function NuevoAsset() {
  const c = useThemeColors();
  const { supabase } = useTenant();
  const { session } = useAuth();
  const { isOnline } = useConnectivity();

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [type, setType] = useState<AssetType | null>(null);
  const [brandTxt, setBrandTxt] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [status, setStatus] = useState<AssetStatus>('operativo');
  const [criticidad, setCriticidad] = useState(3);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresá al menos el nombre del equipo.');
      return;
    }
    if (!isOnline) {
      Alert.alert('Sin conexión', 'El alta de equipos necesita conexión por ahora.');
      return;
    }
    setSaving(true);
    try {
      const id = await createAsset(supabase, session?.user?.id ?? null, {
        name: name.trim(),
        tag: tag.trim() || null,
        type,
        brand: brandTxt.trim() || null,
        model: model.trim() || null,
        serial: serial.trim() || null,
        status,
        criticidad,
        notes: notes.trim() || null,
      });
      router.replace({ pathname: '/asset/[id]', params: { id } });
    } catch {
      Alert.alert('No se pudo crear', 'Reintentá en un momento.');
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
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 24, color: c.fg, letterSpacing: -0.3, marginBottom: 18 }}>Nuevo equipo</Text>

          <Field label="NOMBRE *" value={name} onChange={setName} placeholder="Ej: Bomba centrífuga #3" c={c} />
          <Field label="TAG / CÓDIGO" value={tag} onChange={setTag} placeholder="Ej: BBA-003" c={c} autoCapitalize="characters" />

          <Label c={c}>TIPO</Label>
          <Chips options={TYPES} value={type} onChange={(t) => setType(t === type ? null : t)} labelOf={(t) => ASSET_TYPE_LABELS[t]} c={c} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="MARCA" value={brandTxt} onChange={setBrandTxt} placeholder="Marca" c={c} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="MODELO" value={model} onChange={setModel} placeholder="Modelo" c={c} />
            </View>
          </View>
          <Field label="N.º DE SERIE" value={serial} onChange={setSerial} placeholder="Serie" c={c} />

          <Label c={c}>ESTADO</Label>
          <Chips options={STATUSES} value={status} onChange={setStatus} labelOf={(s) => ASSET_STATUS_LABELS[s]} c={c} />

          <Label c={c}>CRITICIDAD</Label>
          <Chips options={CRITICIDADES} value={criticidad} onChange={setCriticidad} labelOf={(n) => `${n} · ${CRITICIDAD_LABELS[n]}`} c={c} />

          <Field label="NOTAS" value={notes} onChange={setNotes} placeholder="Observaciones del equipo…" c={c} multiline />

          <View style={{ height: 8 }} />
          <PrimaryButton label="Crear equipo" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type C = ReturnType<typeof useThemeColors>;

function Label({ children, c }: { children: string; c: C }) {
  return <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>{children}</Text>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  c,
  multiline,
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  c: C;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Label c={c}>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.fg3}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={{
          minHeight: multiline ? 88 : 50,
          borderRadius: 13,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.line,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          fontFamily: fonts.interM,
          fontSize: 15,
          color: c.fg,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function Chips<T extends string | number>({
  options,
  value,
  onChange,
  labelOf,
  c,
}: {
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
  c: C;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Text
            key={String(o)}
            onPress={() => onChange(o)}
            style={{
              fontFamily: fonts.interSb,
              fontSize: 13.5,
              color: active ? c.onPrimary : c.fg2,
              backgroundColor: active ? brand.orange : c.surface,
              borderWidth: 1,
              borderColor: active ? brand.orange : c.line,
              paddingVertical: 9,
              paddingHorizontal: 14,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {labelOf(o)}
          </Text>
        );
      })}
    </View>
  );
}
