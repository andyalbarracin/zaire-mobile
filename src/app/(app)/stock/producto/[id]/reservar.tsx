import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { useConnectivity } from '@/lib/connectivity';
import { getWarehouses } from '@/lib/stock/api';
import { mapStockError, reserveStock } from '@/lib/stock/mutations';
import type { Warehouse } from '@/lib/stock/types';
import { useTenant } from '@/lib/tenant';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/** Reservar stock (no descuenta `on_hand`, solo baja el disponible) — Kardex > "Reservar". */
export default function Reservar() {
  const c = useThemeColors();
  const { id, name, unit } = useLocalSearchParams<{ id: string; name?: string; unit?: string }>();
  const { supabase } = useTenant();
  const { session } = useAuth();
  const { isOnline } = useConnectivity();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWarehouses(supabase)
      .then((ws) => {
        setWarehouses(ws);
        setWarehouseId((prev) => prev ?? ws[0]?.id ?? null);
      })
      .catch(() => {});
  }, [supabase]);

  async function save() {
    if (saving) return;
    const n = Number(qty.replace(',', '.'));
    if (!warehouseId) {
      Alert.alert('Falta el depósito', 'Elegí de qué depósito reservar.');
      return;
    }
    if (!n || n <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresá una cantidad mayor a 0.');
      return;
    }
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Reservar stock necesita conexión.');
      return;
    }
    setSaving(true);
    try {
      await reserveStock(supabase, {
        productId: id,
        warehouseId,
        qty: n,
        notes: notes.trim() || null,
        createdBy: session?.user?.id ?? null,
      });
      router.replace({ pathname: '/stock/producto/[id]', params: { id } });
    } catch (e) {
      Alert.alert('No se pudo reservar', mapStockError(e instanceof Error ? e.message : ''));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 }}>
        <HeaderIconButton icon="chevronLeft" iconSize={24} onPress={() => router.back()} />
        <OfflinePill />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 24, color: c.fg, letterSpacing: -0.3, marginBottom: 4 }}>Reservar stock</Text>
          {name ? (
            <Text style={{ fontFamily: fonts.interSb, fontSize: 14, color: c.fg2, marginBottom: 8 }}>{name}</Text>
          ) : (
            <View style={{ marginBottom: 8 }} />
          )}
          <Text style={{ fontFamily: fonts.inter, fontSize: 13, lineHeight: 18, color: c.fg3, marginBottom: 22 }}>
            No descuenta la existencia todavía — solo baja el disponible, para dejarlo apartado.
          </Text>

          {/* Depósito */}
          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>DEPÓSITO</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {warehouses.map((w) => {
              const active = warehouseId === w.id;
              return (
                <Text
                  key={w.id}
                  onPress={() => setWarehouseId(w.id)}
                  style={{
                    fontFamily: fonts.interSb,
                    fontSize: 13.5,
                    color: active ? c.onPrimary : c.fg2,
                    backgroundColor: active ? brand.orange : c.surface,
                    borderWidth: 1,
                    borderColor: active ? brand.orange : c.line,
                    paddingVertical: 9,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {w.name}
                </Text>
              );
            })}
            {warehouses.length === 0 ? (
              <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, paddingVertical: 9 }}>Cargando depósitos…</Text>
            ) : null}
          </View>

          {/* Cantidad */}
          <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: c.fg3, marginBottom: 8, letterSpacing: 0.2 }}>
            CANTIDAD{unit ? ` (${unit})` : ''}
          </Text>
          <TextInput
            value={qty}
            onChangeText={(t) => setQty(t.replace(/[^0-9.,]/g, ''))}
            placeholder="0"
            placeholderTextColor={c.fg3}
            keyboardType="decimal-pad"
            style={{ height: 48, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, fontFamily: fonts.interM, fontSize: 15, color: c.fg, marginBottom: 18 }}
          />

          {/* Notas */}
          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>NOTAS</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Opcional…"
            placeholderTextColor={c.fg3}
            multiline
            style={{ minHeight: 72, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, padding: 14, fontFamily: fonts.inter, fontSize: 15, color: c.fg, textAlignVertical: 'top', marginBottom: 24 }}
          />

          <PrimaryButton label="Reservar" onPress={save} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
