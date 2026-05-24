import type { PagePreset } from './HOME_PRESET';

export const SPORT_PRESET: PagePreset = {
  baseFilters: { category: ['SPORT'] },
  visibleFilters: ['kind', 'neighborhood', 'date', 'price', 'indoor-outdoor', 'free-paid'],
  gridVariant: 'standard',
  sections: { hero: true, map: false },
};
