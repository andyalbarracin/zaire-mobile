import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderCard } from '@/components/FolderCard';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { useConnectivity } from '@/lib/connectivity';
import { getStockLevels, getWarehouses } from '@/lib/stock/api';
import { groupByProduct, productToCard } from '@/lib/stock/map';
import { consumeStock, mapStockError } from '@/lib/stock/mutations';
import type { ProductStockSummary, Warehouse } from '@/lib/stock/types';
import { useTenant } from '@/lib/tenant';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Consumir repuestos de stock en una visita (cross-módulo Field↔Stock). Por defecto usa el
 * depósito vinculado al vehículo de la visita (`stock_warehouses.field_vehicle_id`) si existe.
 * De a un producto por vez (a diferencia del diálogo multi-línea de la web) — para otro repuesto,
 * se repite la acción; mantiene el molde de "una cosa por vez" del resto de Stock en mobile.
 */
export default function ConsumoVisita() {
  const c = useThemeColors();
  const { id: visitId, vehicleId } = useLocalSearchParams<{ id: string; vehicleId?: string }>();
  const { supabase } = useTenant();
  const { session } = useAuth();
  const { isOnline } = useConnectivity();

  const [products, setProducts] = useState<ProductStockSummary[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ProductStockSummary | null>(null);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getStockLevels(supabase), getWarehouses(supabase)])
      .then(([levels, ws]) => {
        setProducts(groupByProduct(levels));
        setWarehouses(ws);
        const vehicleWh = ws.find((w) => w.field_vehicle_id === vehicleId);
        setWarehouseId((prev) => prev ?? vehicleWh?.id ?? ws[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, [supabase, vehicleId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => [p.product.name, p.product.code].some((f) => (f ?? '').toLowerCase().includes(q)));
  }, [products, query]);

  async function save() {
    if (saving || !selected) return;
    const n = Number(qty.replace(',', '.'));
    if (!warehouseId) {
      Alert.alert('Falta el depósito', 'Elegí de qué depósito consumís.');
      return;
    }
    if (!n || n <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresá una cantidad mayor a 0.');
      return;
    }
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Consumir stock necesita conexión.');
      return;
    }
    setSaving(true);
    try {
      await consumeStock(supabase, {
        productId: selected.product_id,
        warehouseId,
        qty: n,
        visitId: visitId!,
        notes: notes.trim() || null,
        createdBy: session?.user?.id ?? null,
      });
      Alert.alert('Consumido', `Se descontaron ${n} ${selected.product.unit} de stock.`);
      setSelected(null);
      setQty('');
      setNotes('');
    } catch (e) {
      Alert.alert('No se pudo consumir', mapStockError(e instanceof Error ? e.message : ''));
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
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 24, color: c.fg, letterSpacing: -0.3, marginBottom: 22 }}>Consumir de stock</Text>

          {!selected ? (
            <>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar producto…"
                placeholderTextColor={c.fg3}
                autoCapitalize="none"
                style={{
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.line,
                  paddingHorizontal: 16,
                  fontFamily: fonts.interM,
                  fontSize: 15,
                  color: c.fg,
                  marginBottom: 16,
                }}
              />
              {loadingData ? (
                <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, textAlign: 'center', marginTop: 20 }}>Cargando productos…</Text>
              ) : filtered.length === 0 ? (
                <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg3, textAlign: 'center', marginTop: 20 }}>Sin resultados.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {filtered.map((p) => (
                    <FolderCard key={p.product_id} {...productToCard(p)} onPress={() => setSelected(p)} />
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Producto elegido */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: c.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: c.line,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 22,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.interSb, fontSize: 15, color: c.fg }}>{selected.product.name}</Text>
                  {selected.product.code ? (
                    <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginTop: 2 }}>{selected.product.code}</Text>
                  ) : null}
                </View>
                <Text onPress={() => setSelected(null)} style={{ fontFamily: fonts.interSb, fontSize: 13, color: brand.orange }}>
                  Cambiar
                </Text>
              </View>

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
                      {w.field_vehicle_id && w.field_vehicle_id === vehicleId ? ' · tu unidad' : ''}
                    </Text>
                  );
                })}
              </View>

              {/* Cantidad */}
              <Text style={{ fontFamily: fonts.interSb, fontSize: 11.5, color: c.fg3, marginBottom: 8, letterSpacing: 0.2 }}>
                CANTIDAD ({selected.product.unit})
              </Text>
              <TextInput
                value={qty}
                onChangeText={(t) => setQty(t.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                placeholderTextColor={c.fg3}
                keyboardType="decimal-pad"
                style={{
                  height: 48,
                  borderRadius: 13,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.line,
                  paddingHorizontal: 14,
                  fontFamily: fonts.interM,
                  fontSize: 15,
                  color: c.fg,
                  marginBottom: 18,
                }}
              />

              {/* Notas */}
              <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, marginBottom: 10, letterSpacing: 0.2 }}>NOTAS</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Opcional…"
                placeholderTextColor={c.fg3}
                multiline
                style={{
                  minHeight: 72,
                  borderRadius: 14,
                  backgroundColor: c.surface,
                  borderWidth: 1,
                  borderColor: c.line,
                  padding: 14,
                  fontFamily: fonts.inter,
                  fontSize: 15,
                  color: c.fg,
                  textAlignVertical: 'top',
                  marginBottom: 24,
                }}
              />

              <PrimaryButton label="Consumir" onPress={save} loading={saving} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
