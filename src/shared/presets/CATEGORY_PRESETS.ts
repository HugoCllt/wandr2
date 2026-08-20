import type { FilterValueDTO } from '../contracts/FilterValueDTO';
import type { IconName } from '../ui/icons/Icon';
import type { FilterKey, PagePreset } from './HOME_PRESET';

export type CategoryKey = 'sport' | 'dining' | 'culture' | 'outdoor' | 'nightlife' | 'romantic';

/**
 * The single source of truth for a category page. Holds copy, base filters, and the
 * Nav slot the category lives in. Adding a category = one entry here; the dynamic
 * `[category]` route and the Nav both derive from this registry.
 */
export type CategoryPresetConfig = {
  key: CategoryKey;
  label: string;
  icon: IconName;
  /** Hero eyebrow template. `{city}` is substituted with the browsed city name. */
  eyebrow: string;
  heroTitle: string;
  heroSub: string;
  heroImage: string;
  baseFilters: FilterValueDTO;
  visibleFilters: FilterKey[];
  /** Nav placement. `primary` = visible top-bar link; `overflow` = "More" menu. */
  nav: 'primary' | 'overflow';
};

const SHARED_FILTERS: FilterKey[] = [
  'kind',
  'neighborhood',
  'date',
  'price',
  'indoor-outdoor',
  'free-paid',
];

export const CATEGORY_PRESETS: Record<CategoryKey, CategoryPresetConfig> = {
  sport: {
    key: 'sport',
    label: 'Sport',
    icon: 'ball',
    eyebrow: 'SPORT IN {city}',
    heroTitle: 'Watch the city\nplay.',
    heroSub:
      'From front-row hockey nights to padel courts, climbing walls and sunrise yoga on the mountain — your sport, curated.',
    heroImage:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
    baseFilters: { category: ['SPORT'] },
    visibleFilters: SHARED_FILTERS,
    nav: 'primary',
  },
  dining: {
    key: 'dining',
    label: 'Dining',
    icon: 'fork',
    eyebrow: 'EAT IN {city}',
    heroTitle: 'Tables worth\nshowing up for.',
    heroSub: 'Plates from chefs the city is talking about — bistros, terrasses, late-night counters.',
    heroImage:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=80',
    baseFilters: { category: ['FOOD'] },
    visibleFilters: SHARED_FILTERS,
    nav: 'primary',
  },
  culture: {
    key: 'culture',
    label: 'Culture',
    icon: 'culture',
    eyebrow: 'CULTURE IN {city}',
    heroTitle: 'Galleries, stages,\nlate-night sets.',
    heroSub: 'Music, museums, mural festivals — the parts of the city that hold a story.',
    heroImage:
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80',
    baseFilters: { category: ['CULTURE'] },
    visibleFilters: SHARED_FILTERS,
    nav: 'primary',
  },
  outdoor: {
    key: 'outdoor',
    label: 'Outdoor',
    icon: 'leaf',
    eyebrow: 'OUTDOOR IN {city}',
    heroTitle: 'Open sky, all\nseason long.',
    heroSub: 'Trails, parks, waterfront runs and rooftop sails when the city steps outside.',
    heroImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    baseFilters: { category: ['OUTDOOR'] },
    visibleFilters: SHARED_FILTERS,
    nav: 'primary',
  },
  nightlife: {
    key: 'nightlife',
    label: 'Nightlife',
    icon: 'moon',
    eyebrow: 'NIGHTLIFE IN {city}',
    heroTitle: "When the city\nturns the lights down.",
    heroSub: 'Rooftop DJ sets, basement jazz, late-night counters and the steady glow of the Plateau.',
    heroImage:
      'https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=1600&q=80',
    baseFilters: { category: ['NIGHTLIFE'] },
    visibleFilters: SHARED_FILTERS,
    nav: 'primary',
  },
  romantic: {
    key: 'romantic',
    label: 'Romantic',
    icon: 'heart',
    eyebrow: 'ROMANTIC IN {city}',
    heroTitle: 'Plans for two,\nbeautifully made.',
    heroSub: 'Hidden courtyards, candle-lit tables, sunset sails — the city at its most cinematic.',
    heroImage:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80',
    baseFilters: { category: ['ROMANTIC'] },
    visibleFilters: SHARED_FILTERS,
    nav: 'overflow',
  },
};

export const CATEGORY_KEYS: CategoryKey[] = [
  'sport',
  'dining',
  'culture',
  'outdoor',
  'nightlife',
  'romantic',
];

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as string[]).includes(value);
}

export function categoryPresetAsPage(key: CategoryKey): PagePreset {
  const cfg = CATEGORY_PRESETS[key];
  return {
    baseFilters: cfg.baseFilters,
    visibleFilters: cfg.visibleFilters,
    gridVariant: 'standard',
    sections: { hero: true, map: false },
  };
}
