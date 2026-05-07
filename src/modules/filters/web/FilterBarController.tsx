'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../../shared/contracts/FilterValueDTO';
import { FilterBar } from '../../../shared/ui/FilterBar';
import { serializeFilters } from '../application/url-codec';

type FilterBarControllerProps = {
  value: FilterValueDTO;
  neighborhoods: ReadonlyArray<string>;
};

export function FilterBarController({
  value,
  neighborhoods,
}: FilterBarControllerProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: FilterValueDTO): void {
    const qs = serializeFilters(next).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url, { scroll: false });
  }

  return <FilterBar value={value} onChange={handleChange} neighborhoods={neighborhoods} />;
}
