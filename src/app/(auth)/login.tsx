import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const isoNavy = require('../../../assets/brand/iso-navy.png');
const isoWhite = require('../../../assets/brand/iso-white.png');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
    if (code.trim().length < 6) {
      setError('El código tiene 6 dígitos.');
      return;
    }
    setBusy(true);
    const { error: err } = await verifyOtp(email, code);
    setBusy(false);
    // Si sale bien, onAuthStateChange crea la sesión y el guard redirige solo.
    if (err) setError(mapAuthError(err));
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-bg">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingHorizontal: 26, paddingBottom: 26 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={colorScheme === 'dark' ? isoWhite : isoNavy}
            style={{ height: 30, width: 96, resizeMode: 'contain', marginBottom: 26 }}
          />
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 28, color: c.fg, letterSpacing: -0.3 }}>
            ¡Hola, bienvenido!
          </Text>
          <Text style={{ fontFamily: fonts.inter, fontSize: 15, lineHeight: 21, color: c.fg2, marginTop: 6, marginBottom: 30 }}>
            {step === 'email'
              ? 'Ingresá con tu email. Te enviamos un código de acceso, sin contraseña.'
              : 'Revisá tu correo e ingresá el código de 6 dígitos.'}
          </Text>

          {step === 'email' ? (
            <>
              <FieldLabel color={c.fg}>Email</FieldLabel>
              <InputRow
                icon="mail"
                colors={c}
                placeholder="tu.email@empresa.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                onSubmitEditing={onSendCode}
              />
              <View style={{ height: 20 }} />
              <PrimaryButton label="Enviar código" onPress={onSendCode} loading={busy} iconRight="arrowRight" />
            </>
          ) : (
            <>
              <FieldLabel color={c.fg}>Código</FieldLabel>
              <InputRow
                icon="shieldCheck"
                colors={c}
                placeholder="• • • • • •"
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoFocus
                letterSpacing={6}
                onSubmitEditing={onVerify}
              />
              <View style={{ height: 20 }} />
              <PrimaryButton label="Ingresar" onPress={onVerify} loading={busy} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                <LinkText onPress={onSendCode} disabled={busy}>
                  Reenviar código
                </LinkText>
                <LinkText
                  onPress={() => {
                    setStep('email');
                    setCode('');
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Cambiar email
                </LinkText>
              </View>
            </>
          )}

          {error ? (
            <Text style={{ fontFamily: fonts.interM, fontSize: 13, color: '#E03A3A', marginTop: 16 }}>{error}</Text>
          ) : info ? (
            <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: c.fg2, marginTop: 16 }}>{info}</Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ children, color }: { children: string; color: string }) {
  return <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color, marginBottom: 8 }}>{children}</Text>;
}

function InputRow({
  icon,
  colors,
  letterSpacing,
  ...props
}: {
  icon: 'mail' | 'shieldCheck';
  colors: ReturnType<typeof useThemeColors>;
  letterSpacing?: number;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 54,
        borderRadius: 14,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        paddingHorizontal: 15,
      }}
    >
      <Icon name={icon} size={19} color={colors.fg3} strokeWidth={2} />
      <TextInput
        placeholderTextColor={colors.fg3}
        style={{
          flex: 1,
          fontFamily: fonts.interM,
          fontSize: 15,
          color: colors.fg,
          letterSpacing,
          paddingVertical: 0,
        }}
        {...props}
      />
    </View>
  );
}

function LinkText({
  children,
  onPress,
  disabled,
}: {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8}>
      <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: disabled ? '#B9BDC4' : brand.orange }}>
        {children}
      </Text>
    </Pressable>
  );
}

function mapAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('network') || m.includes('fetch')) return 'Sin conexión — revisá tu señal e intentá de nuevo.';
  if (m.includes('invalid') || m.includes('expired') || m.includes('token')) return 'Código inválido o vencido — probá de nuevo.';
  if (m.includes('rate') || m.includes('limit')) return 'Demasiados intentos. Esperá un momento.';
  return msg;
}
