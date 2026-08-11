import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import MapView, { Marker } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { regionForPoints } from '@/lib/field/geo';
import { isToday, STATUS_TO_KEY, visitTime } from '@/lib/field/map';
import type { FieldVisit } from '@/lib/field/types';
import { useMyVisits } from '@/lib/field/useVisits';
import { askPermission } from '@/lib/permissions';
import { brand, fonts, statusColorFor } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const SCREEN_H = Dimensions.get('window').height;
const SHEET_COLLAPSED = 90;
const SHEET_EXPANDED = Math.min(SCREEN_H * 0.6, 520);

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
 * Mapa de Field a pantalla completa (full-bleed, la UI flota encima — patrón tipo AllTrails/
 * Google Maps). Dos capas independientes (checkbox, pueden ir juntas): **Visitas** (un pin por
 * visita, color por estado) y **Clientes** (un pin por sitio único, deduplicado). El filtro de
 * cliente NO va por chips — eso quedaría como un filtro más, acá es una capa de datos.
 */
export default function FieldMapa() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { visits, loading, error } = useMyVisits();
  const mapRef = useRef<MapView>(null);

  const [range, setRange] = useState<RangeFilter>('semana');
  const [showVisitas, setShowVisitas] = useState(true);
  const [showClientes, setShowClientes] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [query, setQuery] = useState('');

  const byRange = useMemo(() => {
    if (range === 'historico') return visits;
    if (range === 'hoy') return visits.filter((v) => isToday(v.scheduled_at));
    const start = startOfWeek(new Date());
    const end = new Date(start.getTime() + 7 * 86_400_000);
    return visits.filter((v) => v.scheduled_at && new Date(v.scheduled_at) >= start && new Date(v.scheduled_at) < end);
  }, [visits, range]);

  const withCoords = useMemo(() => byRange.filter((v) => v.site?.latitude != null && v.site?.longitude != null), [byRange]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return withCoords;
    return withCoords.filter((v) => [v.client?.business_name, v.site?.name].some((f) => (f ?? '').toLowerCase().includes(q)));
  }, [withCoords, query]);

  const visitPins = useMemo(
    () => searched.map((v) => ({ id: v.id, lat: v.site!.latitude!, lng: v.site!.longitude!, color: statusColorFor(STATUS_TO_KEY[v.status], isDark) })),
    [searched, isDark],
  );
  const clientPins = useMemo(() => {
    const seen = new Map<string, { id: string; lat: number; lng: number; label: string }>();
    for (const v of searched) {
      const key = v.site?.id ?? `${v.site!.latitude},${v.site!.longitude}`;
      if (!seen.has(key)) {
        seen.set(key, { id: key, lat: v.site!.latitude!, lng: v.site!.longitude!, label: v.client?.business_name ?? v.site?.name ?? 'Cliente' });
      }
    }
    return [...seen.values()];
  }, [searched]);

  const allPoints = useMemo(
    () => [...(showVisitas ? visitPins : []), ...(showClientes ? clientPins : [])],
    [showVisitas, showClientes, visitPins, clientPins],
  );
  const region = allPoints.length > 0 ? regionForPoints(allPoints) : undefined;

  async function recenter() {
    const granted = await askPermission(
      {
        title: 'Ubicación',
        message: 'Usamos tu ubicación para centrar el mapa donde estás. ¿Activar ubicación?',
        deniedMessage: 'Activá el permiso de ubicación para centrar el mapa donde estás.',
      },
      () => Location.getForegroundPermissionsAsync(),
      () => Location.requestForegroundPermissionsAsync(),
    );
    if (!granted) return;
    const loc = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      350,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Mapa full-bleed (debajo de todo, incluso del status bar) */}
      {!loading && allPoints.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Icon name={error ? 'wifiOff' : 'pin'} size={40} color={c.fg3} strokeWidth={1.8} />
          <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>
            {error ? 'No pudimos cargar las visitas.' : 'Sin visitas con ubicación para este filtro.'}
          </Text>
        </View>
      ) : (
        <MapView ref={mapRef} style={StyleSheet.absoluteFill} region={region} showsUserLocation showsMyLocationButton={false}>
          {showVisitas
            ? visitPins.map((p) => (
                <Marker key={`v-${p.id}`} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor={p.color} onPress={() => openVisit(p.id)} />
              ))
            : null}
          {showClientes
            ? clientPins.map((p) => (
                <Marker key={`c-${p.id}`} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor={brand.navy} title={p.label} />
              ))
            : null}
        </MapView>
      )}

      {/* Overlay superior: volver + buscador + capas, flota sobre el mapa */}
      <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 6 }}>
          <FloatCircleButton icon="chevronLeft" onPress={() => router.back()} isDark={isDark} accessibilityLabel="Volver" />
          <FloatSearchBox value={query} onChange={setQuery} isDark={isDark} />
          <FloatCircleButton
            icon="grid"
            onPress={() => setLayersOpen((v) => !v)}
            isDark={isDark}
            active={layersOpen}
            accessibilityLabel="Capas del mapa"
            accessibilityState={{ expanded: layersOpen }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 10 }}>
          {(['hoy', 'semana', 'historico'] as RangeFilter[]).map((r) => (
            <FloatPill key={r} label={RANGE_LABEL[r]} active={range === r} onPress={() => setRange(r)} isDark={isDark} />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Backdrop invisible: cierra el panel de capas al tocar afuera (no solo re-tocando el ícono) */}
      {layersOpen ? (
        <Pressable onPress={() => setLayersOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15 }} />
      ) : null}

      {/* Panel de capas — se expande, no es modal */}
      {layersOpen ? (
        <View
          style={{
            position: 'absolute',
            top: 116,
            right: 16,
            width: 190,
            borderRadius: 16,
            overflow: 'hidden',
            zIndex: 20,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(22,34,58,0.10)',
            shadowColor: '#0E1626',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
          }}
        >
          <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={{ paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 10.5, color: c.fg3, letterSpacing: 0.4, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 }}>
              CAPAS
            </Text>
            <LayerRow label="Visitas" checked={showVisitas} onPress={() => setShowVisitas((v) => !v)} color={brand.orange} c={c} />
            <LayerRow label="Clientes" checked={showClientes} onPress={() => setShowClientes((v) => !v)} color={brand.navy} c={c} />
          </BlurView>
        </View>
      ) : null}

      {/* Recentrar en mi ubicación */}
      <Pressable
        onPress={recenter}
        accessibilityRole="button"
        accessibilityLabel="Centrar en mi ubicación"
        style={{ position: 'absolute', bottom: withCoords.length > 0 ? 168 : 32, left: 16, zIndex: 10, width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}
      >
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="pin" size={19} color={isDark ? '#fff' : '#16223A'} strokeWidth={2.2} />
        </BlurView>
      </Pressable>

      {/* Hoja inferior flotante: colapsada muestra el conteo, arrastrando hacia arriba (o
          tocando el handle) se expande y muestra el listado vertical completo. */}
      {withCoords.length > 0 ? <VisitsSheet visits={searched} c={c} /> : null}
    </View>
  );
}

