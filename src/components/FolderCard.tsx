import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { folderPath } from '@/components/folderShape';
import { Icon, type IconName } from '@/components/icons/Icon';
import { tint } from '@/theme/color';
import { fonts, radii, status as STATUS, type StatusKey } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/**
 * "Zaire Folder Card" — el componente firma. Rounded rect radio 18 con la esquina
 * superior derecha chaflanada a 45° (equivalente al clip-path del prototipo), dibujado
 * con SVG para poder pintar relleno + borde. Toda la card es el target táctil.
 */

const RADIUS = radii.card; // 18
const CUT = 20; // tamaño del chaflán (esquina superior derecha)

export interface FolderCardProps {
  title: string;
  subtitle?: string;
  status?: StatusKey;
  time?: string;
  icon?: IconName;
  chevron?: boolean;
  onPress?: () => void;
}

export function FolderCard({
  title,
  subtitle,
  status = 'none',
  time,
  icon = 'box',
  chevron = true,
  onPress,
}: FolderCardProps) {
  const c = useThemeColors();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const s = STATUS[status] ?? STATUS.none;
  const showStatus = s.label.length > 0;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.shadow, { transform: [{ scale: pressed ? 0.984 : 1 }] }]}
    >
      <View onLayout={onLayout} style={styles.body}>
        {size.w > 0 && (
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            <Path d={folderPath(size.w, size.h, RADIUS, CUT)} fill={c.surface} stroke={c.line} strokeWidth={1} />
          </Svg>
        )}

        <View style={[styles.tile, { backgroundColor: tint(s.color, 0.13) }]}>
          <Icon name={icon} size={24} color={s.color} strokeWidth={2} />
        </View>

        <View style={styles.center}>
          <Text numberOfLines={1} style={[styles.title, { color: c.fg }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.subtitle, { color: c.fg2 }]}>
              {subtitle}
            </Text>
          ) : null}
          {showStatus && (
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.right}>
          {time ? <Text style={[styles.time, { color: c.fg2 }]}>{time}</Text> : null}
          {chevron ? <Icon name="chevronRight" size={17} color={c.fg3} strokeWidth={2.5} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#0E1626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  tile: {
    width: 46,
    height: 46,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: fonts.interSb, fontSize: 15.5, lineHeight: 19 },
  subtitle: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontFamily: fonts.interSb, fontSize: 11.5, letterSpacing: 0.3 },
  right: { alignItems: 'flex-end', gap: 9, paddingLeft: 4 },
  time: { fontFamily: fonts.interSb, fontSize: 13, fontVariant: ['tabular-nums'] },
});
