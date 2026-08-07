import { router, type Href } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FolderSurface } from '@/components/FolderSurface';
import { Icon, type IconName } from '@/components/icons/Icon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { healthColor } from '@/lib/assets/map';
import { MODULE_META, type ModuleId } from '@/lib/modules';
import { brand, fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * Archivero de estado por módulo: pestañas tipo "file-folder" arriba (icono + color de módulo;
 * la activa a todo color, las demás apagadas) y un cuerpo con el degradé premium (mismo de la
 * card de status) que muestra el estado del módulo activo. Sin swipe: se cambia por las pestañas.
 */

export interface FieldStat {
  done: number;
  total: number;
  pct: number;
  week: { d: string; done: boolean }[];
  pts: number;
  dateLabel: string;
  hasToday: boolean;
}
export interface AssetStat {
  avgHealth: number | null;
  count: number;
}

// Orden del archivero (Trace primero) y color de la pestaña por módulo.
const ORDER: ModuleId[] = ['trace', 'field', 'assets', 'stock'];
const TAB_COLOR: Record<ModuleId, string> = {
  trace: '#F26A21', // naranja
  field: '#2F7D51', // verde
  assets: '#26406B', // navy
  stock: '#7A2E3A', // bordó
  crm: '#4A3D5E',
};
const ROUTE: Record<ModuleId, Href> = { field: '/field', assets: '/assets', stock: '/stock', trace: '/trace', crm: '/' };

export function ModuleFolders({ modules, field, assets }: { modules: ModuleId[]; field: FieldStat; assets: AssetStat }) {
  const c = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const order = ORDER.filter((m) => modules.includes(m));
  const [active, setActive] = useState(0);
  const mod = order[active] ?? order[0];
  if (!mod) return null;
  const accent = TAB_COLOR[mod];
  const inactiveBg = isDark ? '#23262D' : '#DED9D0';

  return (
    <View style={{ marginBottom: 26 }}>
      {/* Pestañas */}
      <View style={{ flexDirection: 'row', gap: 5, paddingLeft: 6, zIndex: 2 }}>
        {order.map((m, i) => {
          const on = i === active;
          return (
            <Pressable
              key={m}
              onPress={() => setActive(i)}
              style={{
                width: 56,
                height: on ? 42 : 34,
                marginTop: on ? 0 : 8,
                borderTopLeftRadius: 13,
                borderTopRightRadius: 13,
                backgroundColor: on ? TAB_COLOR[m] : inactiveBg,
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: on ? 6 : 0,
              }}
            >
              <Icon name={MODULE_META[m].icon as IconName} size={21} color={on ? '#fff' : c.fg3} strokeWidth={2} />
            </Pressable>
          );
        })}
      </View>

      {/* Cuerpo (degradé premium) con acento superior del módulo activo */}
      <Pressable onPress={() => router.navigate(ROUTE[mod])} style={{ marginTop: -2 }}>
        <FolderSurface radius={20} cut={24} gradient={c.hero} border={c.line} contentStyle={{ padding: 0 }}>
          <View style={{ height: 4, backgroundColor: accent }} />
          <View style={{ paddingHorizontal: 19, paddingTop: 17, paddingBottom: 17 }}>
            {mod === 'field' ? (
              <FieldBody field={field} c={c} />
            ) : mod === 'assets' ? (
              <AssetsBody assets={assets} c={c} />
            ) : (
              <PlaceholderBody module={mod} c={c} />
            )}
          </View>
        </FolderSurface>
      </Pressable>
    </View>
  );
}

type C = ReturnType<typeof useThemeColors>;

function FieldBody({ field, c }: { field: FieldStat; c: C }) {
  const { done, total, pct, week, pts, dateLabel, hasToday } = field;
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
        <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, letterSpacing: 0.2 }}>{hasToday ? 'Progreso diario' : 'Tus visitas'}</Text>
        <Text style={{ fontFamily: fonts.interM, fontSize: 11.5, color: c.fg3 }}>{dateLabel}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <Text style={{ fontFamily: fonts.ralewayXb, fontSize: 46, lineHeight: 46, color: c.fg, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{done}</Text>
            <Text style={{ fontFamily: fonts.interM, fontSize: 15, color: c.fg2, paddingBottom: 5 }}>de {total} visitas</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 14 }}>
            {['#E03A3A', '#F26A21', '#E0A03A'].map((col) => (
              <View key={col} style={{ width: 34, height: 6, borderRadius: 3, backgroundColor: col }} />
            ))}
          </View>
        </View>
        <ProgressRing size={88} progress={pct} trackColor={c.surface2}>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, fontVariant: ['tabular-nums'] }}>{Math.round(pct * 100)}%</Text>
        </ProgressRing>
      </View>
      <View style={{ height: 1, backgroundColor: c.line, marginTop: 17, marginBottom: 15 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg }}>Puntos de la semana</Text>
        <Text style={{ fontFamily: fonts.interB, fontSize: 14, color: brand.orange, fontVariant: ['tabular-nums'] }}>{pts} pts</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {week.map((w, i) => (
          <View key={i} style={{ alignItems: 'center', gap: 7 }}>
            <Text style={{ fontFamily: fonts.interSb, fontSize: 10, letterSpacing: 0.3, color: w.done ? brand.orange : c.fg3 }}>{w.d}</Text>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: w.done ? brand.orange : 'transparent', borderWidth: w.done ? 0 : 1.5, borderColor: c.fg3 }} />
          </View>
        ))}
      </View>
    </>
  );
}

function AssetsBody({ assets, c }: { assets: AssetStat; c: C }) {
  const h = assets.avgHealth;
  return (
    <>
      <Text style={{ fontFamily: fonts.interSb, fontSize: 13, color: c.fg2, letterSpacing: 0.2, marginBottom: 15 }}>Salud de la flota</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <Text style={{ fontFamily: fonts.ralewayXb, fontSize: 46, lineHeight: 46, color: c.fg, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{assets.count}</Text>
            <Text style={{ fontFamily: fonts.interM, fontSize: 15, color: c.fg2, paddingBottom: 5 }}>equipos</Text>
          </View>
          <Text style={{ fontFamily: fonts.interM, fontSize: 13, color: c.fg2, marginTop: 12 }}>
            {h != null ? `Salud promedio ${h}%` : 'Sin datos de salud'}
          </Text>
        </View>
        {h != null ? (
          <ProgressRing size={88} progress={h / 100} trackColor={c.surface2} color={healthColor(h)}>
            <Text style={{ fontFamily: fonts.ralewayB, fontSize: 20, color: c.fg, fontVariant: ['tabular-nums'] }}>{h}</Text>
          </ProgressRing>
        ) : (
          <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="box" size={30} color={c.fg3} strokeWidth={1.8} />
          </View>
        )}
      </View>
    </>
  );
}

function PlaceholderBody({ module, c }: { module: ModuleId; c: C }) {
  const meta = MODULE_META[module];
  return (
    <View style={{ minHeight: 168, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <View style={{ width: 56, height: 56, borderRadius: 15, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={meta.icon as IconName} size={28} color={c.fg2} strokeWidth={2} />
      </View>
      <Text style={{ fontFamily: fonts.ralewayB, fontSize: 18, color: c.fg }}>{meta.label}</Text>
      <Text style={{ fontFamily: fonts.inter, fontSize: 13.5, color: c.fg2 }}>{meta.sub} · tocá para abrir</Text>
    </View>
  );
}
