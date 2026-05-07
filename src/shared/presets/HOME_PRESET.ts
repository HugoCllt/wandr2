import type { FilterValueDTO } from '../contracts/FilterValueDTO';

export type FilterKey =
  | 'kind'
  | 'neighborhood'
  | 'date'
  | 'category'
  | 'price'
  | 'indoor-outdoor'
  | 'free-paid';

export type GridVariant = 'standard' | 'compact';

export type PageSections = {
  hero: boolean;
  map: boolean;
};

export type PagePreset = {
  baseFilters: FilterValueDTO;
  visibleFilters: FilterKey[];
  gridVariant: GridVariant;
  sections: PageSections;
};

export const HOME_PRESET: PagePreset = {
  baseFilters: {},
  visibleFilters: [
    'kind',
    'neighborhood',
    'date',
    'category',
    'price',
    'indoor-outdoor',
    'free-paid',
  ],
  gridVariant: 'standard',
  sections: { hero: false, map: false },
};
