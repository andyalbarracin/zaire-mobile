import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DummyMap } from '@/components/field/DummyMap';
import { VisitMap } from '@/components/field/VisitMap';
import { FolderSurface } from '@/components/FolderSurface';
import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { writeCache } from '@/lib/cache';
import { useConnectivity } from '@/lib/connectivity';
import { distanceMeters, formatDistance } from '@/lib/field/geo';
import { STATUS_TO_KEY } from '@/lib/field/map';
import { changeStatus } from '@/lib/field/mutations';
import { getPhotos, uploadPhoto, type VisitPhoto } from '@/lib/field/photos';
import type { FieldVisit, VisitPurpose, VisitStatus } from '@/lib/field/types';
import { useVisit } from '@/lib/field/useVisits';
import { useSync } from '@/lib/sync/SyncProvider';
import { useTenant } from '@/lib/tenant';
import { tint } from '@/theme/color';
import { brand, fonts, status as STATUS } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const PURPOSE_LABELS: Record<VisitPurpose, string> = {
  relevamiento: 'Relevamiento',
  reparacion: 'Reparación',
  entrega: 'Entrega',
  visita_comercial: 'Visita comercial',
  mantenimiento: 'Mantenimiento',
  otro: 'Otro',
};

// Siguiente acción según el estado actual (transiciones soportadas en esta slice).
const NEXT_ACTION: Partial<Record<VisitStatus, { label: string; next: VisitStatus }>> = {
  planificada: { label: 'Marcar en sitio', next: 'en_sitio' },
  en_curso: { label: 'Marcar en sitio', next: 'en_sitio' },
  en_sitio: { label: 'Finalizar visita', next: 'finalizada' },
};

