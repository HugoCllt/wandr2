import type { PagePreset } from './HOME_PRESET';

export const FAVORITES_PRESET: PagePreset = {
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
