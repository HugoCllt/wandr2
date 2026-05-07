import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../contracts/FilterValueDTO';
import { CATEGORY_OPTIONS } from './filter-options';
import { filterStyles } from './styles';

type CategoryFilterProps = {
  value: FilterValueDTO['category'];
  onChange: (next: FilterValueDTO['category']) => void;
};

type CategoryValue = NonNullable<FilterValueDTO['category']>[number];

export function CategoryFilter({ value, onChange }: CategoryFilterProps): ReactElement {
  const selected = new Set<CategoryValue>(value ?? []);

  function toggle(option: CategoryValue): void {
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
      <legend style={filterStyles.legend}>Category</legend>
      <div style={filterStyles.chipRow}>
        {CATEGORY_OPTIONS.map((option) => {
          const isSelected = selected.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              data-selected={isSelected || undefined}
              onClick={() => toggle(option.value)}
              style={
                isSelected
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
