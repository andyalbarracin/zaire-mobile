import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    readCache<Item[]>(`checklist:${id}`).then((saved) => {
      if (saved?.length) setItems(saved);
    });
    readCache<string>(`checklist-notes:${id}`).then((n) => {
      if (n) setNotes(n);
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

  async function finalize() {
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

  function confirmFinalize() {
    Alert.alert(
      'Finalizar visita',
      'Vas a marcar la visita como finalizada. Esta acción no se puede deshacer desde la app (solo desde Zaire Web). ¿Confirmás?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Finalizar', style: 'destructive', onPress: finalize },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, height: 44, marginBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" size={40} onPress={() => router.back()} />
        <Text style={{ fontFamily: fonts.interSb, fontSize: 15, color: c.fg }}>Checklist de trabajo</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <ProgressRing size={72} stroke={9} progress={pct} trackColor={c.surface2} color={brand.navy}>
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
              <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: it.done ? brand.navy : 'transparent', borderWidth: it.done ? 0 : 2, borderColor: c.fg3, alignItems: 'center', justifyContent: 'center' }}>
                {it.done ? <Icon name="check" size={16} color="#fff" strokeWidth={3.2} /> : null}
              </View>
              <Text style={{ flex: 1, fontFamily: fonts.interM, fontSize: 15, color: it.done ? c.fg : c.fg2, textDecorationLine: it.done ? 'line-through' : 'none' }}>{it.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Observaciones */}
        <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginTop: 22, marginBottom: 10 }}>Observaciones</Text>
        <TextInput
          value={notes}
          onChangeText={(t) => {
            setNotes(t);
            void writeCache(`checklist-notes:${id}`, t);
          }}
          placeholder="Notas de la visita (opcional)…"
          placeholderTextColor={c.fg3}
          multiline
          style={{ minHeight: 96, backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.line, padding: 14, fontFamily: fonts.inter, fontSize: 14.5, lineHeight: 20, color: c.fg, textAlignVertical: 'top' }}
        />
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 14, backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line }}>
        <PrimaryButton variant="navy" label="Finalizar visita" iconRight="check" loading={busy} onPress={confirmFinalize} />
      </View>
    </SafeAreaView>
  );
}
