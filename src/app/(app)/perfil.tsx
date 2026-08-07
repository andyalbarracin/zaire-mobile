import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { useBootstrap } from '@/lib/bootstrap';
import { useConnectivity } from '@/lib/connectivity';
import { updateDisplayName } from '@/lib/profile';
import { useTenant } from '@/lib/tenant';
import { ROLE_LABELS } from '@/lib/types';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

export default function Perfil() {
  const c = useThemeColors();
  const { supabase } = useTenant();
  const { session } = useAuth();
  const { isOnline } = useConnectivity();
  const { profile, role, companyName, updateProfileName } = useBootstrap();

  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Falta el nombre', 'Ingresá tu nombre a mostrar.');
      return;
    }
    if (!session?.user?.id) return;
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Editar el perfil necesita conexión.');
      return;
    }
    setSaving(true);
    try {
      await updateDisplayName(supabase, session.user.id, trimmed);
      updateProfileName(trimmed);
      router.back();
    } catch {
      Alert.alert('No se pudo guardar', 'Reintentá en un momento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Mi perfil</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 8, marginBottom: 10, letterSpacing: 0.2 }}>NOMBRE A MOSTRAR</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={c.fg3}
            autoCapitalize="words"
            style={{ height: 50, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, fontFamily: fonts.interM, fontSize: 15, color: c.fg, marginBottom: 24 }}
          />

          <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, paddingHorizontal: 15, marginBottom: 18 }}>
            <InfoRow label="Email" value={profile?.email ?? '—'} c={c} />
            <InfoRow label="Rol" value={ROLE_LABELS[role]} c={c} />
            <InfoRow label="Empresa" value={companyName} c={c} last />
          </View>

          <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, color: c.fg3, marginBottom: 24 }}>
            Tu tipo de operario y sucursal asignada se gestionan desde la administración de tu empresa. El email y el rol no se editan desde la app.
          </Text>

          <PrimaryButton label="Guardar cambios" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, c, last }: { label: string; value: string; c: ReturnType<typeof useThemeColors>; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <Text style={{ fontFamily: fonts.interM, fontSize: 13.5, color: c.fg3 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg2, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}
