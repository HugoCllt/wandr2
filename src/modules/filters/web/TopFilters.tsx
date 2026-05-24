'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../../shared/contracts/FilterValueDTO';
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
    <FilterBarHorizontal
      value={value}
      onChange={handleChange}
      neighborhoods={neighborhoods}
    />
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
