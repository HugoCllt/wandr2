'use client';

import * as Popover from '@radix-ui/react-popover';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { useSession } from '../auth/auth-client';
import { CATEGORY_KEYS, CATEGORY_PRESETS } from '../presets/CATEGORY_PRESETS';
import { AffinityRose } from './AffinityRose';
import { avatarUrl } from './avatarUrl';
import { Icon } from './icons/Icon';

const CATEGORY_LINKS = CATEGORY_KEYS.map((key) => {
  const cfg = CATEGORY_PRESETS[key];
  return {
    key,
    name: cfg.label,
    href: `/${key}`,
    icon: cfg.icon,
    image: cfg.heroImage.replace('w=1600', 'w=480'),
  };
});

export function Nav({ citySearch }: { citySearch?: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };
  const categoryIndex = CATEGORY_KEYS.findIndex((key) => pathname?.startsWith(`/${key}`));
  const categoryActive = categoryIndex !== -1;

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <Link className="logo" href="/" aria-label="Wandr home">
            <span className="logo-mark">
              <AffinityRose highlight={categoryActive ? categoryIndex : null} size={36} />
            </span>
            <span>Wandr</span>
          </Link>
        </div>

        <div className="nav-search-cell">{citySearch}</div>

        <div className="nav-right">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className={'nav-link nav-explore ' + (categoryActive ? 'active' : '')}
                aria-label="Explore activity categories"
              >
                <Icon name="compass" size={16} /> Explore
                <span className="nav-explore-chev" aria-hidden="true">
                  <Icon name="chev-down" size={12} />
                </span>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="explore-panel"
                side="bottom"
                align="end"
                sideOffset={12}
                collisionPadding={16}
              >
                <div className="explore-grid">
                  {CATEGORY_LINKS.map((l) => (
                    <Popover.Close asChild key={l.href}>
                      <Link
                        href={l.href}
                        className="explore-card"
                        data-active={pathname?.startsWith(l.href) || undefined}
                      >
                        <span
                          className="explore-card-img"
                          style={{ backgroundImage: `url(${l.image})` }}
                        />
                        <span className="explore-card-scrim" />
                        <span className="explore-card-label">
                          <Icon name={l.icon} size={15} />
                          {l.name}
                        </span>
                      </Link>
                    </Popover.Close>
                  ))}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <Link
            href="/calendar"
            className={'nav-link nav-icon ' + (isActive('/calendar') ? 'active' : '')}
            aria-label="Calendar"
          >
            <Icon name="calendar" size={18} />
          </Link>
          {session?.user ? (
            <Link className="avatar" href="/profile" aria-label="Profile">
              <img src={avatarUrl(session.user.id)} alt="" />
            </Link>
          ) : (
            <Link className="nav-login" href="/login">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
