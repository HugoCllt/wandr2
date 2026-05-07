'use client';

import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../contracts/FilterValueDTO';
import { CategoryFilter } from './CategoryFilter';
import { DateFilter } from './DateFilter';
import { FreePaidToggle } from './FreePaidToggle';
import { IndoorOutdoorToggle } from './IndoorOutdoorToggle';
import { KindToggle } from './KindToggle';
import { NeighborhoodFilter } from './NeighborhoodFilter';
import { PriceFilter } from './PriceFilter';
import { filterStyles } from './styles';

type FilterBarProps = {
  value: FilterValueDTO;
  onChange: (next: FilterValueDTO) => void;
  neighborhoods: ReadonlyArray<string>;
};

export function FilterBar({ value, onChange, neighborhoods }: FilterBarProps): ReactElement {
  function update(patch: Partial<FilterValueDTO>): void {
    const next: FilterValueDTO = { ...value, ...patch };
    for (const key of Object.keys(patch) as Array<keyof FilterValueDTO>) {
      if (next[key] === undefined) delete next[key];
    }
    onChange(next);
  }

  return (
    <aside aria-label="Filters" style={filterStyles.bar}>
      <KindToggle value={value.kind} onChange={(kind) => update({ kind })} />
      <NeighborhoodFilter
        value={value.neighborhood}
        options={neighborhoods}
        onChange={(neighborhood) => update({ neighborhood })}
      />
      <DateFilter value={value.date} onChange={(date) => update({ date })} />
      <CategoryFilter value={value.category} onChange={(category) => update({ category })} />
      <PriceFilter value={value.priceMax} onChange={(priceMax) => update({ priceMax })} />
      <IndoorOutdoorToggle
        indoor={value.indoor}
        outdoor={value.outdoor}
        onChange={(patch) => update(patch)}
      />
      <FreePaidToggle free={value.free} paid={value.paid} onChange={(patch) => update(patch)} />
    </aside>
  );
}