function openVisit(id: string) {
  router.push({ pathname: '/visit/[id]', params: { id } });
}

/**
 * Hoja inferior vertical, arrastrable (Reanimated): colapsada muestra solo el handle + conteo;
 * arrastrando el handle hacia arriba (o tocándolo) se expande y aparece el listado. El gesto vive
 * SOLO en el handle — la lista de abajo scrollea normal, sin competir por el gesto.
 */
function VisitsSheet({ visits, c }: { visits: FieldVisit[]; c: ReturnType<typeof useThemeColors> }) {
  const height = useSharedValue(SHEET_COLLAPSED);
  const startHeight = useSharedValue(SHEET_COLLAPSED);
  const MID = (SHEET_COLLAPSED + SHEET_EXPANDED) / 2;

  function toggle() {
    const next = height.value > MID ? SHEET_COLLAPSED : SHEET_EXPANDED;
    height.value = withSpring(next, { damping: 24, stiffness: 260 });
  }

  const pan = Gesture.Pan()
    .onStart(() => {
      startHeight.value = height.value;
    })
    .onUpdate((e) => {
      const next = startHeight.value - e.translationY;
      height.value = Math.max(SHEET_COLLAPSED, Math.min(SHEET_EXPANDED, next));
    })
    .onEnd((e) => {
      const shouldExpand = height.value > MID || e.velocityY < -500;
      height.value = withSpring(shouldExpand ? SHEET_EXPANDED : SHEET_COLLAPSED, { damping: 24, stiffness: 260 });
    });

  const sheetStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 }} pointerEvents="box-none">
      <Animated.View
        style={[
          {
            backgroundColor: c.surface,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            borderWidth: 1,
            borderColor: c.line,
            overflow: 'hidden',
            shadowColor: '#0E1626',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.12,
            shadowRadius: 18,
          },
          sheetStyle,
        ]}
      >
        <GestureDetector gesture={pan}>
          <Pressable onPress={toggle} style={{ paddingTop: 10, paddingBottom: 8, alignItems: 'center' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 10 }} />
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2 }}>
              {visits.length} {visits.length === 1 ? 'visita' : 'visitas'}
            </Text>
          </Pressable>
        </GestureDetector>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {visits.map((v, i) => (
            <VisitRow key={v.id} v={v} last={i === visits.length - 1} c={c} />
          ))}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function VisitRow({ v, last, c }: { v: FieldVisit; last: boolean; c: ReturnType<typeof useThemeColors> }) {
  return (
    <Pressable
      onPress={() => openVisit(v.id)}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}
    >
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: c.fg }}>{v.client?.business_name || 'Sin cliente'}</Text>
        <Text numberOfLines={1} style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg2, marginTop: 1 }}>
          {v.site?.name || 'Sin sitio'}{v.scheduled_at ? ` · ${visitTime(v)}` : ''}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.interSb, fontSize: 12.5, color: brand.orange }}>Ver más ›</Text>
    </Pressable>
  );
}