function hm(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function VisitDetail() {
  const c = useThemeColors();
  const { supabase } = useTenant();
  const { isOnline } = useConnectivity();
  const sync = useSync();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { visit, loading, error, setVisit } = useVisit(id);

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [perm, setPerm] = useState<Location.PermissionStatus | null>(null);
  const [marking, setMarking] = useState(false);
  const [photos, setPhotos] = useState<VisitPhoto[]>([]);
  const [addingPhoto, setAddingPhoto] = useState(false);

  // Ubicación en vivo (foreground). El arribo automático con app cerrada (background) es dev build.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPerm(status);
      if (status !== Location.PermissionStatus.GRANTED) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
        (loc) => setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
      );
    })();
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (id && isOnline) getPhotos(supabase, id).then(setPhotos).catch(() => {});
  }, [id, isOnline, supabase]);

  const s = visit ? STATUS[STATUS_TO_KEY[visit.status]] : STATUS.none;
  const site = visit?.site;
  const hasCoords = site?.latitude != null && site?.longitude != null;
  const radius = site?.geofence_radius_m ?? 150;
  const dist = userLoc && hasCoords ? distanceMeters(userLoc.lat, userLoc.lng, site!.latitude!, site!.longitude!) : null;
  const inside = dist != null && dist <= radius;
  const action = visit ? NEXT_ACTION[visit.status] : undefined;

  async function onAdvance() {
    if (!id || !visit || !action) return;
    setMarking(true);
    try {
      const patch = await changeStatus(supabase, isOnline, visit, action.next);
      const updated = { ...visit, ...patch } as FieldVisit;
      setVisit(updated);
      void writeCache(`visit:${id}`, updated);
      sync.refresh();
      if (!isOnline) Alert.alert('Guardado sin conexión', 'Se sincroniza solo cuando vuelva la señal.');
    } catch {
      Alert.alert('Error', 'No pudimos guardar el cambio. Probá de nuevo.');
    } finally {
      setMarking(false);
    }
  }

  async function onAddPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso', 'Necesitamos la cámara para tomar la foto.');
      return;
    }
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Las fotos necesitan conexión por ahora.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 });
    const b64 = res.assets?.[0]?.base64;
    if (res.canceled || !b64 || !id) return;
    setAddingPhoto(true);
    try {
      const p = await uploadPhoto(supabase, id, b64);
      setPhotos((prev) => [p, ...prev]);
    } catch {
      Alert.alert('Error', 'No pudimos subir la foto.');
    } finally {
      setAddingPhoto(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 44, marginBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" size={40} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Detalle de visita</Text>
        {visit ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 20, backgroundColor: tint(s.color, 0.13) }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.color }} />
            <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: s.color }}>{s.label}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={brand.orange} />
        </View>
      ) : error || !visit ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }}>
          <Icon name="wifiOff" size={40} color={c.fg3} strokeWidth={1.8} />
          <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>
            {error ?? 'No encontramos esta visita.'}
          </Text>
          <Text onPress={() => router.back()} style={{ fontFamily: fonts.interSb, fontSize: 14, color: brand.orange, marginTop: 12 }}>Volver</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {/* Card empresa / sitio */}
            <FolderSurface radius={20} cut={24} fill={c.surface} border={c.line} style={{ marginBottom: 18 }} contentStyle={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', gap: 13, alignItems: 'flex-start' }}>
                <View style={{ width: 48, height: 48, borderRadius: 13, backgroundColor: tint(s.color, 0.13), alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="gauge" size={24} color={s.color} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.ralewayB, fontSize: 19, lineHeight: 24, color: c.fg }}>{visit.client?.business_name || 'Sin cliente'}</Text>
                  <Text style={{ fontFamily: fonts.interM, fontSize: 14, color: c.fg2, marginTop: 3 }}>{visit.site?.name || 'Sin sitio'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 5, marginVertical: 15 }}>
                {['#E03A3A', '#F26A21', '#E0A03A'].map((col) => (
                  <View key={col} style={{ width: 30, height: 5, borderRadius: 3, backgroundColor: col }} />
                ))}
              </View>
              <InfoRow icon="doc" colors={c}>
                Visita <Text style={{ color: c.fg, fontFamily: fonts.interSb }}>#{visit.visit_number || '—'}</Text>
                {visit.purpose ? ` · ${PURPOSE_LABELS[visit.purpose]}` : ''}
              </InfoRow>
              <InfoRow icon="pin" colors={c}>{siteAddress(visit)}</InfoRow>
            </FolderSurface>

            {/* Mapa real (o dummy si el sitio no tiene coords) */}
            {hasCoords ? (
              <VisitMap latitude={site!.latitude!} longitude={site!.longitude!} radiusM={radius} />
            ) : (
              <DummyMap radiusM={radius} />
            )}

            {/* Estado de geocerca */}
            <View style={{ marginTop: 12 }}>
              {!hasCoords ? (
                <GeoNote color={c.fg3} icon="pin">Este sitio no tiene ubicación cargada.</GeoNote>
              ) : perm === Location.PermissionStatus.DENIED ? (
                <GeoNote color={c.fg3} icon="pin">Activá el permiso de ubicación para ver tu distancia al sitio.</GeoNote>
              ) : dist == null ? (
                <GeoNote color={c.fg3} icon="pin">Obteniendo tu ubicación…</GeoNote>
              ) : inside ? (
                <GeoNote color="#3EBE6A" icon="check">Estás en el área de trabajo.</GeoNote>
              ) : (
                <GeoNote color={c.fg2} icon="pin">Estás a {formatDistance(dist)} del sitio.</GeoNote>
              )}
            </View>

            {/* Fotos */}
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 18, marginBottom: 12 }}>Fotos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <Pressable onPress={onAddPhoto} style={{ width: 84, height: 84, borderRadius: 14, borderWidth: 2, borderColor: c.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface }}>
                {addingPhoto ? <ActivityIndicator color={brand.orange} /> : <Icon name="camera" size={26} color={c.fg3} strokeWidth={2} />}
              </Pressable>
              {photos.map((p) => (
                <Image key={p.id} source={{ uri: p.url }} style={{ width: 84, height: 84, borderRadius: 14, backgroundColor: c.surface2 }} />
              ))}
            </ScrollView>

            {/* Actividad */}
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 18, marginBottom: 13 }}>Actividad</Text>
            <Timeline visit={visit} />

            {/* Acción de la visita */}
            <View style={{ marginTop: 28 }}>
              {action ? (
                <>
                  <PrimaryButton
                    label={inside && action.next === 'en_sitio' ? 'Confirmar arribo' : action.label}
                    iconRight={action.next === 'en_sitio' ? 'pin' : 'check'}
                    loading={marking}
                    variant={action.next === 'finalizada' ? 'orange' : 'outline'}
                    onPress={action.next === 'finalizada' ? () => router.push({ pathname: '/checklist/[id]', params: { id: id! } }) : onAdvance}
                  />
                  {action.next === 'en_sitio' ? (
                    <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3, textAlign: 'center', marginTop: 9 }}>
                      Acción temporal · más adelante lo hará la geocerca automáticamente.
                    </Text>
                  ) : null}
                </>
              ) : (
                <View style={{ height: 54, borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
                  <Icon name="check" size={18} color={s.color} strokeWidth={2.4} />
                  <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg2 }}>Visita {s.label.toLowerCase()}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function siteAddress(v: FieldVisit): string {
  const parts = [v.site?.city, v.site?.province].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Sin dirección';
}

function GeoNote({ children, color, icon }: { children: React.ReactNode; color: string; icon: 'pin' | 'check' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={16} color={color} strokeWidth={2.2} />
      <Text style={{ fontFamily: fonts.interM, fontSize: 13.5, color }}>{children}</Text>
    </View>
  );
}

function InfoRow({ icon, children, colors }: { icon: 'doc' | 'pin'; children: React.ReactNode; colors: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 4 }}>
      <Icon name={icon} size={16} color={colors.fg3} strokeWidth={2} />
      <Text style={{ flex: 1, fontFamily: fonts.interM, fontSize: 13.5, lineHeight: 18, color: colors.fg2 }}>{children}</Text>
    </View>
  );
}

function Timeline({ visit }: { visit: FieldVisit }) {
  const c = useThemeColors();
  const steps = [
    { at: visit.scheduled_at, label: 'Planificada', color: STATUS.planificada.color },
    { at: visit.started_at, label: 'En curso', color: STATUS.encurso.color },
    { at: visit.arrived_at, label: 'En sitio', color: STATUS.ensitio.color },
    { at: visit.departed_at, label: 'Salida', color: c.fg3 },
    { at: visit.ended_at, label: 'Finalizada', color: STATUS.finalizada.color },
  ].filter((x) => x.at);

  if (steps.length === 0) {
    return <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3 }}>Sin actividad todavía.</Text>;
  }

  return (
    <View>
      {steps.map((step, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 13 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: step.color, borderWidth: 3, borderColor: tint(step.color, 0.22) }} />
            {i < steps.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: c.line }} />}
          </View>
          <View style={{ paddingBottom: 16 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: c.fg }}>{step.label}</Text>
            <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3, marginTop: 3, fontVariant: ['tabular-nums'] }}>{hm(step.at)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
