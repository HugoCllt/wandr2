import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../contracts/FilterValueDTO';
import { filterStyles } from './styles';

type NeighborhoodFilterProps = {
  value: FilterValueDTO['neighborhood'];
  options: ReadonlyArray<string>;
  onChange: (next: FilterValueDTO['neighborhood']) => void;
};

export function NeighborhoodFilter({
  value,
  options,
  onChange,
}: NeighborhoodFilterProps): ReactElement {
  const selected = new Set(value ?? []);

  function toggle(option: string): void {
    const next = new Set(selected);
    if (next.has(option)) {
      next.delete(option);
    } else {
      next.add(option);
    }
    const list = [...next];
    onChange(list.length === 0 ? undefined : list);
  }

  return (
    <fieldset style={filterStyles.group}>
      <legend style={filterStyles.legend}>Neighborhood</legend>
      <div style={filterStyles.chipRow}>
        {options.map((option) => {
          const isSelected = selected.has(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              data-selected={isSelected || undefined}
              onClick={() => toggle(option)}
              style={
                isSelected
                  ? { ...filterStyles.chip, ...filterStyles.chipSelected }
                  : filterStyles.chip
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
