'use client';

import { useLenis } from 'lenis/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type ReactElement } from 'react';

import type { FilterValueDTO } from '../../../shared/contracts/FilterValueDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { FilterBarHorizontal } from './FilterBar';
import { parseFilters, serializeFilters } from '../application/url-codec';

type TopFiltersProps = {
  neighborhoods: ReadonlyArray<string>;
};

const PRESERVED_KEYS = new Set<string>();

export function TopFilters({ neighborhoods }: TopFiltersProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [open, setOpen] = useState(false);

  // The desktop rail stays hidden behind the hero, then slides up from under it
  // once you scroll roughly past the hero (reversible). Only re-renders when the
  // boolean actually flips, not every scroll frame.
  const [revealed, setRevealed] = useState(false);
  useLenis(({ scroll }) => {
    const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.3 : 320;
    const next = scroll > threshold;
    setRevealed((prev) => (prev === next ? prev : next));
  });

  const params = new URLSearchParams();
  search.forEach((v, k) => params.set(k, v));
  const value = parseFilters(params);

  function handleChange(next: FilterValueDTO): void {
    const filterParams = serializeFilters(next);
    const merged = new URLSearchParams();
    search.forEach((v, k) => {
      if (PRESERVED_KEYS.has(k) || !FILTER_KEYS.has(k)) merged.set(k, v);
    });
    filterParams.forEach((v, k) => merged.set(k, v));
    const qs = merged.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url, { scroll: false });
  }

  return (
    <>
      <button
        type="button"
        className="filter-rail-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Filters"
      >
        <Icon name="menu" size={16} />
        Filters
      </button>
      <aside
        className={'filter-rail' + (open ? ' open' : '') + (revealed ? ' revealed' : '')}
        aria-label="Filters"
      >
        <FilterBarHorizontal
          orientation="rail"
          value={value}
          onChange={handleChange}
          neighborhoods={neighborhoods}
        />
      </aside>
    </>
  );
}

const FILTER_KEYS = new Set([
  'kind',
  'neighborhood',
  'date',
  'category',
  'priceMax',
  'indoor',
  'outdoor',
  'free',
  'paid',
]);
