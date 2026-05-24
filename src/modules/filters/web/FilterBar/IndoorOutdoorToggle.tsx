import type { ReactElement } from 'react';

import type { FilterValueDTO } from '../../../../shared/contracts/FilterValueDTO';
import { filterStyles } from './styles';

type IndoorOutdoorToggleProps = {
  indoor: FilterValueDTO['indoor'];
  outdoor: FilterValueDTO['outdoor'];
  onChange: (patch: Pick<FilterValueDTO, 'indoor' | 'outdoor'>) => void;
};

export function IndoorOutdoorToggle({
  indoor,
  outdoor,
  onChange,
}: IndoorOutdoorToggleProps): ReactElement {
  return (
    <fieldset style={filterStyles.group}>
      <legend style={filterStyles.legend}>Setting</legend>
      <div style={filterStyles.chipRow}>
        <ToggleChip
          label="Indoor"
          selected={indoor === true}
          onClick={() => onChange({ indoor: indoor === true ? undefined : true })}
        />
        <ToggleChip
          label="Outdoor"
          selected={outdoor === true}
          onClick={() => onChange({ outdoor: outdoor === true ? undefined : true })}
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
