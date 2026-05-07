import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../contracts/FilterValueDTO';
import { filterStyles } from './styles';

type FreePaidToggleProps = {
  free: FilterValueDTO['free'];
  paid: FilterValueDTO['paid'];
  onChange: (patch: Pick<FilterValueDTO, 'free' | 'paid'>) => void;
};

export function FreePaidToggle({ free, paid, onChange }: FreePaidToggleProps): ReactElement {
  return (
    <fieldset style={filterStyles.group}>
      <legend style={filterStyles.legend}>Cost</legend>
      <div style={filterStyles.chipRow}>
        <ToggleChip
          label="Free"
          selected={free === true}
          onClick={() => onChange({ free: free === true ? undefined : true })}
        />
        <ToggleChip
          label="Paid"
          selected={paid === true}
          onClick={() => onChange({ paid: paid === true ? undefined : true })}
        />
      </div>
    </fieldset>
  );
}

function ToggleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      data-selected={selected || undefined}
      onClick={onClick}
      style={selected ? { ...filterStyles.chip, ...filterStyles.chipSelected } : filterStyles.chip}
    >
      {label}
    </button>
  );
}
