import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../../../shared/contracts/FilterValueDTO';
import { filterStyles } from './styles';

/** A selectable neighborhood; `disabled` greys out ones with no data in context. */
export type NeighborhoodOption = {
  name: string;
  disabled?: boolean;
};

type NeighborhoodFilterProps = {
  value: FilterValueDTO['neighborhood'];
  options: ReadonlyArray<NeighborhoodOption>;
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
          const isSelected = selected.has(option.name);
          // Never disable a chip that's already picked, so it can be cleared.
          const isDisabled = option.disabled === true && !isSelected;
          return (
            <button
              key={option.name}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={isDisabled}
              data-selected={isSelected || undefined}
              onClick={() => toggle(option.name)}
              style={{
                ...filterStyles.chip,
                ...(isSelected ? filterStyles.chipSelected : null),
                ...(isDisabled ? filterStyles.chipDisabled : null),
              }}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
