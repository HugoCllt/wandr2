export type IconName =
  | 'search'
  | 'home'
  | 'sport'
  | 'chat'
  | 'profile'
  | 'compass'
  | 'fire'
  | 'calendar'
  | 'sparkle'
  | 'gem'
  | 'grid'
  | 'ball'
  | 'fork'
  | 'music'
  | 'culture'
  | 'leaf'
  | 'moon'
  | 'spa'
  | 'heart'
  | 'users'
  | 'mountain'
  | 'map'
  | 'pin'
  | 'bookmark'
  | 'plus'
  | 'minus'
  | 'locate'
  | 'chev-left'
  | 'chev-right'
  | 'chev-down'
  | 'arrow-right'
  | 'racket'
  | 'climb'
  | 'save'
  | 'save-fill'
  | 'menu'
  | 'close'
  | 'instagram'
  | 'facebook'
  | 'x';

type IconProps = {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
};

export function Icon({ name, size = 18, stroke = 1.6, className }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };
  switch (name) {
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v9.5h14V10" />
        </svg>
      );
    case 'sport':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-4 3.5V17H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
          <path d="M8 10h8M8 13h5" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.5c.6 2.6 2.4 3.7 3.5 5.4 1 1.5 1.5 3 1.5 4.6A5.5 5.5 0 1 1 6.5 13c0-1 .3-2 1-2.8.4 1 1 1.5 1.7 1.5.7 0 1.2-.5 1.2-1.4 0-1.5-.5-3 .1-4.6.4-1.1 1-1.9 1.5-3.2Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
        </svg>
      );
    case 'gem':
      return (
        <svg {...common}>
          <path d="M6 4h12l3 5-9 11L3 9l3-5Z" />
          <path d="M3 9h18M9 4l-3 5 6 11M15 4l3 5-6 11" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'ball':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
        </svg>
      );
    case 'fork':
      return (
        <svg {...common}>
          <path d="M7 3v8a2 2 0 1 0 4 0V3M9 11v10M17 3c-2 0-3 2-3 5s1 5 3 5v8" />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <path d="M9 18V6l11-2v12" />
          <circle cx="7" cy="18" r="2.5" />
          <circle cx="18" cy="16" r="2.5" />
        </svg>
      );
    case 'culture':
      return (
        <svg {...common}>
          <path d="M4 21h16M5 21V10l7-5 7 5v11M9 21v-7h6v7" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...common}>
          <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z" />
          <path d="M5 19 14 10" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10Z" />
        </svg>
      );
    case 'spa':
      return (
        <svg {...common}>
          <path d="M12 21c0-5 3-8 8-8-1 5-4 8-8 8ZM12 21c0-5-3-8-8-8 1 5 4 8 8 8ZM12 21V9c0-3 2-5 4-6-1 4 0 7-4 6-4 1-3-2-4-6 2 1 4 3 4 6Z" />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3.5" />
          <path d="M3 19a6 6 0 0 1 12 0" />
          <circle cx="17" cy="8" r="2.8" />
          <path d="M15 19a5 5 0 0 1 6.5-4.8" />
        </svg>
      );
    case 'mountain':
      return (
        <svg {...common}>
          <path d="M3 19h18L15 8l-3 5-2-3-7 9Z" />
          <circle cx="7" cy="6" r="1.5" />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case 'bookmark':
      return (
        <svg {...common}>
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'minus':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case 'locate':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      );
    case 'chev-left':
      return (
        <svg {...common}>
          <path d="m14 6-6 6 6 6" />
        </svg>
      );
    case 'chev-right':
      return (
        <svg {...common}>
          <path d="m10 6 6 6-6 6" />
        </svg>
      );
    case 'chev-down':
      return (
        <svg {...common}>
          <path d="m6 10 6 6 6-6" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'racket':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="5" />
          <path d="m13 13 7 7M11 5l5 5" />
        </svg>
      );
    case 'climb':
      return (
        <svg {...common}>
          <circle cx="14" cy="5" r="2" />
          <path d="M14 7v4l-3 2 2 3-2 5M14 11l4 2v4M11 13l-4 2" />
        </svg>
      );
    case 'save':
      return (
        <svg {...common}>
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </svg>
      );
    case 'save-fill':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M14 8.5h2.2V5.4h-2.4c-2 0-3.3 1.3-3.3 3.4v1.9H8.3v3h2.2V21h3.2v-7.3h2.3l.5-3h-2.8V9.1c0-.4.3-.6.7-.6Z" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4 4 20" />
        </svg>
      );
    default:
      return null;
  }
}
