import type { CategoryKey } from '@wandr/shared';

export const CATEGORY_KEY_LABEL: Record<CategoryKey, string> = {
  sport: 'Sport',
  dining: 'Gastronomie',
  culture: 'Culture',
  outdoor: 'Plein air',
  nightlife: 'Vie nocturne',
  romantic: 'Romantique',
};

export const CATEGORY_KEY_EYEBROW: Record<CategoryKey, string> = {
  sport: 'SPORT À {city}',
  dining: 'GASTRONOMIE À {city}',
  culture: 'CULTURE À {city}',
  outdoor: 'PLEIN AIR À {city}',
  nightlife: 'VIE NOCTURNE À {city}',
  romantic: 'ROMANTIQUE À {city}',
};
