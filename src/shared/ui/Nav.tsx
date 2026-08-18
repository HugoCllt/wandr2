'use client';

import * as Popover from '@radix-ui/react-popover';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSession } from '../auth/auth-client';
import { CATEGORY_KEYS, CATEGORY_PRESETS } from '../presets/CATEGORY_PRESETS';
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

const SEARCH_EXAMPLES = [
  'rooftop jazz tonight',
  'a candle-lit table for two',
  'padel courts this weekend',
  'first-snow trails on the mountain',
  'late-night ramen in the Plateau',
  'galleries open right now',
];

function useTypewriter(phrases: string[], enabled: boolean): string {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setText(phrases[0]);
      return;
    }

    let phrase = 0;
    let chars = 0;
    let deleting = false;
    let id: ReturnType<typeof setTimeout>;

    const step = () => {
      const current = phrases[phrase];
      chars += deleting ? -1 : 1;
      setText(current.slice(0, chars));

      let delay = deleting ? 32 : 58;
      if (!deleting && chars === current.length) {
        deleting = true;
        delay = 1900;
      } else if (deleting && chars === 0) {
        deleting = false;
        phrase = (phrase + 1) % phrases.length;
        delay = 360;
      }
      id = setTimeout(step, delay);
    };

    id = setTimeout(step, 500);
    return () => clearTimeout(id);
  }, [phrases, enabled]);

  return text;
}

function NavSearch() {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const animating = !focused && value.length === 0;
  const example = useTypewriter(SEARCH_EXAMPLES, animating);

  return (
    <label className="search">
      <Icon name="search" size={16} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={animating ? `Search ${example}` : 'Search Montréal…'}
        aria-label="Search activities, places and vibes"
      />
      <span className="search-kbd" aria-hidden="true">
        ⌘ K
      </span>
    </label>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };
  const categoryActive = CATEGORY_KEYS.some((key) => pathname?.startsWith(`/${key}`));

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <Link className="logo" href="/chat" aria-label="Open Wandr chat">
            <span>wandr</span>
            <span className="logo-spark" aria-hidden="true">
              <Icon name="chat" size={22} stroke={1.8} />
            </span>
          </Link>

          <div className="nav-links">
            <Link href="/" className={'nav-link ' + (isActive('/') ? 'active' : '')}>
              <Icon name="home" size={16} /> Home
            </Link>

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
                  align="start"
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
          </div>
        </div>

        <div className="nav-search-cell">
          <NavSearch />
        </div>

        <div className="nav-right">
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
