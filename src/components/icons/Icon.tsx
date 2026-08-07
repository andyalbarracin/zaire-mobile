import type { ReactNode } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

/**
 * Íconos line (trazo) portados literalmente del prototipo (ZaireMobile.dc.html /
 * FolderCard.dc.html). viewBox 24×24, para máxima fidelidad. Se colorean por `color`.
 */
export type IconName =
  // industriales (FolderCard)
  | 'gauge'
  | 'factory'
  | 'bolt'
  | 'wrench'
  | 'drop'
  | 'mountain'
  | 'chip'
  | 'box'
  | 'valve'
  | 'pin'
  | 'doc'
  // chrome / navegación
  | 'chevronRight'
  | 'chevronLeft'
  | 'menu'
  | 'bell'
  | 'wifiOff'
  | 'arrowRight'
  | 'check'
  | 'mail'
  | 'shieldCheck'
  | 'home'
  | 'layers'
  | 'grid'
  | 'route'
  | 'users'
  | 'moon'
  | 'textSize'
  | 'logout'
  | 'camera'
  | 'search'
  | 'plus';

const PATHS: Record<IconName, ReactNode> = {
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M16.5 16.5L21 21" />
    </>
  ),
  plus: (
    <>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </>
  ),
  gauge: (
    <>
      <Path d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
      <Path d="M13.5 10.5L16.5 7.5" />
      <Path d="M4.2 15a8 8 0 0115.6 0" />
    </>
  ),
  factory: (
    <>
      <Path d="M3 21h18" />
      <Path d="M5 21V11l5 3.2V11l5 3.2V6.4h4.5V21" />
      <Path d="M8.6 21v-3.4M12.4 21v-3.4" />
    </>
  ),
  bolt: <Path d="M13 2.5L5 13.5h6l-1 8 9-12h-7l1-7z" />,
  wrench: <Path d="M15.6 7.4a4 4 0 01-5.2 5.2L5 18l1.5 1.5 5.4-5.4a4 4 0 005.2-5.2l-2.2 2.2-2-2 2.7-1.7z" />,
  drop: <Path d="M12 3.4s6 6.5 6 10.6a6 6 0 11-12 0C6 9.9 12 3.4 12 3.4z" />,
  mountain: <Path d="M3 20l6-11 4 6 2.6-3.6L21 20z" />,
  chip: (
    <>
      <Path d="M7 7h10v10H7z" />
      <Path d="M9.6 9.6h4.8v4.8H9.6z" />
      <Path d="M4 10.2v3.6M4 10.2h3M4 13.8h3M20 10.2v3.6M17 10.2h3M17 13.8h3M10.2 4h3.6M10.2 4v3M13.8 4v3M10.2 20v-3M13.8 20v-3" />
    </>
  ),
  box: (
    <>
      <Path d="M20 8l-8-4-8 4v8l8 4 8-4V8z" />
      <Path d="M4 8l8 4 8-4" />
      <Path d="M12 12v8" />
    </>
  ),
  valve: (
    <>
      <Path d="M12 3.5v5.5" />
      <Path d="M8.5 3.5h7" />
      <Path d="M12 9a4 4 0 100 8 4 4 0 000-8z" />
      <Path d="M12 17v3.5M8.5 20.5h7" />
    </>
  ),
  pin: (
    <>
      <Path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
      <Path d="M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    </>
  ),
  doc: (
    <>
      <Path d="M14 3H6.5A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V8z" />
      <Path d="M14 3v5h5" />
      <Path d="M8.5 13h7M8.5 16.5h7" />
    </>
  ),
  chevronRight: <Path d="M9 6l6 6-6 6" />,
  chevronLeft: <Path d="M15 6l-6 6 6 6" />,
  menu: <Path d="M4 7h16M4 12h16M4 17h16" />,
  bell: (
    <>
      <Path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <Path d="M13.5 20a2 2 0 01-3 0" />
    </>
  ),
  wifiOff: <Path d="M3 3l18 18M8.5 8.6A11 11 0 003 8m3.5 3.4A7 7 0 006 11m3.3 3.3A3.4 3.4 0 009 14m3 5h.01" />,
  arrowRight: <Path d="M5 12h13M13 6l6 6-6 6" />,
  check: <Path d="M20 6L9 17l-5-5" />,
  mail: (
    <>
      <Path d="M4 6.5A1.5 1.5 0 015.5 5h13A1.5 1.5 0 0120 6.5v11A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5z" />
      <Path d="M4.5 7l7.5 5.3L19.5 7" />
    </>
  ),
  shieldCheck: (
    <>
      <Path d="M12.5 3l6 2.6v5.2c0 3.9-2.6 7-6 8.2-3.4-1.2-6-4.3-6-8.2V5.6z" />
      <Path d="M9.6 11.8l1.8 1.8 3.2-3.4" />
    </>
  ),
  home: (
    <>
      <Path d="M3 10.5L12 3l9 7.5" />
      <Path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  layers: (
    <>
      <Path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <Path d="M3 12l9 4.5 9-4.5" />
      <Path d="M3 16.5l9 4.5 9-4.5" />
    </>
  ),
  grid: <Path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  route: (
    <>
      <Circle cx={6} cy={18} r={2} />
      <Circle cx={18} cy={6} r={2} />
      <Path d="M8 18h7a3 3 0 003-3V8" />
    </>
  ),
  users: (
    <>
      <Circle cx={9} cy={8} r={3.4} />
      <Path d="M3.5 20c0-3.3 2.5-5 5.5-5s5.5 1.7 5.5 5" />
      <Path d="M16 5.2a3.4 3.4 0 010 5.6M17.5 20c0-2.6-1-4.2-2.5-5" />
    </>
  ),
  moon: <Path d="M21 12.8A8.5 8.5 0 0111.2 3 7 7 0 1021 12.8z" />,
  textSize: (
    <>
      <Path d="M4 7V5.5h9V7M8.5 5.5v13M6.5 18.5h4" />
      <Path d="M14 12.5V11h7v1.5M17.5 11v7.5M16 18.5h3" />
    </>
  ),
  logout: <Path d="M15 4h3.5A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5H15M10 12h9M16 8l4 4-4 4" />,
  camera: (
    <>
      <Path d="M4 8.5A1.5 1.5 0 015.5 7h1.6L8.4 5h7.2l1.3 2h1.6A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5z" />
      <Circle cx={12} cy={12.5} r={3.2} />
    </>
  ),
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = '#1B2A44', strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none">
        {PATHS[name]}
      </G>
    </Svg>
  );
}
