import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { folderPath } from '@/components/folderShape';
import { Icon, type IconName } from '@/components/icons/Icon';
import { Screen } from '@/components/ui/Screen';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

/** Pantalla placeholder de módulo ("{Módulo} — próximamente"), on-brand. */
export function Placeholder({
  title,
  icon,
  subtitle = 'Próximamente',
}: {
  title: string;
  icon: IconName;
  subtitle?: string;
}) {
  const c = useThemeColors();
  const W = 104;
  const H = 96;

  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <View style={{ width: W, height: H, marginBottom: 22 }}>
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <Path d={folderPath(W, H, 20, 22)} fill="none" stroke={c.fg3} strokeWidth={2} strokeDasharray="6 6" />
          </Svg>
          <View style={styles.center}>
            <Icon name={icon} size={40} color={c.fg3} strokeWidth={1.8} />
          </View>
        </View>
        <Text style={{ fontFamily: fonts.ralewayB, fontSize: 22, color: c.fg }}>{title}</Text>
        <Text style={{ fontFamily: fonts.inter, fontSize: 14.5, color: c.fg2, marginTop: 8 }}>{subtitle}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
