import type { FilterValueDTO } from '../../contracts/FilterValueDTO';

export const KIND_OPTIONS: ReadonlyArray<{
  value: NonNullable<FilterValueDTO['kind']> | 'ALL';
  label: string;
}> = [
  { value: 'ALL', label: 'All' },
  { value: 'EVENT', label: 'Events' },
  { value: 'PLACE', label: 'Places' },
];

export const CATEGORY_OPTIONS: ReadonlyArray<{
  value: NonNullable<FilterValueDTO['category']>[number];
  label: string;
}> = [
  { value: 'SPORT', label: 'Sport' },
  { value: 'ROMANTIC', label: 'Romantic' },
  { value: 'FOOD', label: 'Food' },
  { value: 'CULTURE', label: 'Culture' },
  { value: 'OUTDOOR', label: 'Outdoor' },
  { value: 'NIGHTLIFE', label: 'Nightlife' },
];

export const DATE_PRESET_OPTIONS: ReadonlyArray<{
  value: 'today' | 'weekend';
  label: string;
}> = [
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This weekend' },
];
