import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FieldMap } from '@/components/field/FieldMap';
import { FolderCard } from '@/components/FolderCard';
import { folderPath } from '@/components/folderShape';
import { Icon } from '@/components/icons/Icon';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { isToday, STATUS_TO_KEY, visitToCard } from '@/lib/field/map';
import type { FieldVisit } from '@/lib/field/types';
import { useMyVisits } from '@/lib/field/useVisits';
import { fonts, statusColorFor } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

export default function Field() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const { visits, loading, error, stale, refetch } = useMyVisits();
  const [tab, setTab] = useState<'hoy' | 'todas'>('hoy');
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const today = useMemo(() => visits.filter((v) => isToday(v.scheduled_at)), [visits]);
  const list = tab === 'hoy' ? today : visits;

  const isDark = colorScheme === 'dark';
  const points = useMemo(
    () =>
      list
        .filter((v) => v.site?.latitude != null && v.site?.longitude != null)
        .map((v) => ({ id: v.id, lat: v.site!.latitude!, lng: v.site!.longitude!, color: statusColorFor(STATUS_TO_KEY[v.status], isDark) })),
    [list, isDark],
  );

  // Si no hay visitas hoy pero sí hay asignadas, mostramos "Todas" automáticamente (una vez).
  const autoSwitched = useRef(false);
  useEffect(() => {
    if (!autoSwitched.current && !loading && today.length === 0 && visits.length > 0) {
      setTab('todas');
      autoSwitched.current = true;
    }
  }, [loading, today.length, visits.length]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 25, color: c.fg, letterSpacing: -0.3 }}>Mis visitas</Text>
          <OfflinePill />
        </View>
        {stale ? (
          <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginBottom: 12 }}>Mostrando lo guardado · sin conexión</Text>
        ) : null}

        {/* Tabs Hoy / Todas */}
        <View style={{ flexDirection: 'row', gap: 6, padding: 4, backgroundColor: c.surface2, borderRadius: 13, marginBottom: 16 }}>
          <SegTab label={`Hoy · ${today.length}`} active={tab === 'hoy'} onPress={() => setTab('hoy')} colors={c} />
          <SegTab label={`Todas · ${visits.length}`} active={tab === 'todas'} onPress={() => setTab('todas')} colors={c} />
        </View>

        {loading ? (
          <Skeletons />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : list.length === 0 ? (
          <EmptyState today={tab === 'hoy'} />
        ) : (
          <>
            {points.length > 0 ? <FieldMap points={points} /> : null}
            <View style={{ gap: 12 }}>
              {list.map((v) => (
                <FolderCard key={v.id} {...visitToCard(v)} onPress={() => openVisit(v)} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function openVisit(v: FieldVisit) {
  router.push({ pathname: '/visit/[id]', params: { id: v.id } });
}

function SegTab({ label, active, onPress, colors }: { label: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <Text
      onPress={onPress}
      style={{
        flex: 1,
        textAlign: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        overflow: 'hidden',
        fontFamily: fonts.interSb,
        fontSize: 13.5,
        color: active ? colors.fg : colors.fg2,
        backgroundColor: active ? colors.surface : 'transparent',
      }}
    >
      {label}
    </Text>
  );
}

function Skeletons() {
  const c = useThemeColors();
  return (
    <View style={{ gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ height: 74, backgroundColor: c.surface, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 13, borderWidth: 1, borderColor: c.line }}>
          <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: c.surface2 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ height: 11, width: '70%', borderRadius: 6, backgroundColor: c.surface2 }} />
            <View style={{ height: 9, width: '45%', borderRadius: 5, backgroundColor: c.surface2 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ today }: { today: boolean }) {
  const c = useThemeColors();
  const W = 104;
  const H = 96;
  return (
    <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 20 }}>
      <View style={{ width: W, height: H, marginBottom: 22 }}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Path d={folderPath(W, H, 20, 22)} fill="none" stroke={c.fg3} strokeWidth={2} strokeDasharray="6 6" />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="layers" size={38} color={c.fg3} strokeWidth={1.8} />
        </View>
      </View>
      <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, textAlign: 'center' }}>
        {today ? 'No tenés visitas hoy' : 'Todavía no tenés visitas'}
      </Text>
      <Text style={{ fontFamily: fonts.inter, fontSize: 14.5, lineHeight: 21, color: c.fg2, textAlign: 'center', marginTop: 8, maxWidth: 260 }}>
        Cuando te asignen visitas van a aparecer acá.
      </Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 20 }}>
      <Icon name="wifiOff" size={40} color={c.fg3} strokeWidth={1.8} />
      <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>{message}</Text>
      <Text onPress={onRetry} style={{ fontFamily: fonts.interSb, fontSize: 14, color: '#F26A21', marginTop: 12 }}>Reintentar</Text>
    </View>
  );
}
