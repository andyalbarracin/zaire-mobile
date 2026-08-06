import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons/Icon';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { readCache, writeCache } from '@/lib/cache';
import { useConnectivity } from '@/lib/connectivity';
import { changeStatus } from '@/lib/field/mutations';
import type { FieldVisit } from '@/lib/field/types';
import { useSync } from '@/lib/sync/SyncProvider';
import { useTenant } from '@/lib/tenant';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

interface Item {
  label: string;
  done: boolean;
}
const DEFAULT_ITEMS: Item[] = [
  { label: 'Verificar estado del equipo', done: false },
  { label: 'Registrar lecturas / mediciones', done: false },
  { label: 'Tomar fotos del trabajo', done: false },
  { label: 'Completar el reporte', done: false },
  { label: 'Conformidad del cliente', done: false },
];

export default function Checklist() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { supabase } = useTenant();
  const { isOnline } = useConnectivity();
  const sync = useSync();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    readCache<Item[]>(`checklist:${id}`).then((saved) => {
      if (saved?.length) setItems(saved);
    });
  }, [id]);

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? done / items.length : 0;

  function toggle(idx: number) {
    setItems((prev) => {
      const next = prev.map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
      void writeCache(`checklist:${id}`, next);
      return next;
    });
  }

  async function onFinalize() {
    if (!id) return;
    setBusy(true);
    try {
      const patch = await changeStatus(supabase, isOnline, { id } as FieldVisit, 'finalizada');
      const cachedVisit = await readCache<FieldVisit>(`visit:${id}`);
      if (cachedVisit) void writeCache(`visit:${id}`, { ...cachedVisit, ...patch });
      sync.refresh();
      router.replace({ pathname: '/success', params: { done: String(done), total: String(items.length) } });
    } catch {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, height: 44, marginBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" size={40} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.interSb, fontSize: 15, color: c.fg }}>Checklist de trabajo</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <ProgressRing size={72} stroke={9} progress={pct} trackColor={c.surface2}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 16, color: c.fg, fontVariant: ['tabular-nums'] }}>{done}/{items.length}</Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg }}>Antes de cerrar</Text>
            <Text style={{ fontFamily: fonts.inter, fontSize: 14, color: c.fg2, marginTop: 3 }}>Marcá lo que hiciste en la visita.</Text>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {items.map((it, i) => (
            <Pressable
              key={i}
              onPress={() => toggle(i)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: c.surface, borderRadius: 15, borderWidth: 1, borderColor: c.line, padding: 15 }}
            >
              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: it.done ? brand.orange : 'transparent', borderWidth: it.done ? 0 : 2, borderColor: c.fg3, alignItems: 'center', justifyContent: 'center' }}>
                {it.done ? <Icon name="check" size={16} color="#fff" strokeWidth={3.2} /> : null}
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.interM, fontSize: 15, color: it.done ? c.fg : c.fg2, textDecorationLine: it.done ? 'line-through' : 'none' }}>{it.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line }}>
        <PrimaryButton label="Finalizar visita" iconRight="check" loading={busy} onPress={onFinalize} />
      </View>
    </SafeAreaView>
  );
}
