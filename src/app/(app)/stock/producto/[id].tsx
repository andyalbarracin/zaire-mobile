import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MOVEMENT_TYPE_LABELS, stockLight } from '@/lib/stock/map';
import type { MovementType, StockMovement } from '@/lib/stock/types';
import { useProductStock } from '@/lib/stock/useStock';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

const MOVEMENT_COLOR: Record<MovementType, string> = {
  entrada: '#2F7D51',
  salida: '#B23B36',
  ajuste: '#B4832E',
  transferencia: '#2F6FB4',
  consumo: '#7A5AA8',
};
const LIGHT_RANK: Record<'green' | 'yellow' | 'red', number> = { green: 0, yellow: 1, red: 2 };

export default function ProductoStock() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, stale, refetch } = useProductStock(id);

  const totalOnHand = data ? data.levels.reduce((s, l) => s + l.on_hand, 0) : 0;
  const totalAvailable = data ? data.levels.reduce((s, l) => s + l.available, 0) : 0;
  const totalValue = data ? data.levels.reduce((s, l) => s + l.on_hand * l.avg_cost, 0) : 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <OfflinePill />
      </View>

      {loading && !data ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.fg3} />
        </View>
      ) : !data ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <Icon name="wifiOff" size={40} color={c.fg3} strokeWidth={1.8} />
          <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>
            {error ?? 'No se encontró el producto.'}
          </Text>
          <Text onPress={refetch} style={{ fontFamily: fonts.interSb, fontSize: 14, color: '#F26A21', marginTop: 12 }}>Reintentar</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          {stale ? (
            <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginBottom: 12 }}>Mostrando lo guardado · sin conexión</Text>
          ) : null}

          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg, letterSpacing: -0.3 }}>{data.product.name}</Text>
          {data.product.code ? (
            <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 2, marginBottom: 18 }}>{data.product.code}</Text>
          ) : (
            <View style={{ marginBottom: 18 }} />
          )}

          {/* Resumen */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
            <SummaryTile label="Existencia" value={`${totalOnHand} ${data.product.unit}`} c={c} />
            <SummaryTile label="Disponible" value={`${totalAvailable} ${data.product.unit}`} c={c} />
            <SummaryTile label="Valor" value={`$${totalValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} c={c} />
          </View>

          {/* Por depósito */}
          <Section title={`Por depósito · ${data.levels.length}`} c={c}>
            {data.levels.length > 0 ? (
              data.levels.map((l, i) => (
                <Row
                  key={l.id}
                  label={l.warehouse?.name ?? 'Depósito'}
                  value={`${l.on_hand} ${data.product.unit}`}
                  color={LIGHT_RANK[stockLight(l.on_hand, l.min_qty)] > 0 ? MOVEMENT_COLOR.salida : undefined}
                  c={c}
                  last={i === data.levels.length - 1}
                />
              ))
            ) : (
              <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, paddingVertical: 4 }}>Sin existencias registradas.</Text>
            )}
          </Section>

          {/* Movimientos */}
          <Section title={`Movimientos · ${data.movements.length}`} c={c}>
            {data.movements.length > 0 ? (
              data.movements.map((m, i) => <MovementRow key={m.id} m={m} unit={data.product.unit} c={c} last={i === data.movements.length - 1} />)
            ) : (
              <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, paddingVertical: 4 }}>Sin movimientos registrados.</Text>
            )}
          </Section>

          <View style={{ marginTop: 4 }}>
            <PrimaryButton
              label="Registrar movimiento"
              iconRight="arrowRight"
              onPress={() =>
                router.push({
                  pathname: '/stock/producto/[id]/movimiento',
                  params: { id: data.product.id, name: data.product.name, unit: data.product.unit },
                })
              }
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type C = ReturnType<typeof useThemeColors>;

function SummaryTile({ label, value, c }: { label: string; value: string; c: C }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.line, padding: 13 }}>
      <Text style={{ fontFamily: fonts.interSb, fontSize: 11, color: c.fg3, letterSpacing: 0.2, marginBottom: 4 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg }}>{value}</Text>
    </View>
  );
}

function Section({ title, c, children }: { title: string; c: C; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg, marginBottom: 10 }}>{title}</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, paddingHorizontal: 15 }}>{children}</View>
    </View>
  );
}

function Row({ label, value, color, c, last }: { label: string; value: string; color?: string; c: C; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <Text style={{ fontFamily: fonts.interM, fontSize: 13.5, color: c.fg3 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.interSb, fontSize: 14, color: color ?? c.fg }}>{value}</Text>
    </View>
  );
}

function MovementRow({ m, unit, c, last }: { m: StockMovement; unit: string; c: C; last?: boolean }) {
  const color = MOVEMENT_COLOR[m.type];
  const sign = m.qty > 0 ? '+' : '';
  return (
    <View style={{ flexDirection: 'row', gap: 11, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color, marginTop: 5 }} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg }}>{MOVEMENT_TYPE_LABELS[m.type]}</Text>
          <Text style={{ fontFamily: fonts.interB, fontSize: 14, color, fontVariant: ['tabular-nums'] }}>
            {sign}
            {m.qty} {unit}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.interM, fontSize: 12, color: c.fg3, marginTop: 2 }}>
          {m.warehouse?.name ?? ''} · {fmtDate(m.created_at)}
        </Text>
        {m.notes ? <Text style={{ fontFamily: fonts.inter, fontSize: 13, lineHeight: 18, color: c.fg2, marginTop: 3 }}>{m.notes}</Text> : null}
      </View>
    </View>
  );
}
