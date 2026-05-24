'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Icon, type IconName } from './icons/Icon';

const PRIMARY_LINKS: { name: string; href: string; icon: IconName }[] = [
  { name: 'Home', href: '/', icon: 'home' },
  { name: 'Sport', href: '/sport', icon: 'ball' },
  { name: 'Dining', href: '/dining', icon: 'fork' },
  { name: 'Culture', href: '/culture', icon: 'culture' },
  { name: 'Outdoor', href: '/outdoor', icon: 'leaf' },
  { name: 'Nightlife', href: '/nightlife', icon: 'moon' },
];

const OVERFLOW_LINKS: { name: string; href: string; icon: IconName }[] = [
  { name: 'Romantic', href: '/romantic', icon: 'heart' },
];

const AVATAR_URL =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80';

export function Nav() {
  const pathname = usePathname();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    const onClick = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [overflowOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="logo" href="/chat" aria-label="Open Wandr chat">
          <span>wandr</span>
          <span className="logo-spark" aria-hidden="true">
            <Icon name="chat" size={22} stroke={1.8} />
          </span>
        </Link>

        <div className="nav-links">
          {PRIMARY_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={'nav-link ' + (isActive(l.href) ? 'active' : '')}
            >
              <Icon name={l.icon} size={16} /> {l.name}
            </Link>
          ))}
          <div className="nav-overflow" ref={overflowRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={'nav-link ' + (overflowOpen ? 'active' : '')}
              onClick={() => setOverflowOpen((o) => !o)}
              aria-label="More categories"
              aria-expanded={overflowOpen}
            >
              <Icon name="menu" size={16} />
            </button>
            {overflowOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'var(--cream)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-md)',
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 180,
                  zIndex: 50,
                }}
              >
                {OVERFLOW_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={'nav-link ' + (isActive(l.href) ? 'active' : '')}
                    onClick={() => setOverflowOpen(false)}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <Icon name={l.icon} size={16} /> {l.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <label className="search">
            <Icon name="search" size={16} />
            <input placeholder="Search activities, places, sports, vibes…" />
            <span className="search-kbd">⌘ K</span>
          </label>
          <Link
            href="/calendar"
            className={'nav-link ' + (isActive('/calendar') ? 'active' : '')}
            aria-label="Calendar"
            style={{ padding: '8px 10px' }}
          >
            <Icon name="calendar" size={16} />
          </Link>
          <Link className="avatar" href="/profile" aria-label="Profile">
            <img src={AVATAR_URL} alt="" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
