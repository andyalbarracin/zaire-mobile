import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useBootstrap } from '@/lib/bootstrap';
import { ROLE_LABELS } from '@/lib/types';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

// Destinatario de incidencias. TODO: confirmar/mover al portal de incidencias de zairetech.com.
const SUPPORT_EMAIL = 'soporte@zairetech.com';

export default function Soporte() {
  const c = useThemeColors();
  const { profile, role, companyName } = useBootstrap();
  const [desc, setDesc] = useState('');
  const [shotUri, setShotUri] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function pickShot() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    const uri = res.assets?.[0]?.uri;
    if (res.canceled || !uri) return;
    setShotUri(uri);
  }

  async function send() {
    if (sending) return;
    if (!desc.trim()) {
      Alert.alert('Contanos qué pasó', 'Escribí una breve descripción del problema.');
      return;
    }
    setSending(true);
    try {
      const available = await MailComposer.isAvailableAsync();
      if (!available) {
        Alert.alert('Sin app de correo', `No encontramos una app de email configurada. Escribinos a ${SUPPORT_EMAIL}.`);
        return;
      }
      const appVersion = Constants.expoConfig?.version ?? '1.0.0';
      const body = [
        desc.trim(),
        '',
        '— Datos técnicos —',
        `Usuario: ${profile?.full_name ?? '—'} <${profile?.email ?? '—'}>`,
        `Empresa: ${companyName} · Rol: ${ROLE_LABELS[role]}`,
        `App: Zaire Mobile v${appVersion} · ${Platform.OS} ${Platform.Version}`,
      ].join('\n');
      await MailComposer.composeAsync({
        recipients: [SUPPORT_EMAIL],
        subject: `Incidencia · Zaire Mobile — ${companyName}`,
        body,
        attachments: shotUri ? [shotUri] : [],
      });
      router.back();
    } catch {
      Alert.alert('No se pudo abrir el correo', `Escribinos a ${SUPPORT_EMAIL}.`);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Cargar incidencia</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, color: c.fg2, marginBottom: 20 }}>
            Contanos qué problema tuviste con la app. Se abre tu correo con los datos técnicos ya cargados.
          </Text>

          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>DESCRIPCIÓN</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="¿Qué esperabas que pasara y qué pasó? ¿En qué pantalla?"
            placeholderTextColor={c.fg3}
            multiline
            style={{ minHeight: 120, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, padding: 14, fontFamily: fonts.inter, fontSize: 15, color: c.fg, textAlignVertical: 'top', marginBottom: 20 }}
          />

          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>CAPTURA (OPCIONAL)</Text>
          {shotUri ? (
            <View style={{ marginBottom: 24 }}>
              <Image source={{ uri: shotUri }} style={{ width: '100%', height: 220, borderRadius: 14 }} resizeMode="cover" />
              <Pressable
                onPress={() => setShotUri(null)}
                hitSlop={8}
                style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(5,7,10,0.6)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: fonts.interSb, lineHeight: 17 }}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickShot}
              style={{ height: 52, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.line, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 24 }}
            >
              <Icon name="plus" size={20} color={c.fg2} strokeWidth={2} />
              <Text style={{ fontFamily: fonts.interSb, fontSize: 14.5, color: c.fg2 }}>Adjuntar captura</Text>
            </Pressable>
          )}

          <PrimaryButton label="Enviar incidencia" iconRight="arrowRight" onPress={send} loading={sending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
