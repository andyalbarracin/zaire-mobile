import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FolderCard } from '@/components/FolderCard';
import { folderPath } from '@/components/folderShape';
import { Icon } from '@/components/icons/Icon';
import { ModuleHero } from '@/components/ModuleHero';
import { OfflinePill } from '@/components/ui/OfflinePill';
import { groupByProduct, productToCard } from '@/lib/stock/map';
import type { ProductStockSummary } from '@/lib/stock/types';
import { useStockLevels } from '@/lib/stock/useStock';
import { fonts, moduleBrand, moduleHero } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

export default function Stock() {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { levels, loading, error, stale, refetch } = useStockLevels();
  const [query, setQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const products = useMemo(() => groupByProduct(levels), [levels]);
  const lowCount = useMemo(() => products.filter((p) => p.light !== 'green').length, [products]);
  const totalValue = useMemo(() => levels.reduce((s, l) => s + l.on_hand * l.avg_cost, 0), [levels]);
  const heroGradient = moduleHero.stock[isDark ? 'dark' : 'light'];
  const accent = moduleBrand.stock[isDark ? 'dark' : 'light'];
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => [p.product.name, p.product.code].some((f) => (f ?? '').toLowerCase().includes(q)));
  }, [products, query]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 25, color: c.fg, letterSpacing: -0.3 }}>Stock</Text>
          <OfflinePill />
        </View>

        <ModuleHero gradient={heroGradient}>
          <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, letterSpacing: 0.2, marginBottom: 15 }}>Estado del stock</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <Text style={{ fontFamily: fonts.ralewayXb, fontSize: 40, lineHeight: 40, color: c.fg, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{products.length}</Text>
                <Text style={{ fontFamily: fonts.interM, fontSize: 14, color: c.fg2, paddingBottom: 4 }}>productos</Text>
              </View>
              <Text style={{ fontFamily: fonts.interM, fontSize: 13, color: c.fg2, marginTop: 10 }}>
                {lowCount > 0 ? `${lowCount} bajo mínimo · ` : ''}
                <Text style={{ fontFamily: fonts.interSb, color: accent }}>${totalValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</Text>
                {' en stock'}
              </Text>
            </View>
            <View style={{ width: 76, height: 76, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1.5, borderColor: accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="grid" size={30} color={accent} strokeWidth={1.8} />
            </View>
          </View>
        </ModuleHero>

        {stale ? (
          <Text style={{ fontFamily: fonts.inter, fontSize: 12.5, color: c.fg3, marginBottom: 12 }}>Mostrando lo guardado · sin conexión</Text>
        ) : null}

        {/* Buscador */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 13, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, marginBottom: 16 }}>
          <Icon name="search" size={18} color={c.fg3} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre o código…"
            placeholderTextColor={c.fg3}
            autoCapitalize="none"
            style={{ flex: 1, fontFamily: fonts.interM, fontSize: 15, color: c.fg, paddingVertical: 0 }}
          />
        </View>

        {loading ? (
          <Skeletons />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : list.length === 0 ? (
          <EmptyState searching={query.trim().length > 0} />
        ) : (
          <View style={{ gap: 12 }}>
            {list.map((p) => (
              <FolderCard key={p.product_id} {...productToCard(p)} onPress={() => openProduct(p)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function openProduct(p: ProductStockSummary) {
  router.push({ pathname: '/stock/producto/[id]', params: { id: p.product_id } });
}

function Skeletons() {
  const c = useThemeColors();
  return (
    <View style={{ gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ height: 74, backgroundColor: c.surface, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 13, borderWidth: 1, borderColor: c.line }}>
          <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: c.surface2 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ height: 11, width: '70%', borderRadius: 6, backgroundColor: c.surface2 }} />
            <View style={{ height: 9, width: '45%', borderRadius: 5, backgroundColor: c.surface2 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  const c = useThemeColors();
  const W = 104;
  const H = 96;
  return (
    <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 20 }}>
      <View style={{ width: W, height: H, marginBottom: 22 }}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Path d={folderPath(W, H, 20, 22)} fill="none" stroke={c.fg3} strokeWidth={2} strokeDasharray="6 6" />
        </Svg>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="grid" size={38} color={c.fg3} strokeWidth={1.8} />
        </View>
      </View>
      <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, textAlign: 'center' }}>
        {searching ? 'Sin resultados' : 'Todavía no hay existencias'}
      </Text>
      <Text style={{ fontFamily: fonts.inter, fontSize: 14.5, lineHeight: 21, color: c.fg2, textAlign: 'center', marginTop: 8, maxWidth: 260 }}>
        {searching ? 'Probá con otro nombre o código.' : 'Los movimientos de stock que se registren van a aparecer acá.'}
      </Text>
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 20 }}>
      <Icon name="wifiOff" size={40} color={c.fg3} strokeWidth={1.8} />
      <Text style={{ fontFamily: fonts.interM, fontSize: 14.5, color: c.fg2, textAlign: 'center', marginTop: 16 }}>{message}</Text>
      <Text onPress={onRetry} style={{ fontFamily: fonts.interSb, fontSize: 14, color: '#F26A21', marginTop: 12 }}>Reintentar</Text>
    </View>
  );
}
