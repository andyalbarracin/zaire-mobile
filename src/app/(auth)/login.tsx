import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { fonts } from '@/theme/tokens';

const condorBg = require('../../../assets/brand/zaire-condor-login.png');
const wordmarkWhite = require('../../../assets/brand/wordmark-white.png');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Longitud máx del código OTP (Supabase se configura entre 6 y 10; el proyecto DEV usa 8).
const OTP_MAX = 8;
const OTP_MIN = 6;

export default function Login() {
  const { sendOtp, verifyOtp, enableDevBypass } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Recordamos el último email usado para pre-cargarlo (menos fricción al reingresar).
  useEffect(() => {
    SecureStore.getItemAsync('zaire_last_email').then((v) => {
      if (v) setEmail(v);
    });
  }, []);

  async function onSendCode() {
    setError(null);
    setInfo(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Ingresá un email válido.');
      return;
    }
    setBusy(true);
    const { error: err } = await sendOtp(email);
    setBusy(false);
    if (err) {
      setError(mapAuthError(err));
      return;
    }
    setStep('code');
    setInfo(`Te enviamos un código a ${email.trim()}.`);
  }

  async function onVerify() {
    setError(null);
    if (code.trim().length < OTP_MIN) {
      setError('Ingresá el código completo.');
      return;
    }
    setBusy(true);
    const { error: err } = await verifyOtp(email, code);
    setBusy(false);
    // Si sale bien, onAuthStateChange crea la sesión y el guard redirige solo.
    if (err) {
      setError(mapAuthError(err));
      return;
    }
    void SecureStore.setItemAsync('zaire_last_email', email.trim());
  }

  return (
    <ImageBackground source={condorBg} resizeMode="cover" style={styles.bg}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['rgba(11,16,32,0.30)', 'rgba(11,16,32,0.72)', 'rgba(11,16,32,0.95)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo centrado (lockup blanco sobre el fondo oscuro) */}
            <View style={styles.logoArea}>
              <Image source={wordmarkWhite} style={styles.logo} />
            </View>

            {/* Formulario */}
            <View>
              <Text style={styles.title}>{step === 'email' ? 'Iniciá sesión' : 'Verificá tu código'}</Text>
              <Text style={styles.subtitle}>
                {step === 'email'
                  ? 'Ingresá tu email y te enviamos un código de acceso. Sin contraseña.'
                  : `Revisá tu correo e ingresá el código de ${OTP_MAX} dígitos.`}
              </Text>

              {step === 'email' ? (
                <>
                  <GlassInput
                    icon="mail"
                    placeholder="tu.email@empresa.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoFocus
                    onSubmitEditing={onSendCode}
                    returnKeyType="send"
                  />
                  <View style={styles.gap} />
                  <PrimaryButton label="Enviar código" onPress={onSendCode} loading={busy} iconRight="arrowRight" />
                </>
              ) : (
                <>
                  <GlassInput
                    icon="shieldCheck"
                    placeholder="Código de acceso"
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, OTP_MAX))}
                    keyboardType="number-pad"
                    autoFocus
                    letterSpacing={6}
                    maxLength={OTP_MAX}
                    onSubmitEditing={onVerify}
                    returnKeyType="done"
                  />
                  <View style={styles.gap} />
                  <PrimaryButton label="Ingresar" onPress={onVerify} loading={busy} />
                  <View style={styles.secondaryRow}>
                    <GhostButton label="Reenviar código" onPress={onSendCode} disabled={busy} />
                    <GhostButton
                      label="Cambiar email"
                      onPress={() => {
                        setStep('email');
                        setCode('');
                        setError(null);
                        setInfo(null);
                      }}
                    />
                  </View>
                </>
              )}

              {error ? (
                <Text style={styles.error}>{error}</Text>
              ) : info ? (
                <Text style={styles.info}>{info}</Text>
              ) : null}

              {__DEV__ && (
                <View style={styles.devWrap}>
                  <GhostButton label="Entrar sin login · modo dev" onPress={enableDevBypass} />
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.legalRow}>
                <Text onPress={() => router.push({ pathname: '/legal', params: { tab: 'privacidad' } })} style={styles.legalLink}>
                  Política de privacidad
                </Text>
                <Text style={styles.legalDot}>·</Text>
                <Text onPress={() => router.push({ pathname: '/legal', params: { tab: 'terminos' } })} style={styles.legalLink}>
                  Términos de uso
                </Text>
              </View>
              <Text style={styles.copyright}>© 2026 Zaire Technologies · Argentina</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function GlassInput({
  icon,
  letterSpacing,
  ...props
}: {
  icon: IconName;
  letterSpacing?: number;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.input}>
      <Icon name={icon} size={19} color="rgba(255,255,255,0.7)" strokeWidth={2} />
      <TextInput
        placeholderTextColor="rgba(255,255,255,0.5)"
        style={[styles.inputText, letterSpacing ? { letterSpacing } : null]}
        {...props}
      />
    </View>
  );
}

function GhostButton({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.ghost,
        { backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : 'transparent', opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={styles.ghostLabel}>{label}</Text>
    </Pressable>
  );
}

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('network') || m.includes('fetch')) return 'Sin conexión — revisá tu señal e intentá de nuevo.';
  if (m.includes('invalid') || m.includes('expired') || m.includes('token')) return 'Código inválido o vencido — pedí uno nuevo.';
  if (m.includes('rate') || m.includes('limit') || m.includes('too many')) return 'Muchos intentos seguidos. Esperá unos minutos (o usá el modo dev).';
  return msg;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0B1020' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 12, paddingBottom: 8 },
  logoArea: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 224, height: 82, resizeMode: 'contain' },
  title: { fontFamily: fonts.ralewayB, fontSize: 27, color: '#fff', letterSpacing: -0.3, marginBottom: 6 },
  subtitle: { fontFamily: fonts.inter, fontSize: 14.5, lineHeight: 21, color: 'rgba(255,255,255,0.72)', marginBottom: 22 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
  },
  inputText: { flex: 1, fontFamily: fonts.interM, fontSize: 15.5, color: '#fff', paddingVertical: 0 },
  gap: { height: 18 },
  secondaryRow: { flexDirection: 'row', gap: 11, marginTop: 14 },
  ghost: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: { fontFamily: fonts.interSb, fontSize: 13.5, color: '#fff' },
  error: { fontFamily: fonts.interM, fontSize: 13, color: '#FF8A7A', marginTop: 16 },
  info: { fontFamily: fonts.inter, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 16 },
  devWrap: { marginTop: 22, opacity: 0.9 },
  footer: { alignItems: 'center', paddingTop: 18, paddingBottom: 4 },
  copyright: { fontFamily: fonts.inter, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  legalLink: { fontFamily: fonts.interSb, fontSize: 12.5, color: 'rgba(255,255,255,0.82)' },
  legalDot: { fontSize: 12.5, color: 'rgba(255,255,255,0.4)' },
});
