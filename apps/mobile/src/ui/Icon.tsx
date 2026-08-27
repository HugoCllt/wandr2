import type { ColorValue } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'ball'
  | 'fork'
  | 'culture'
  | 'leaf'
  | 'moon'
  | 'heart'
  | 'heart-fill'
  | 'calendar'
  | 'chat'
  | 'profile'
  | 'home'
  | 'compass'
  | 'bookmark'
  | 'bookmark-fill'
  | 'flame'
  | 'pin'
  | 'clock'
  | 'arrow'
  | 'close'
  | 'check'
  | 'filter'
  | 'external';

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  strokeWidth?: number;
};

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.6 }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <Svg {...common}>
          <Path d="M3 11.5 12 4l9 7.5" />
          <Path d="M5 10v9.5h14V10" />
        </Svg>
      );
    case 'compass':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
        </Svg>
      );
    case 'chat':
      return (
        <Svg {...common}>
          <Path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4 3.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
          <Path d="M8 10h8M8 13h5" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...common}>
          <Rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <Path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
        </Svg>
      );
    case 'ball':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
        </Svg>
      );
    case 'fork':
      return (
        <Svg {...common}>
          <Path d="M7 3v8a2 2 0 1 0 4 0V3M9 11v10M17 3c-2 0-3 2-3 5s1 5 3 5v8" />
        </Svg>
      );
    case 'culture':
      return (
        <Svg {...common}>
          <Path d="M4 21h16M5 21V10l7-5 7 5v11M9 21v-7h6v7" />
        </Svg>
      );
    case 'leaf':
      return (
        <Svg {...common}>
          <Path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z" />
          <Path d="M5 19 14 10" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg {...common}>
          <Path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10Z" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg {...common}>
          <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </Svg>
      );
    case 'heart-fill':
      return (
        <Svg {...common} fill={color} stroke="none">
          <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </Svg>
      );
    case 'pin':
      return (
        <Svg {...common}>
          <Path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
          <Circle cx="12" cy="9" r="2.5" />
        </Svg>
      );
    case 'bookmark':
      return (
        <Svg {...common}>
          <Path d="M6 4h12v17l-6-4-6 4V4Z" />
        </Svg>
      );
    case 'bookmark-fill':
      return (
        <Svg {...common} fill={color} stroke="none">
          <Path d="M6 4h12v17l-6-4-6 4V4Z" />
        </Svg>
      );
    case 'flame':
      return (
        <Svg {...common} fill={color} stroke="none">
          <Path d="M12 2.5c.6 2.6 2.4 3.7 3.5 5.4 1 1.5 1.5 3 1.5 4.6A5.5 5.5 0 1 1 6.5 13c0-1 .3-2 1-2.8.4 1 1 1.5 1.7 1.5.7 0 1.2-.5 1.2-1.4 0-1.5-.5-3 .1-4.6.4-1.1 1-1.9 1.5-3.2Z" />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg {...common}>
          <Path d="M5 12h14M13 6l6 6-6 6" />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...common}>
          <Path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      );
    case 'clock':
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3.5 2" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...common}>
          <Path d="M5 12.5 9.5 17 19 7" />
        </Svg>
      );
    case 'filter':
      return (
        <Svg {...common}>
          <Path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" />
        </Svg>
      );
    case 'external':
      return (
        <Svg {...common}>
          <Path d="M14 4h6v6" />
          <Path d="M20 4 10 14" />
          <Path d="M9 6H5v14h14v-4" />
        </Svg>
      );
    default:
      return null;
  }
}
