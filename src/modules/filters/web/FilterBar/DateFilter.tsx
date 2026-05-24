'use client';

import { useState, type ReactElement } from 'react';

import type { FilterValueDTO } from '../../../../shared/contracts/FilterValueDTO';
import { DATE_PRESET_OPTIONS } from './filter-options';
import { filterStyles } from './styles';

type DateFilterProps = {
  value: FilterValueDTO['date'];
  onChange: (next: FilterValueDTO['date']) => void;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRange(value: FilterValueDTO['date']): value is { from: string; to: string } {
  return typeof value === 'object' && value !== null;
}

export function DateFilter({ value, onChange }: DateFilterProps): ReactElement {
  const [showRange, setShowRange] = useState(isRange(value));
  const range = isRange(value) ? value : { from: '', to: '' };

  function setPreset(preset: 'today' | 'weekend'): void {
    setShowRange(false);
    onChange(value === preset ? undefined : preset);
  }

  function setRangePart(part: 'from' | 'to', next: string): void {
    const merged = { ...range, [part]: next };
    if (
      ISO_DATE_PATTERN.test(merged.from) &&
      ISO_DATE_PATTERN.test(merged.to) &&
      merged.to >= merged.from
    ) {
      onChange(merged);
    }
  }

  return (
    <fieldset style={filterStyles.group}>
      <legend style={filterStyles.legend}>Date</legend>
      <div role="radiogroup" aria-label="Date preset" style={filterStyles.chipRow}>
        {DATE_PRESET_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-selected={selected || undefined}
              onClick={() => setPreset(option.value)}
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
        <button
          type="button"
          aria-pressed={showRange}
          data-selected={showRange || undefined}
          onClick={() => {
            const next = !showRange;
            setShowRange(next);
            if (!next && isRange(value)) onChange(undefined);
          }}
          style={
            showRange ? { ...filterStyles.chip, ...filterStyles.chipSelected } : filterStyles.chip
          }
        >
          Custom
        </button>
      </div>

      {showRange ? (
        <div style={filterStyles.rangeRow}>
          <label style={{ flex: 1 }}>
            <span style={filterStyles.legend}>From</span>
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRangePart('from', e.target.value)}
              style={filterStyles.input}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span style={filterStyles.legend}>To</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRangePart('to', e.target.value)}
              style={filterStyles.input}
            />
          </label>
        </div>
      ) : null}
    </fieldset>
  );
}
