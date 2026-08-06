import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderCard, type FolderCardProps } from '@/components/FolderCard';
import { FolderSurface } from '@/components/FolderSurface';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useBootstrap } from '@/lib/bootstrap';
import { ROLE_LABELS } from '@/lib/types';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

// --- Datos de muestra (M0 no tiene módulo Field todavía). Fieles al prototipo. ---
const SAMPLE_VISITS: FolderCardProps[] = [
  { title: 'YPF · Planta La Plata', subtitle: 'Sala de Compresores', status: 'encurso', time: '09:00', icon: 'gauge' },
  { title: 'Pampa Energía', subtitle: 'Subestación Norte', status: 'planificada', time: '11:30', icon: 'bolt' },
  { title: 'Aluar', subtitle: 'Línea de Extrusión', status: 'ensitio', time: '14:00', icon: 'factory' },
];
const WEEK = [
  { d: 'L', done: true },
  { d: 'M', done: true },
  { d: 'M', done: true },
  { d: 'J', done: false },
  { d: 'V', done: false },
  { d: 'S', done: false },
  { d: 'D', done: false },
];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function shortDate(d: Date): string {
  return `${DIAS[d.getDay()]} · ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export default function Home() {
  const c = useThemeColors();
  const router = useRouter();
  const { profile, role, companyName } = useBootstrap();

  const firstName = (profile?.full_name ?? '').trim().split(' ')[0];
  const greeting = `¡Buen día${firstName ? `, ${firstName}` : ''}!`;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <HeaderIconButton icon="menu" onPress={() => router.navigate('/more')} />
          <View style={{ position: 'relative' }}>
            <HeaderIconButton icon="bell" onPress={() => {}} />
            <View
              style={{
                position: 'absolute',
                top: 9,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: brand.orange,
                borderWidth: 2,
                borderColor: c.surface,
              }}
            />
          </View>
        </View>

        {/* Saludo + datos reales (verificación de pipeline) */}
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 26, color: c.fg, letterSpacing: -0.3 }}>{greeting}</Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 15, color: c.fg2, marginTop: 3 }}>Acá va tu resumen de hoy.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 20 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand.orange }} />
          <Text style={{ fontFamily: fonts.interSb, fontSize: 12, color: c.fg3, letterSpacing: 0.2 }}>
            {companyName} · {ROLE_LABELS[role]}
          </Text>
        </View>

        {/* Hero: Progreso diario (datos de muestra) */}
        <FolderSurface
          radius={20}
          cut={24}
          gradient={c.hero}
          border={c.line}
          style={{ marginBottom: 26 }}
          contentStyle={{ paddingHorizontal: 19, paddingTop: 19, paddingBottom: 17 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, letterSpacing: 0.2 }}>Progreso diario</Text>
            <Text style={{ fontFamily: fonts.interM, fontSize: 11.5, color: c.fg3 }}>{shortDate(new Date())}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ fontFamily: fonts.ralewayXb, fontSize: 46, lineHeight: 46, color: c.fg, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>3</Text>
                <Text style={{ fontFamily: fonts.interM, fontSize: 15, color: c.fg2, paddingBottom: 5 }}>de 5 visitas</Text>
              </View>
              <Bars style={{ marginTop: 14 }} />
            </View>
            <ProgressRing size={88} progress={0.6} trackColor={c.surface2}>
              <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, fontVariant: ['tabular-nums'] }}>60%</Text>
            </ProgressRing>
          </View>
          <View style={{ height: 1, backgroundColor: c.line, marginTop: 17, marginBottom: 15 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg }}>Puntos de la semana</Text>
            <Text style={{ fontFamily: fonts.interB, fontSize: 14, color: brand.orange, fontVariant: ['tabular-nums'] }}>206 pts</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {WEEK.map((w, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 7 }}>
                <Text style={{ fontFamily: fonts.interSb, fontSize: 10, letterSpacing: 0.3, color: w.done ? brand.orange : c.fg3 }}>{w.d}</Text>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: w.done ? brand.orange : 'transparent',
                    borderWidth: w.done ? 0 : 1.5,
                    borderColor: c.fg3,
                  }}
                />
              </View>
            ))}
          </View>
        </FolderSurface>

        {/* Visitas de hoy */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 18, color: c.fg }}>Visitas de hoy</Text>
          <Text onPress={() => router.navigate('/field')} style={{ fontFamily: fonts.interSb, fontSize: 13, color: brand.orange }}>
            Ver todas
          </Text>
        </View>
        <View style={{ gap: 12 }}>
          {SAMPLE_VISITS.map((v, i) => (
            <FolderCard key={i} {...v} onPress={() => router.navigate('/field')} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bars({ style }: { style?: object }) {
  return (
    <View style={[{ flexDirection: 'row', gap: 5 }, style]}>
      {['#E03A3A', '#F26A21', '#E0A03A'].map((color) => (
        <View key={color} style={{ width: 34, height: 6, borderRadius: 3, backgroundColor: color }} />
      ))}
    </View>
  );
}
