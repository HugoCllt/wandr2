'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { CityDTO } from '../../../shared/contracts/CityDTO';
import { Icon } from '../../../shared/ui/icons/Icon';

type CitySearchProps = {
  cities: ReadonlyArray<CityDTO>;
  active: CityDTO;
};

const MAX_SUGGESTIONS = 8;

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function CitySearch({ cities, active }: CitySearchProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [pending, setPending] = useState(false);

  const needle = normalize(query);
  const matches = cities
    .filter((c) => needle === '' || normalize(`${c.name} ${c.country}`).includes(needle))
    .slice(0, MAX_SUGGESTIONS);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  async function select(city: CityDTO): Promise<void> {
    setOpen(false);
    setQuery('');
    if (city.slug === active.slug) return;

    setPending(true);
    try {
      const response = await fetch('/api/city', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: city.slug }),
      });
      if (!response.ok) return;
      // Full reload, not router.refresh(): the city is a global data axis, and
      // a soft refresh leaves client leaves holding the previous city's state
      // (FeedGrid seeds its items once, MapView reads `initialViewState` only
      // on mount). Filters go with it — they are city-specific (neighborhoods
      // above all), so carrying them over would land on an empty feed.
      window.location.assign(window.location.pathname);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (matches.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setHighlight((i) => (i + step + matches.length) % matches.length);
      return;
    }
    if (e.key === 'Enter' && open && matches[highlight]) {
      e.preventDefault();
      void select(matches[highlight]);
    }
  }

  return (
    <div className="city-search" ref={rootRef}>
      <label className="search" data-pending={pending || undefined}>
        <Icon name="search" size={16} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={active.name}
          role="combobox"
          aria-expanded={open}
          aria-controls="city-search-listbox"
          aria-autocomplete="list"
          aria-label={`Change city — currently ${active.name}`}
        />
        <span className="search-kbd" aria-hidden="true">
          ⌘ K
        </span>
      </label>

      {open ? (
        <ul className="city-menu" id="city-search-listbox" role="listbox">
          {matches.length === 0 ? (
            <li className="city-menu-empty">No city matches “{query}”.</li>
          ) : (
            matches.map((city, index) => (
              <li key={city.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={city.slug === active.slug}
                  className="city-option"
                  data-active={city.slug === active.slug || undefined}
                  data-highlighted={index === highlight || undefined}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => void select(city)}
                >
                  <Icon name="compass" size={14} />
                  <span className="city-option-name">{city.name}</span>
                  <span className="city-option-country">{city.country}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
