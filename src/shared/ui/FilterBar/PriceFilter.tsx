'use client';

import type { ChangeEvent, ReactElement } from 'react';

import type { FilterValueDTO } from '../../contracts/FilterValueDTO';
import { filterStyles } from './styles';

type PriceFilterProps = {
  value: FilterValueDTO['priceMax'];
  onChange: (next: FilterValueDTO['priceMax']) => void;
};

export function PriceFilter({ value, onChange }: PriceFilterProps): ReactElement {
  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const raw = e.target.value;
    if (raw === '') {
      onChange(undefined);
      return;
    }
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 0) onChange(n);
  }

  return (
    <fieldset style={filterStyles.group}>
      <legend style={filterStyles.legend}>Max price (CAD)</legend>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value ?? ''}
        placeholder="Any"
        onChange={handleChange}
        aria-label="Maximum price in dollars"
        style={filterStyles.numberInput}
      />
    </fieldset>
  );
}
