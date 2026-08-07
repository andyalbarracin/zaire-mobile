import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderSurface } from '@/components/FolderSurface';
import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import {
  ASSET_STATUS_LABELS,
  ASSET_STATUS_TO_KEY,
  ASSET_TYPE_LABELS,
  assetIcon,
  CRITICIDAD_LABELS,
  EVENT_TYPE_LABELS,
  healthColor,
} from '@/lib/assets/map';
import { signAssetPhotos } from '@/lib/assets/photos';
import type { AssetEvent, EventType } from '@/lib/assets/types';
import { useAsset } from '@/lib/assets/useAssets';
import { useConnectivity } from '@/lib/connectivity';
import { useTenant } from '@/lib/tenant';
import { tint } from '@/theme/color';
import { fonts, statusColorFor } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

const EVENT_COLOR: Record<EventType, string> = {
  servicio: '#2F6FB4',
  inspeccion: '#2F7D51',
  falla: '#B23B36',
  traslado: '#7A5AA8',
  lectura: '#8B93A3',
  alta: '#2F7D51',
  baja: '#8B93A3',
  garantia: '#B4832E',
  nota: '#8B93A3',
};

export default function AssetDetail() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, stale, refetch } = useAsset(id);
  const { supabase } = useTenant();
  const { isOnline } = useConnectivity();

  const asset = data?.asset ?? null;
  const photoDocs = useMemo(() => (data?.documents ?? []).filter((d) => d.doc_type === 'foto'), [data]);
  const otherDocs = useMemo(() => (data?.documents ?? []).filter((d) => d.doc_type !== 'foto'), [data]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const photoKey = photoDocs.map((d) => d.file_path).join(',');

  // El bucket es privado → firmamos URLs temporales al ver la ficha (no se cachean: expiran).
  useEffect(() => {
    if (!isOnline || photoDocs.length === 0) return;
    let alive = true;
    signAssetPhotos(
      supabase,
      photoDocs.map((d) => d.file_path),
    )
      .then((m) => {
        if (alive) setPhotoUrls(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, isOnline, photoKey]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <OfflinePill />
      </View>

      {loading && !asset ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.fg3} />
        </View>
      ) : !asset ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Icon name="wifiOff" size={40} color={c.fg3} strokeWidth={1.8} />
          <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>
            {error ?? 'No se encontró el equipo.'}
          </Text>
          <Text onPress={refetch} style={{ fontFamily: fonts.interSb, fontSize: 14, color: '#F26A21', marginTop: 12 }}>Reintentar</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {stale ? (
            <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginBottom: 12 }}>Mostrando lo guardado · sin conexión</Text>
          ) : null}

          {/* Resumen */}
          <FolderSurface radius={20} cut={24} gradient={c.hero} border={c.line} contentStyle={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(healthColor(asset.health ?? 100), isDark ? 0.22 : 0.14) }}>
                    <Icon name={assetIcon(asset)} size={24} color={healthColor(asset.health ?? 100)} strokeWidth={2} />
                  </View>
                  <StatusPill status={asset.status} isDark={isDark} />
                </View>
                <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg, letterSpacing: -0.3 }}>{asset.name}</Text>
                {asset.tag ? (
                  <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 2 }}>{asset.tag}</Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'center' }}>
                <ProgressRing size={76} stroke={9} progress={(asset.health ?? 100) / 100} trackColor={c.surface2} color={healthColor(asset.health ?? 100)}>
                  <Text style={{ fontFamily: fonts.ralewayB, fontSize: 19, color: c.fg, fontVariant: ['tabular-nums'] }}>{asset.health ?? 100}</Text>
                </ProgressRing>
                <Text style={{ fontFamily: fonts.interSb, fontSize: 10.5, color: c.fg3, letterSpacing: 0.3, marginTop: 5 }}>SALUD</Text>
              </View>
            </View>
          </FolderSurface>

          {/* CTA: registrar novedad (misma pantalla que el escaneo de QR) */}
          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              label="Registrar novedad"
              iconRight="arrowRight"
              onPress={() => router.push({ pathname: '/asset/[id]/novedad', params: { id: asset.id } })}
            />
          </View>

          {/* Ficha técnica */}
          <Section title="Ficha técnica" c={c}>
            <Row label="Tipo" value={asset.type ? ASSET_TYPE_LABELS[asset.type] : '—'} c={c} />
            <Row label="Marca / Modelo" value={[asset.brand, asset.model].filter(Boolean).join(' ') || '—'} c={c} />
            <Row label="N.º de serie" value={asset.serial ?? '—'} c={c} />
            <Row label="Cliente" value={asset.client?.business_name ?? '—'} c={c} />
            <Row label="Criticidad" value={`${asset.criticidad} · ${CRITICIDAD_LABELS[asset.criticidad] ?? ''}`.trim()} c={c} />
            <Row label="Instalado" value={fmtDate(asset.installed_at)} c={c} />
            <Row label="Garantía hasta" value={fmtDate(asset.warranty_until)} c={c} />
            {asset.expected_life_years ? <Row label="Vida útil" value={`${asset.expected_life_years} años`} c={c} /> : null}
            {asset.address ? <Row label="Ubicación" value={asset.address} c={c} last /> : null}
          </Section>

          {/* Hoja de vida */}
          <Section title={`Hoja de vida${data ? ` · ${data.events.length}` : ''}`} c={c}>
            {data && data.events.length > 0 ? (
              data.events.map((e, i) => <EventRow key={e.id} e={e} c={c} last={i === data.events.length - 1} />)
            ) : (
              <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, paddingVertical: 4 }}>Sin eventos registrados.</Text>
            )}
          </Section>

          {/* Fotos (miniaturas del bucket privado vía signed URL) */}
          {photoDocs.length > 0 ? (
            <View style={{ marginTop: 22 }}>
              <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg, marginBottom: 10 }}>Fotos · {photoDocs.length}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {photoDocs.map((d) => {
                  const url = photoUrls[d.file_path];
                  return (
                    <View key={d.id} style={{ width: 116, height: 116, borderRadius: 14, overflow: 'hidden', backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
                      {url ? (
                        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <Icon name="camera" size={22} color={c.fg3} strokeWidth={1.8} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Documentos (sin fotos) */}
          {otherDocs.length > 0 ? (
            <Section title={`Documentos · ${otherDocs.length}`} c={c}>
              {otherDocs.map((d, i) => (
                <Row
                  key={d.id}
                  label={d.name ?? d.doc_type ?? 'Documento'}
                  value={d.expires_at ? `vence ${fmtDate(d.expires_at)}` : '—'}
                  c={c}
                  last={i === otherDocs.length - 1}
                />
              ))}
            </Section>
          ) : null}

          {/* Componentes */}
          {data && data.components.length > 0 ? (
            <Section title={`Componentes · ${data.components.length}`} c={c}>
              {data.components.map((comp, i) => (
                <Row
                  key={comp.id}
                  label={comp.product?.name ?? comp.name ?? 'Componente'}
                  value={`${comp.qty}${comp.product?.unit ? ` ${comp.product.unit}` : ''}`}
                  c={c}
                  last={i === data.components.length - 1}
                />
              ))}
            </Section>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type C = ReturnType<typeof useThemeColors>;

function StatusPill({ status, isDark }: { status: keyof typeof ASSET_STATUS_LABELS; isDark: boolean }) {
  const color = statusColorFor(ASSET_STATUS_TO_KEY[status], isDark);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: tint(color, isDark ? 0.2 : 0.13) }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontFamily: fonts.interSb, fontSize: 12, letterSpacing: 0.2, color }}>{ASSET_STATUS_LABELS[status]}</Text>
    </View>
  );
}

function Section({ title, c, children }: { title: string; c: C; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg, marginBottom: 10 }}>{title}</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, paddingHorizontal: 15 }}>{children}</View>
    </View>
  );
}

function Row({ label, value, c, last }: { label: string; value: string; c: C; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <Text style={{ fontFamily: fonts.interM, fontSize: 13.5, color: c.fg3 }}>{label}</Text>
      <Text numberOfLines={2} style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg, flex: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

function EventRow({ e, c, last }: { e: AssetEvent; c: C; last?: boolean }) {
  const color = EVENT_COLOR[e.type];
  const meta = [
    e.cost != null ? `$${e.cost.toLocaleString('es-AR')} ${e.currency}` : null,
    e.downtime_hours != null ? `${e.downtime_hours} h parada` : null,
  ].filter(Boolean).join(' · ');
  return (
    <View style={{ flexDirection: 'row', gap: 11, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color, marginTop: 5 }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg }}>{EVENT_TYPE_LABELS[e.type]}</Text>
          <Text style={{ fontFamily: fonts.interM, fontSize: 12, color: c.fg3, fontVariant: ['tabular-nums'] }}>{fmtDate(e.event_date)}</Text>
        </View>
        {e.description ? (
          <Text style={{ fontFamily: fonts.inter, fontSize: 13, lineHeight: 18, color: c.fg2, marginTop: 2 }}>{e.description}</Text>
        ) : null}
        {meta ? (
          <Text style={{ fontFamily: fonts.interM, fontSize: 12, color: c.fg3, marginTop: 3 }}>{meta}</Text>
        ) : null}
      </View>
    </View>
  );
}
