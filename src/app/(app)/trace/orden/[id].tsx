import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { fmtShortDate, ORDER_STATUS_LABELS, ORDER_STATUS_TO_KEY } from '@/lib/trace/map';
import type { ItemStatus, StatusHistoryEntry, WorkOrderItem } from '@/lib/trace/types';
import { useOrder } from '@/lib/trace/useTrace';
import { tint } from '@/theme/color';
import { fonts, statusColorFor } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  entregado: 'Entregado',
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function hm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function OrdenDetail() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, stale, refetch } = useOrder(id);
  const order = data?.order ?? null;
  const items = data?.items ?? [];
  const history = data?.history ?? [];
  const sColor = order ? statusColorFor(ORDER_STATUS_TO_KEY[order.status], isDark) : '#8B93A3';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        {order ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 20, backgroundColor: tint(sColor, isDark ? 0.2 : 0.13) }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sColor }} />
            <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: sColor }}>{ORDER_STATUS_LABELS[order.status]}</Text>
          </View>
        ) : (
          <OfflinePill />
        )}
      </View>

      {loading && !order ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.fg3} />
        </View>
      ) : !order ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Icon name="wifiOff" size={40} color={c.fg3} strokeWidth={1.8} />
          <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>
            {error ?? 'No se encontró la orden.'}
          </Text>
          <Text onPress={refetch} style={{ fontFamily: fonts.interSb, fontSize: 14, color: '#F26A21', marginTop: 12 }}>Reintentar</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {stale ? (
            <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginBottom: 12 }}>Mostrando lo guardado · sin conexión</Text>
          ) : null}

          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg, letterSpacing: -0.3 }}>
            {order.order_type} {order.order_number}
          </Text>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg2, marginTop: 3, marginBottom: 18 }}>
            {order.client?.business_name ?? 'Sin cliente'}
          </Text>

          {/* Ficha */}
          <Section title="Datos de la orden" c={c}>
            <Row label="Ingreso" value={fmtDate(order.date_in)} c={c} />
            <Row label="Vencimiento" value={fmtDate(order.date_due)} c={c} />
            <Row label="Moneda" value={order.currency} c={c} />
            <Row label="Total" value={`$${order.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ${order.currency}`} c={c} last={!order.general_notes} />
            {order.general_notes ? <Row label="Notas" value={order.general_notes} c={c} last /> : null}
          </Section>

          {/* Ítems */}
          <Section title={`Ítems · ${items.length}`} c={c}>
            {items.length > 0 ? (
              items.map((it, i) => <ItemRow key={it.id} it={it} c={c} last={i === items.length - 1} />)
            ) : (
              <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, paddingVertical: 4 }}>Sin ítems cargados.</Text>
            )}
          </Section>

          {/* Historial */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg, marginBottom: 12 }}>Historial de estados</Text>
            <Timeline history={history} isDark={isDark} c={c} />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type C = ReturnType<typeof useThemeColors>;

function Section({ title, c, children }: { title: string; c: C; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
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

function ItemRow({ it, c, last }: { it: WorkOrderItem; c: C; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg }}>
          #{it.item_number} · {it.product?.name ?? it.custom_description ?? 'Ítem'}
        </Text>
        <Text style={{ fontFamily: fonts.interM, fontSize: 12.5, color: c.fg3, marginTop: 2 }}>
          {it.quantity} un. · {ITEM_STATUS_LABELS[it.status]}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.interB, fontSize: 14, color: c.fg, fontVariant: ['tabular-nums'] }}>
        ${it.total_price.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
      </Text>
    </View>
  );
}

function Timeline({ history, isDark, c }: { history: StatusHistoryEntry[]; isDark: boolean; c: C }) {
  if (history.length === 0) {
    return <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3 }}>Sin historial todavía.</Text>;
  }
  return (
    <View>
      {history.map((h, i) => {
        const color = statusColorFor(ORDER_STATUS_TO_KEY[h.new_status], isDark);
        return (
          <View key={h.id} style={{ flexDirection: 'row', gap: 13 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: color, borderWidth: 3, borderColor: tint(color, 0.22) }} />
              {i < history.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: c.line }} />}
            </View>
            <View style={{ paddingBottom: 16, flex: 1 }}>
              <Text style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: c.fg }}>{ORDER_STATUS_LABELS[h.new_status]}</Text>
              <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg3, marginTop: 3, fontVariant: ['tabular-nums'] }}>
                {fmtShortDate(h.created_at)} · {hm(h.created_at)}
                {h.changed_by?.full_name ? ` · ${h.changed_by.full_name}` : ''}
              </Text>
              {h.notes ? <Text style={{ fontFamily: fonts.inter, fontSize: 13, lineHeight: 18, color: c.fg2, marginTop: 4 }}>{h.notes}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
