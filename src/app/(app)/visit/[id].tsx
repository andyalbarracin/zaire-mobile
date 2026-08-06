import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DummyMap } from '@/components/field/DummyMap';
import { FolderSurface } from '@/components/FolderSurface';
import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { STATUS_TO_KEY } from '@/lib/field/map';
import type { FieldVisit, VisitPurpose } from '@/lib/field/types';
import { useVisit } from '@/lib/field/useVisits';
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

function hm(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function VisitDetail() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { visit, loading, error } = useVisit(id);

  const s = visit ? STATUS[STATUS_TO_KEY[visit.status]] : STATUS.none;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 44, marginBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" size={40} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.interSb, fontSize: 15, color: c.fg }}>Detalle de visita</Text>
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
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
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

            {/* Mapa dummy */}
            <DummyMap radiusM={visit.site?.geofence_radius_m} />

            {/* Actividad */}
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 18, marginBottom: 13 }}>Actividad</Text>
            <Timeline visit={visit} />
          </ScrollView>

          {/* CTA fija abajo */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line }}>
            <PrimaryButton
              label="Marcar en sitio"
              iconRight="pin"
              onPress={() => Alert.alert('Próximamente', 'El cambio de estado (arribo, reporte) llega en la próxima etapa de M1.')}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function siteAddress(v: FieldVisit): string {
  const parts = [v.site?.city, v.site?.province].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Sin dirección';
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
