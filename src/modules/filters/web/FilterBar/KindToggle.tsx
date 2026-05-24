import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../../../shared/contracts/FilterValueDTO';
import { KIND_OPTIONS } from './filter-options';
import { filterStyles } from './styles';

type KindToggleProps = {
  value: FilterValueDTO['kind'];
  onChange: (next: FilterValueDTO['kind']) => void;
};

export function KindToggle({ value, onChange }: KindToggleProps): ReactElement {
  return (
    <fieldset style={filterStyles.group}>
      <legend style={filterStyles.legend}>Kind</legend>
      <div role="radiogroup" aria-label="Activity kind" style={filterStyles.chipRow}>
        {KIND_OPTIONS.map((option) => {
          const selected = option.value === 'ALL' ? value === undefined : value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-selected={selected || undefined}
              onClick={() => onChange(option.value === 'ALL' ? undefined : option.value)}
              style={
                selected
                  ? { ...filterStyles.chip, ...filterStyles.chipSelected }
                  : filterStyles.chip
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
