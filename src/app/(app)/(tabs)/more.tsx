import { useScrollToTop } from '@react-navigation/native';
import { router, type Href } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderSurface } from '@/components/FolderSurface';
import { Icon, type IconName } from '@/components/icons/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { useBootstrap } from '@/lib/bootstrap';
import { isBiometricAvailable } from '@/lib/biometrics';
import { useConnectivity } from '@/lib/connectivity';
import { useFontSize } from '@/lib/fontScale';
import { useLock } from '@/lib/lock';
import { MODULE_META, type ModuleId } from '@/lib/modules';
import { ROLE_LABELS } from '@/lib/types';
import { tint } from '@/theme/color';
import { brand, fonts, moduleBrand } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const MODULE_ROUTE: Record<ModuleId, Href> = {
  field: '/field',
  assets: '/assets',
  stock: '/stock',
  trace: '/trace',
  crm: '/',
};

export default function More() {
  const c = useThemeColors();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { signOut } = useAuth();
  const { profile, role, companyName, modules } = useBootstrap();
  const { forceOffline, setForceOffline } = useConnectivity();
  const { size, setSize } = useFontSize();
  const lock = useLock();
  const [bioAvail, setBioAvail] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  useEffect(() => {
    isBiometricAvailable().then(setBioAvail);
  }, []);

  const name = profile?.full_name?.trim() || 'Usuario';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 25, color: c.fg, letterSpacing: -0.3, marginBottom: 18 }}>Más</Text>

        {/* Perfil (datos reales del bootstrap) — toca para editar tus datos personales */}
        <Pressable
          onPress={() => router.navigate('/perfil')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            backgroundColor: c.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: c.line,
            padding: 15,
            marginBottom: 24,
          }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: brand.navy, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 18, color: '#F5F1EA' }}>{initials(profile?.full_name, profile?.email)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg }}>{name}</Text>
            <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: c.fg2, marginTop: 2 }}>
              {ROLE_LABELS[role]} · {companyName}
            </Text>
          </View>
          <Icon name="chevronRight" size={19} color={c.fg3} strokeWidth={2.2} />
        </Pressable>

        {/* Módulos habilitados */}
        <Eyebrow color={c.fg2}>MÓDULOS</Eyebrow>
        {modules.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 26 }}>
            {modules.map((m) => (
              <ModuleTile key={m} module={m} />
            ))}
          </View>
        ) : (
          <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg2, marginBottom: 26 }}>
            No hay módulos habilitados para tu cuenta.
          </Text>
        )}

        {/* Preferencias */}
        <Eyebrow color={c.fg2}>PREFERENCIAS</Eyebrow>
        <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, overflow: 'hidden', marginBottom: 22 }}>
          <PrefRow icon="moon" label="Modo oscuro" divider>
            <Switch value={colorScheme === 'dark'} onValueChange={toggleColorScheme} trackColor={{ true: brand.orange, false: '#CBD0D8' }} />
          </PrefRow>
          <PrefRow icon="textSize" label="Tamaño de texto" divider>
            <View style={{ flexDirection: 'row', gap: 4, backgroundColor: c.surface2, borderRadius: 10, padding: 3 }}>
              <SizePill active={size === 'normal'} onPress={() => setSize('normal')} size={13} colors={c} />
              <SizePill active={size === 'grande'} onPress={() => setSize('grande')} size={17} colors={c} />
            </View>
          </PrefRow>
          <PrefRow icon="wifiOff" label="Modo offline" divider>
            <Switch
              value={forceOffline}
              onValueChange={(v) => {
                setForceOffline(v);
                Alert.alert(
                  v ? 'Modo offline activado' : 'Volviste online',
                  v
                    ? 'Ahora trabajás sin conexión: los cambios se guardan en el teléfono y se sincronizan solos cuando recuperes la señal.'
                    : 'Sincronizamos los cambios pendientes.',
                );
              }}
              trackColor={{ true: brand.orange, false: '#CBD0D8' }}
            />
          </PrefRow>
          {bioAvail ? (
            <PrefRow icon="shieldCheck" label="Bloqueo con biometría" divider>
              <Switch value={lock.enabled} onValueChange={lock.setEnabled} trackColor={{ true: brand.orange, false: '#CBD0D8' }} />
            </PrefRow>
          ) : null}
          <PrefRow icon="wifiOff" label="Ver estado sin señal" onPress={() => Alert.alert('Sin señal', 'La vista de estado offline llega en M1.')}>
            <Icon name="chevronRight" size={18} color={c.fg3} strokeWidth={2.2} />
          </PrefRow>
        </View>

        {/* Cerrar sesión */}
        <PrimaryButton variant="danger" label="Cerrar sesión" iconRight="logout" onPress={() => signOut()} />

        {/* Soporte */}
        <View style={{ marginTop: 26 }}>
          <Pressable
            onPress={() => router.navigate('/soporte')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, paddingVertical: 15 }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.tile, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="doc" size={18} color={c.fg} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg }}>Soporte · Cargar incidencia</Text>
              <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3, marginTop: 1 }}>Reportá un problema con la app</Text>
            </View>
            <Icon name="chevronRight" size={18} color={c.fg3} strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Links legales */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 26 }}>
          <Text onPress={() => router.navigate({ pathname: '/legal', params: { tab: 'privacidad' } })} style={{ fontFamily: fonts.interM, fontSize: 13, color: c.fg2 }}>
            Política de privacidad
          </Text>
          <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: c.fg3 }}>·</Text>
          <Text onPress={() => router.navigate({ pathname: '/legal', params: { tab: 'terminos' } })} style={{ fontFamily: fonts.interM, fontSize: 13, color: c.fg2 }}>
            Términos y condiciones
          </Text>
        </View>

        {/* Copyright */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 14 }}>
          <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3 }}>© 2026</Text>
          <Text onPress={() => Linking.openURL('https://www.zairetech.com/')} style={{ fontFamily: fonts.interSb, fontSize: 12, color: c.fg2 }}>Zaire</Text>
          <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3 }}>· Argentina</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModuleTile({ module }: { module: ModuleId }) {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const meta = MODULE_META[module];
  const accent = module in moduleBrand ? moduleBrand[module as keyof typeof moduleBrand][colorScheme === 'dark' ? 'dark' : 'light'] : c.fg;
  return (
    <Pressable onPress={() => router.navigate(MODULE_ROUTE[module])} style={{ width: '48%' }}>
      <FolderSurface
        radius={16}
        cut={16}
        fill={c.surface}
        border={c.line}
        contentStyle={{ padding: 15, gap: 11 }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: tint(accent, colorScheme === 'dark' ? 0.2 : 0.13), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={meta.icon as IconName} size={22} color={accent} strokeWidth={2} />
        </View>
        <View>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 14.5, color: c.fg }}>{meta.label}</Text>
          <Text style={{ fontFamily: fonts.inter, fontSize: 11.5, color: c.fg2, marginTop: 3 }}>{meta.sub}</Text>
        </View>
      </FolderSurface>
    </Pressable>
  );
}

