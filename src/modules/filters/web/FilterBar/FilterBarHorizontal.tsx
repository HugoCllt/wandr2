'use client';

import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../../../shared/contracts/FilterValueDTO';
import type { FilterKey } from '../../../../shared/presets/HOME_PRESET';
import { DateFilter } from './DateFilter';
import { FilterPill } from './FilterPill';
import { FreePaidToggle } from './FreePaidToggle';
import { IndoorOutdoorToggle } from './IndoorOutdoorToggle';
import { KindToggle } from './KindToggle';
import { NeighborhoodFilter } from './NeighborhoodFilter';
import { PriceFilter } from './PriceFilter';

type FilterBarHorizontalProps = {
  value: FilterValueDTO;
  onChange: (next: FilterValueDTO) => void;
  neighborhoods: ReadonlyArray<string>;
  visibleFilters?: FilterKey[];
  /** "rail" stacks the pills vertically and opens popovers to the right. */
  orientation?: 'horizontal' | 'rail';
};

const ALL_FILTERS: FilterKey[] = [
  'kind',
  'neighborhood',
  'date',
  'price',
  'indoor-outdoor',
  'free-paid',
];

export function FilterBarHorizontal({
  value,
  onChange,
  neighborhoods,
  visibleFilters = ALL_FILTERS,
  orientation = 'horizontal',
}: FilterBarHorizontalProps): ReactElement {
  const side = orientation === 'rail' ? 'right' : 'bottom';
  const containerClass = orientation === 'rail' ? 'filter-rail-list' : 'filter-bar-top';
  function update(patch: Partial<FilterValueDTO>): void {
    const next: FilterValueDTO = { ...value, ...patch };
    for (const key of Object.keys(patch) as Array<keyof FilterValueDTO>) {
      if (next[key] === undefined) delete next[key];
    }
    onChange(next);
  }

  function clear(...keys: Array<keyof FilterValueDTO>): void {
    const next: FilterValueDTO = { ...value };
    for (const k of keys) delete next[k];
    onChange(next);
  }

  function clearAll(): void {
    onChange({});
  }

  const visible = new Set(visibleFilters);
  const anyActive =
    value.kind !== undefined ||
    (value.neighborhood && value.neighborhood.length > 0) ||
    value.date !== undefined ||
    value.priceMax !== undefined ||
    value.indoor === true ||
    value.outdoor === true ||
    value.free === true ||
    value.paid === true;

  return (
    <div className={containerClass} aria-label="Filters">
      {visible.has('kind') && (
        <FilterPill
          label="Kind"
          summary={summarizeKind(value.kind)}
          active={value.kind !== undefined}
          onClear={() => clear('kind')}
          side={side}
        >
          <KindToggle value={value.kind} onChange={(kind) => update({ kind })} />
        </FilterPill>
      )}

      {visible.has('neighborhood') && (
        <FilterPill
          label="Neighborhood"
          summary={summarizeNeighborhood(value.neighborhood)}
          active={(value.neighborhood?.length ?? 0) > 0}
          onClear={() => clear('neighborhood')}
          side={side}
        >
          <NeighborhoodFilter
            value={value.neighborhood}
            options={neighborhoods}
            onChange={(neighborhood) => update({ neighborhood })}
          />
        </FilterPill>
      )}

      {visible.has('date') && (
        <FilterPill
          label="Date"
          summary={summarizeDate(value.date)}
          active={value.date !== undefined}
          onClear={() => clear('date')}
          side={side}
        >
          <DateFilter value={value.date} onChange={(date) => update({ date })} />
        </FilterPill>
      )}

      {visible.has('price') && (
        <FilterPill
          label="Price"
          summary={summarizePrice(value.priceMax)}
          active={value.priceMax !== undefined}
          onClear={() => clear('priceMax')}
          side={side}
        >
          <PriceFilter value={value.priceMax} onChange={(priceMax) => update({ priceMax })} />
        </FilterPill>
      )}

      {visible.has('indoor-outdoor') && (
        <FilterPill
          label="Setting"
          summary={summarizeSetting(value.indoor, value.outdoor)}
          active={value.indoor === true || value.outdoor === true}
          onClear={() => clear('indoor', 'outdoor')}
          side={side}
        >
          <IndoorOutdoorToggle
            indoor={value.indoor}
            outdoor={value.outdoor}
            onChange={(patch) => update(patch)}
          />
        </FilterPill>
      )}

      {visible.has('free-paid') && (
        <FilterPill
          label="Cost"
          summary={summarizeCost(value.free, value.paid)}
          active={value.free === true || value.paid === true}
          onClear={() => clear('free', 'paid')}
          side={side}
        >
          <FreePaidToggle
            free={value.free}
            paid={value.paid}
            onChange={(patch) => update(patch)}
          />
        </FilterPill>
      )}

      {anyActive && (
        <button type="button" className="filter-clear-all" onClick={clearAll}>
          Clear all
        </button>
      )}
    </div>
  );
}

function summarizeKind(kind: FilterValueDTO['kind']): string | null {
  if (kind === 'EVENT') return 'Events';
  if (kind === 'PLACE') return 'Places';
  return null;
}

function summarizeNeighborhood(value: FilterValueDTO['neighborhood']): string | null {
  if (!value || value.length === 0) return null;
  if (value.length === 1) return value[0];
  return `${value[0]} +${value.length - 1}`;
}

function summarizeDate(date: FilterValueDTO['date']): string | null {
  if (date === undefined) return null;
  if (date === 'today') return 'Today';
  if (date === 'weekend') return 'This weekend';
  return `${date.from} → ${date.to}`;
}

function summarizePrice(priceMax: FilterValueDTO['priceMax']): string | null {
  if (priceMax === undefined) return null;
  return `≤ $${priceMax}`;
}

function summarizeSetting(
  indoor: FilterValueDTO['indoor'],
  outdoor: FilterValueDTO['outdoor'],
): string | null {
  const tags: string[] = [];
  if (indoor === true) tags.push('Indoor');
  if (outdoor === true) tags.push('Outdoor');
  return tags.length ? tags.join(' + ') : null;
}

function summarizeCost(
  free: FilterValueDTO['free'],
  paid: FilterValueDTO['paid'],
): string | null {
  const tags: string[] = [];
  if (free === true) tags.push('Free');
  if (paid === true) tags.push('Paid');
  return tags.length ? tags.join(' + ') : null;
}
