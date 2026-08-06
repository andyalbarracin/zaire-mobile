import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useRef } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const isoNavy = require('../../../../assets/brand/iso-navy.png');
const isoWhite = require('../../../../assets/brand/lockup-white.png');

import { FolderCard } from '@/components/FolderCard';
import { FolderSurface } from '@/components/FolderSurface';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useBootstrap } from '@/lib/bootstrap';
import { useConnectivity } from '@/lib/connectivity';
import { isToday, visitToCard } from '@/lib/field/map';
import type { FieldVisit } from '@/lib/field/types';
import { useMyVisits } from '@/lib/field/useVisits';
import { ROLE_LABELS } from '@/lib/types';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

// Semana / puntos siguen siendo de muestra (la gamificación es una slice posterior de M1).
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
const shortDate = (d: Date) => `${DIAS[d.getDay()]} · ${d.getDate()} ${MESES[d.getMonth()]}`;

/** Saludo según el horario (convenciones AR). */
function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}
/** Nombre a mostrar: solo si el perfil tiene un nombre real (no el email). */
function displayName(p: { full_name?: string | null; email?: string | null } | null): string {
  const raw = (p?.full_name ?? '').trim();
  if (!raw || raw.includes('@') || raw === p?.email) return '';
  return raw.split(' ')[0];
}
function workspaceInitial(name: string): string {
  const n = (name || '').trim();
  return (n ? n[0] : 'Z').toUpperCase();
}

export default function Home() {
  const c = useThemeColors();
  const { profile, role, companyName } = useBootstrap();
  const { visits } = useMyVisits();
  const { isOnline } = useConnectivity();
  const { colorScheme } = useColorScheme();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const name = displayName(profile);
  const greeting = `¡${greetingWord()}${name ? `, ${name}` : ''}!`;

  const today = visits.filter((v) => isToday(v.scheduled_at));
  const hasToday = today.length > 0;
  // Si no hay visitas hoy, mostramos las más recientes para que el Home no quede vacío.
  const shown = hasToday ? today : visits.slice(0, 6);
  const total = shown.length;
  const done = shown.filter((v) => v.status === 'finalizada').length;
  const pct = total ? done / total : 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
            <Image source={colorScheme === 'dark' ? isoWhite : isoNavy} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
          </View>
          <Pressable onPress={() => router.navigate('/more')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: isOnline ? '#3EBE6A' : '#8B93A3' }} />
              <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg, maxWidth: 100 }}>{companyName || 'Empresa Z'}</Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <OfflinePill />
            <View style={{ position: 'relative' }}>
              <HeaderIconButton icon="bell" size={46} iconSize={23} onPress={() => {}} />
              <View style={{ position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: brand.orange, borderWidth: 2, borderColor: c.surface }} />
            </View>
          </View>
        </View>

        {/* Saludo + datos reales */}
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 26, color: c.fg, letterSpacing: -0.3 }}>{greeting}</Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 15, color: c.fg2, marginTop: 3 }}>Acá va tu resumen de hoy.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 20 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: brand.navy }} />
          <Text style={{ fontFamily: fonts.interSb, fontSize: 12, color: c.fg3, letterSpacing: 0.2 }}>
            {companyName} · {ROLE_LABELS[role]}
          </Text>
        </View>

        {/* Hero: progreso real del día */}
        <Pressable onPress={() => router.navigate('/field')} style={{ marginBottom: 26 }}>
        <FolderSurface radius={20} cut={24} gradient={c.hero} border={c.line} contentStyle={{ paddingHorizontal: 19, paddingTop: 19, paddingBottom: 17 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, letterSpacing: 0.2 }}>{hasToday ? 'Progreso diario' : 'Tus visitas'}</Text>
            <Text style={{ fontFamily: fonts.interM, fontSize: 11.5, color: c.fg3 }}>{shortDate(new Date())}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ fontFamily: fonts.ralewayXb, fontSize: 46, lineHeight: 46, color: c.fg, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{done}</Text>
                <Text style={{ fontFamily: fonts.interM, fontSize: 15, color: c.fg2, paddingBottom: 5 }}>de {total} visitas</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, marginTop: 14 }}>
                {['#E03A3A', '#F26A21', '#E0A03A'].map((col) => (
                  <View key={col} style={{ width: 34, height: 6, borderRadius: 3, backgroundColor: col }} />
                ))}
              </View>
            </View>
            <ProgressRing size={88} progress={pct} trackColor={c.surface2}>
              <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, fontVariant: ['tabular-nums'] }}>{Math.round(pct * 100)}%</Text>
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
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: w.done ? brand.orange : 'transparent', borderWidth: w.done ? 0 : 1.5, borderColor: c.fg3 }} />
              </View>
            ))}
          </View>
        </FolderSurface>
        </Pressable>

        {/* Visitas de hoy (reales) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 18, color: c.fg }}>{hasToday ? 'Visitas de hoy' : 'Últimas visitas'}</Text>
          <Text onPress={() => router.navigate('/field')} style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2 }}>Ver todas ›</Text>
        </View>
        {shown.length === 0 ? (
          <Text style={{ fontFamily: fonts.inter, fontSize: 14, color: c.fg2 }}>Todavía no tenés visitas.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {shown.slice(0, 5).map((v) => (
              <FolderCard key={v.id} {...visitToCard(v)} onPress={() => openVisit(v)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function openVisit(v: FieldVisit) {
  router.push({ pathname: '/visit/[id]', params: { id: v.id } });
}
