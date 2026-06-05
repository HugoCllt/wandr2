'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '../../../shared/ui/icons/Icon';

export function ChatFAB() {
  const pathname = usePathname();
  if (pathname === '/chat') return null;

  return (
    <Link
      href="/chat"
      aria-label="Open Wandr chat"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 999,
        background: 'var(--ink)',
        color: 'var(--offwhite)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 60,
      }}
    >
      <Icon name="chat" size={22} />
    </Link>
  );
}
