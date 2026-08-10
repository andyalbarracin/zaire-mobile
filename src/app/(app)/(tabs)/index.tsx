import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const isoNavy = require('../../../../assets/brand/iso-navy.png');
const isoWhite = require('../../../../assets/brand/lockup-white.png');

import { FolderCard } from '@/components/FolderCard';
import { FolderSurface } from '@/components/FolderSurface';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAssets } from '@/lib/assets/useAssets';
import { useBootstrap } from '@/lib/bootstrap';
import { useConnectivity } from '@/lib/connectivity';
import { isToday, visitToCard } from '@/lib/field/map';
import type { FieldVisit } from '@/lib/field/types';
import { useMyVisits } from '@/lib/field/useVisits';
import { groupByProduct } from '@/lib/stock/map';
import { useStockLevels } from '@/lib/stock/useStock';
import { useOrders } from '@/lib/trace/useTrace';
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

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
/** Lunes 00:00 de la semana de `d`. */
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

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
  const { profile, role, companyName, modules } = useBootstrap();
  const { visits } = useMyVisits();
  const { isOnline } = useConnectivity();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const [notifOpen, setNotifOpen] = useState(false);

  // Mini-dashboard cruzado (reemplaza las barras decorativas cuando hay otros módulos activos):
  // un vistazo rápido de Assets/Stock/Trace sin agregarle altura a la card.
  const { assets } = useAssets();
  const { levels } = useStockLevels();
  const { orders } = useOrders();
  const avgHealth = assets.length > 0 ? Math.round(assets.reduce((s, a) => s + (a.health ?? 100), 0) / assets.length) : null;
  const lowStockCount = useMemo(() => groupByProduct(levels).filter((p) => p.light !== 'green').length, [levels]);
  const openOrdersCount = useMemo(() => orders.filter((o) => o.status !== 'facturada' && o.status !== 'cancelada').length, [orders]);
  const otherModules = useMemo(
    () =>
      [
        modules.includes('assets') ? { id: 'assets' as const, label: 'Salud', value: avgHealth != null ? `${avgHealth}%` : '—' } : null,
        modules.includes('stock') ? { id: 'stock' as const, label: 'Bajo mín.', value: `${lowStockCount}` } : null,
        modules.includes('trace') ? { id: 'trace' as const, label: 'Órdenes', value: `${openOrdersCount}` } : null,
      ].filter((x): x is NonNullable<typeof x> => x !== null),
    [modules, avgHealth, lowStockCount, openOrdersCount],
  );

  const name = displayName(profile);
  const greeting = `¡${greetingWord()}${name ? `, ${name}` : ''}!`;

  const today = visits.filter((v) => isToday(v.scheduled_at));
  const hasToday = today.length > 0;
  // Si no hay visitas hoy, mostramos las más recientes para que el Home no quede vacío.
  const shown = hasToday ? today : visits.slice(0, 6);
  const total = shown.length;
  const done = shown.filter((v) => v.status === 'finalizada').length;
  const pct = total ? done / total : 0;

  // Gamificación: datos reales de la semana (visitas finalizadas por día). Si no hay actividad
  // esta semana, se muestra el ejemplo hasta que existan datos con fechas actuales.
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  const finalizadasWeek = visits.filter((v) => {
    if (v.status !== 'finalizada') return false;
    const iso = v.ended_at ?? v.scheduled_at;
    if (!iso) return false;
    const d = new Date(iso);
    return d >= weekStart && d < weekEnd;
  });
  const realWeek = WEEK_LABELS.map((label, i) => {
    const dayStart = new Date(weekStart.getTime() + i * 86_400_000);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const dayDone = finalizadasWeek.some((v) => {
      const d = new Date((v.ended_at ?? v.scheduled_at) as string);
      return d >= dayStart && d < dayEnd;
    });
    return { d: label, done: dayDone };
  });
  const realPts = finalizadasWeek.length * 25;
  const useReal = realPts > 0;
  const weekData = useReal ? realWeek : WEEK;
  const weekPts = useReal ? realPts : 206;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
            <Image source={colorScheme === 'dark' ? isoWhite : isoNavy} style={{ width: 22, height: 22, resizeMode: 'contain' }} />
          </View>
          {/* maxWidth 42% garantiza que el pill nunca alcance el isologo centrado; el nombre se elide */}
          <Pressable onPress={() => router.navigate('/more')} style={{ maxWidth: '42%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 13, borderRadius: 21, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexShrink: 1 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: isOnline ? '#3EBE6A' : '#8B93A3' }} />
              <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg, flexShrink: 1 }}>{companyName || 'Empresa Z'}</Text>
            </View>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <OfflinePill />
            <View style={{ position: 'relative' }}>
              <HeaderIconButton icon="bell" size={46} iconSize={23} onPress={() => setNotifOpen(true)} />
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
            </View>
            <ProgressRing size={88} progress={pct} trackColor={c.surface2}>
              <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, fontVariant: ['tabular-nums'] }}>{Math.round(pct * 100)}%</Text>
            </ProgressRing>
          </View>
          {/* Mini-dashboard cruzado: datos planos, no clickeables, ancho completo (no comparte
              columna con el anillo — ahí quedaba apretado y se rompía con 3 módulos). */}
          {otherModules.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 22, marginTop: 14 }}>
              {otherModules.map((m) => (
                <View key={m.id}>
                  <Text style={{ fontFamily: fonts.ralewayB, fontSize: 15, color: c.fg, fontVariant: ['tabular-nums'] }}>{m.value}</Text>
                  <Text style={{ fontFamily: fonts.interM, fontSize: 10.5, color: c.fg3, marginTop: 1 }}>{m.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 14 }}>
              {['#E03A3A', '#F26A21', '#E0A03A'].map((col) => (
                <View key={col} style={{ width: 34, height: 6, borderRadius: 3, backgroundColor: col }} />
              ))}
            </View>
          )}
          <View style={{ height: 1, backgroundColor: c.line, marginTop: 17, marginBottom: 15 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg }}>Puntos de la semana</Text>
            <Text style={{ fontFamily: fonts.interB, fontSize: 14, color: brand.orange, fontVariant: ['tabular-nums'] }}>{weekPts} pts</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {weekData.map((w, i) => (
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
      <NotificationsPanel visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
}

function openVisit(v: FieldVisit) {
  router.push({ pathname: '/visit/[id]', params: { id: v.id } });
}
