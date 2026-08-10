import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { useSync } from '@/lib/sync/SyncProvider';
import { getAllItems, type OutboxItem } from '@/lib/sync/outbox';
import { tint } from '@/theme/color';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

const ENTITY_LABELS: Record<string, string> = {
  field_visits: 'Visita',
  asset_events: 'Novedad de equipo',
};
const ENTITY_ICONS: Record<string, IconName> = {
  field_visits: 'layers',
  asset_events: 'box',
};
const OP_LABELS: Record<string, string> = {
  set_status: 'Cambio de estado',
  insert: 'Registro nuevo',
};
const PENDING_COLOR = '#B87A1E';
const FAILED_COLOR = '#C43333';

export default function SyncEstado() {
  const c = useThemeColors();
  const { syncing, retryFailed } = useSync();
  const [items, setItems] = useState<OutboxItem[] | null>(null);

  const load = useCallback(() => {
    getAllItems()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const failedCount = items?.filter((it) => it.status === 'failed').length ?? 0;

  function handleRetry() {
    retryFailed();
    setTimeout(load, 400);
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 17, color: c.fg }}>Estado sin señal</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {items === null ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={c.fg3} />
        ) : items.length === 0 ? (
          <EmptyState c={c} />
        ) : (
          <>
            <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: c.fg2, marginBottom: 14 }}>
              {syncing
                ? 'Sincronizando…'
                : `${items.length} cambio${items.length > 1 ? 's' : ''} guardado${items.length > 1 ? 's' : ''} en el teléfono.`}
            </Text>
            {failedCount > 0 ? (
              <Pressable
                onPress={handleRetry}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: tint(FAILED_COLOR, 0.12),
                  borderRadius: 14,
                  paddingVertical: 13,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: FAILED_COLOR }}>
                  Reintentar {failedCount} fallido{failedCount > 1 ? 's' : ''}
                </Text>
              </Pressable>
            ) : null}
            <View style={{ backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
              {items.map((it, i) => (
                <ItemRow key={it.id} item={it} last={i === items.length - 1} c={c} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ItemRow({ item, last, c }: { item: OutboxItem; last: boolean; c: ReturnType<typeof useThemeColors> }) {
  const failed = item.status === 'failed';
  const color = failed ? FAILED_COLOR : PENDING_COLOR;
  const icon = ENTITY_ICONS[item.entity] ?? 'doc';
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: c.line,
        alignItems: 'flex-start',
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tint(color, 0.14), alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <Icon name={icon} size={18} color={color} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.interSb, fontSize: 13.5, color: c.fg }}>
          {ENTITY_LABELS[item.entity] ?? item.entity} · {OP_LABELS[item.op] ?? item.op}
        </Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 12, color: c.fg2, marginTop: 2 }} numberOfLines={2}>
          {failed ? `Falló · ${item.last_error ?? 'Error desconocido'}` : `Pendiente · ${relTime(item.created_at)}`}
        </Text>
      </View>
      <Text style={{ fontFamily: fonts.interM, fontSize: 10.5, color }}>{failed ? 'FALLÓ' : 'PENDIENTE'}</Text>
    </View>
  );
}

function EmptyState({ c }: { c: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60 }}>
      <Icon name="check" size={40} color={c.fg3} strokeWidth={1.8} />
      <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>Todo sincronizado.</Text>
      <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: c.fg3, textAlign: 'center', marginTop: 4, maxWidth: 240 }}>
        No hay cambios pendientes de subir.
      </Text>
    </View>
  );
}

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}