function Eyebrow({ children, color }: { children: string; color: string }) {
  return <Text style={{ fontFamily: fonts.interSb, fontSize: 12.5, color, letterSpacing: 0.3, marginBottom: 12 }}>{children}</Text>;
}

function PrefRow({
  icon,
  label,
  children,
  divider,
  onPress,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
  divider?: boolean;
  onPress?: () => void;
}) {
  const c = useThemeColors();
  const Row = onPress ? Pressable : View;
  return (
    <Row
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: c.line,
      }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.tile, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={c.fg} strokeWidth={2} />
      </View>
      <Text style={{ flex: 1, fontFamily: fonts.interSb, fontSize: 14, color: c.fg }}>{label}</Text>
      {children}
    </Row>
  );
}

function SizePill({
  active,
  onPress,
  size,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  size: number;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minWidth: 38, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 8, backgroundColor: active ? colors.surface : 'transparent' }}
    >
      <Text style={{ fontFamily: fonts.interB, fontSize: size, textAlign: 'center', color: active ? colors.fg : colors.fg3 }}>Aa</Text>
    </Pressable>
  );
}

function initials(name?: string, email?: string): string {
  const src = (name && name.trim()) || (email ? email.split('@')[0] : '');
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  const two = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (two || src.slice(0, 2) || 'ZM').toUpperCase();
}
