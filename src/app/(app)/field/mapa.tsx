import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderCard } from '@/components/FolderCard';
import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { regionForPoints } from '@/lib/field/geo';
import { isToday, STATUS_TO_KEY, visitToCard } from '@/lib/field/map';
import { useMyVisits } from '@/lib/field/useVisits';
import { brand, fonts, statusColorFor } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

type RangeFilter = 'hoy' | 'semana' | 'historico';
const RANGE_LABEL: Record<RangeFilter, string> = { hoy: 'Hoy', semana: 'Semana', historico: 'Histórico' };

/** Lunes 00:00 de la semana de `d` (mismo criterio que el Home). */
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

/**
 * Mapa de Field a pantalla completa (antes vivía inline en la lista). Filtros por rango de
 * fecha (hoy/semana/histórico) y por cliente. Debajo del mapa, tira horizontal de FolderCard
 * de las visitas filtradas — más confiable que depender del tap sobre el pin en todas las
 * plataformas (los callouts de Marker se comportan distinto en iOS vs Android).
 */
export default function FieldMapa() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { visits, loading } = useMyVisits();
  const [range, setRange] = useState<RangeFilter>('semana');
  const [clientId, setClientId] = useState<string | null>(null);

  const clients = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of visits) {
      if (v.client?.id && v.client.business_name) map.set(v.client.id, v.client.business_name);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [visits]);

  const byRange = useMemo(() => {
    if (range === 'historico') return visits;
    if (range === 'hoy') return visits.filter((v) => isToday(v.scheduled_at));
    const start = startOfWeek(new Date());
    const end = new Date(start.getTime() + 7 * 86_400_000);
    return visits.filter((v) => v.scheduled_at && new Date(v.scheduled_at) >= start && new Date(v.scheduled_at) < end);
  }, [visits, range]);

  const filtered = useMemo(
    () => (clientId ? byRange.filter((v) => v.client?.id === clientId) : byRange),
    [byRange, clientId],
  );
  const withCoords = useMemo(() => filtered.filter((v) => v.site?.latitude != null && v.site?.longitude != null), [filtered]);

  const points = useMemo(
    () =>
      withCoords.map((v) => ({
        id: v.id,
        lat: v.site!.latitude!,
        lng: v.site!.longitude!,
        color: statusColorFor(STATUS_TO_KEY[v.status], isDark),
      })),
    [withCoords, isDark],
  );
  const region = points.length > 0 ? regionForPoints(points) : undefined;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Mapa · Field</Text>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}>
        {(['hoy', 'semana', 'historico'] as RangeFilter[]).map((r) => (
          <FilterChip key={r} label={RANGE_LABEL[r]} active={range === r} onPress={() => setRange(r)} c={c} />
        ))}
        <View style={{ width: 1, backgroundColor: c.line, marginHorizontal: 4 }} />
        <FilterChip label="Todos los clientes" active={!clientId} onPress={() => setClientId(null)} c={c} />
        {clients.map((cl) => (
          <FilterChip key={cl.id} label={cl.name} active={clientId === cl.id} onPress={() => setClientId(cl.id)} c={c} />
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {!loading && points.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <Icon name="pin" size={40} color={c.fg3} strokeWidth={1.8} />
            <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>
              Sin visitas con ubicación para este filtro.
            </Text>
          </View>
        ) : (
          <MapView style={StyleSheet.absoluteFill} region={region} showsUserLocation showsMyLocationButton={false}>
            {points.map((p) => (
              <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor={p.color} onPress={() => openVisit(p.id)} />
            ))}
          </MapView>
        )}
      </View>

      {/* Lista de las visitas filtradas — tap confiable en cualquier plataforma */}
      {withCoords.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}
          style={{ maxHeight: 96, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.bg }}
        >
          {withCoords.map((v) => (
            <Pressable key={v.id} onPress={() => openVisit(v.id)} style={{ width: 220 }}>
              <FolderCard {...visitToCard(v)} chevron={false} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function openVisit(id: string) {
  router.push({ pathname: '/visit/[id]', params: { id } });
}

function FilterChip({ label, active, onPress, c }: { label: string; active: boolean; onPress: () => void; c: ReturnType<typeof useThemeColors> }) {
  return (
    <Text
      onPress={onPress}
      style={{
        fontFamily: fonts.interSb,
        fontSize: 13,
        color: active ? c.onPrimary : c.fg2,
        backgroundColor: active ? brand.orange : c.surface,
        borderWidth: 1,
        borderColor: active ? brand.orange : c.line,
        paddingVertical: 8,
        paddingHorizontal: 13,
        borderRadius: 11,
        overflow: 'hidden',
      }}
    >
      {label}
    </Text>
  );
}
