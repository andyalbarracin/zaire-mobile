import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { folderPath } from '@/components/folderShape';

/**
 * Superficie con forma "folder" (chaflán superior derecho), rellena con color sólido
 * o degradé SVG (135°), con borde opcional. Se mide con onLayout y dibuja el path detrás
 * del contenido. Usada por el hero de Home y los tiles de módulos de "Más".
 */
export interface FolderSurfaceProps {
  radius?: number;
  cut?: number;
  fill?: string;
  gradient?: string[];
  border?: string;
  borderWidth?: number;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle | ViewStyle[];
  children?: ReactNode;
}

export function FolderSurface({
  radius = 20,
  cut = 24,
  fill = '#FFFFFF',
  gradient,
  border,
  borderWidth = 1,
  style,
  contentStyle,
  children,
}: FolderSurfaceProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <View style={style}>
      <View onLayout={onLayout} style={contentStyle}>
        {size.w > 0 && (
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            {gradient && gradient.length > 0 && (
              <Defs>
                <LinearGradient id="fsGrad" x1="0" y1="0" x2="1" y2="1">
                  {gradient.map((color, i) => (
                    <Stop key={i} offset={gradient.length === 1 ? 0 : i / (gradient.length - 1)} stopColor={color} />
                  ))}
                </LinearGradient>
              </Defs>
            )}
            <Path
              d={folderPath(size.w, size.h, radius, cut)}
              fill={gradient && gradient.length > 0 ? 'url(#fsGrad)' : fill}
              stroke={border}
              strokeWidth={border ? borderWidth : 0}
            />
          </Svg>
        )}
        {children}
      </View>
    </View>
  );
}
