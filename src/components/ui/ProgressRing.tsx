import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { brand } from '@/theme/tokens';

/** Anillo de progreso (naranja sobre track tenue). Fiel al hero del prototipo. */
export function ProgressRing({
  size = 88,
  stroke = 10,
  progress,
  trackColor,
  color = brand.orange,
  children,
}: {
  size?: number;
  stroke?: number;
  progress: number; // 0..1
  trackColor: string;
  color?: string;
  children?: ReactNode;
}) {
  const r = size / 2 - stroke / 2 - 1;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circ * (1 - clamped);
  const cx = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