function FloatCircleButton({
  icon,
  onPress,
  isDark,
  active,
  accessibilityLabel,
  accessibilityState,
}: {
  icon: IconName;
  onPress: () => void;
  isDark: boolean;
  active?: boolean;
  accessibilityLabel: string;
  accessibilityState?: { expanded?: boolean };
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden' }}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? 'rgba(242,106,33,0.24)' : undefined }}
      >
        <Icon name={icon} size={20} color={active ? brand.orange : isDark ? '#fff' : '#16223A'} strokeWidth={2.2} />
      </BlurView>
    </Pressable>
  );
}

function FloatSearchBox({ value, onChange, isDark }: { value: string; onChange: (t: string) => void; isDark: boolean }) {
  return (
    <View style={{ flex: 1, height: 44, borderRadius: 22, overflow: 'hidden' }}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }}>
        <Icon name="search" size={17} color={isDark ? 'rgba(255,255,255,0.7)' : '#5A6474'} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Buscar cliente o sitio…"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : '#8B93A3'}
          autoCapitalize="none"
          style={{ flex: 1, fontFamily: fonts.interM, fontSize: 14, color: isDark ? '#fff' : '#16223A', paddingVertical: 0 }}
        />
      </BlurView>
    </View>
  );
}

function FloatPill({ label, active, onPress, isDark }: { label: string; active: boolean; onPress: () => void; isDark: boolean }) {
  if (active) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          height: 36,
          paddingHorizontal: 16,
          borderRadius: 18,
          backgroundColor: brand.orange,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#0E1626',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: '#fff' }}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={{ height: 36, borderRadius: 18, overflow: 'hidden' }}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={{ height: 36, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: isDark ? '#fff' : '#16223A' }}>{label}</Text>
      </BlurView>
    </Pressable>
  );
}

function LayerRow({ label, checked, onPress, color, c }: { label: string; checked: boolean; onPress: () => void; color: string; c: ReturnType<typeof useThemeColors> }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 14 }}
    >
      <View
        style={{
          width: 19,
          height: 19,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? color : c.fg3,
          backgroundColor: checked ? color : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Icon name="check" size={12} color="#fff" strokeWidth={3} /> : null}
      </View>
      <Text style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: c.fg }}>{label}</Text>
    </Pressable>
  );
}
