import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/Icon';
import { MODULE_META, type ModuleId } from '@/lib/modules';
import { fonts } from '@/theme/tokens';

/**
 * "Archivero" de módulos: cards apiladas (las de atrás asoman) con degradé por módulo. Se
 * arrastra en horizontal para traer otra al frente; el tap navega. Reemplaza al grid plano
 * como acceso rápido cuando hay más de un módulo habilitado.
 */

const ROUTE: Record<ModuleId, Href> = { field: '/field', assets: '/assets', stock: '/stock', trace: '/trace', crm: '/' };

// Acentos por módulo (navy field/assets · bordó stock · verde pizarra trace).
const ACCENT: Record<ModuleId, [string, string]> = {
  field: ['#26406B', '#16223A'],
  assets: ['#26406B', '#16223A'],
  stock: ['#7A2E3A', '#4E1F27'],
  trace: ['#3F5140', '#26331F'],
  crm: ['#4A3D5E', '#2E2540'],
};

const H = 148;
const THRESHOLD = 55;

export function ModuleStack({ modules, fieldStat }: { modules: ModuleId[]; fieldStat?: string }) {
  const [active, setActive] = useState(0);
  const dragX = useRef(new Animated.Value(0)).current;
  const n = modules.length;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: dragX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) >= THRESHOLD) {
          Animated.timing(dragX, { toValue: g.dx < 0 ? -420 : 420, duration: 170, useNativeDriver: false }).start(() => {
            dragX.setValue(0);
            setActive((a) => (g.dx < 0 ? (a + 1) % n : (a - 1 + n) % n));
          });
        } else {
          Animated.spring(dragX, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  if (n === 0) return null;

  const depthCount = Math.min(n, 3);
  const cards = [];
  for (let depth = depthCount - 1; depth >= 0; depth--) {
    const m = modules[(active + depth) % n];
    const isFront = depth === 0;
    const style = isFront
      ? {
          transform: [
            { translateX: dragX },
            { rotate: dragX.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-7deg', '0deg', '7deg'] }) },
          ] as const,
        }
      : { transform: [{ translateY: -depth * 11 }, { scale: 1 - depth * 0.05 }], opacity: 1 - depth * 0.2 };
    cards.push(
      <Animated.View
        key={`${m}-${depth}`}
        style={[{ position: 'absolute', left: 0, right: 0, top: depthCount * 11 }, style]}
        {...(isFront ? pan.panHandlers : {})}
      >
        <ModuleCard module={m} onPress={() => router.navigate(ROUTE[m])} stat={m === 'field' ? fieldStat : undefined} />
      </Animated.View>,
    );
  }

  return (
    <View style={{ height: H + depthCount * 11 + 16, marginBottom: 22 }}>
      {cards}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {modules.map((m, i) => (
          <View key={m} style={{ width: i === active ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === active ? '#F26A21' : 'rgba(139,147,163,0.4)' }} />
        ))}
      </View>
    </View>
  );
}

function ModuleCard({ module, onPress, stat }: { module: ModuleId; onPress: () => void; stat?: string }) {
  const meta = MODULE_META[module];
  const [a, b] = ACCENT[module];
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[a, b]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: H, borderRadius: 22, padding: 20, justifyContent: 'space-between', overflow: 'hidden' }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={meta.icon as IconName} size={24} color="#fff" strokeWidth={2} />
          </View>
          <Icon name="arrowRight" size={20} color="rgba(255,255,255,0.65)" strokeWidth={2} />
        </View>
        <View>
          <Text style={{ fontFamily: fonts.ralewayB, fontSize: 21, color: '#fff', letterSpacing: -0.3 }}>{meta.label}</Text>
          <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{stat ?? meta.sub}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
