import type { ActivityCategory } from '../../domain/ActivityCategorySet';
import type { IconName } from '../../../../shared/ui/icons/Icon';

// Icon map is verbatim from design spec §5.3. Labels are French (decision D3);
// CATEGORY_OPTIONS would give English, so the FR labels live here instead.
const CATEGORY_ICON: Record<ActivityCategory, IconName> = {
  SPORT: 'ball',
  ROMANTIC: 'heart',
  FOOD: 'fork',
  CULTURE: 'culture',
  OUTDOOR: 'leaf',
  NIGHTLIFE: 'moon',
};

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  SPORT: 'Sport',
  ROMANTIC: 'Romantique',
  FOOD: 'Gastronomie',
  CULTURE: 'Culture',
  OUTDOOR: 'Plein air',
  NIGHTLIFE: 'Vie nocturne',
};

export function categoryIconFor(category: ActivityCategory): IconName {
  return CATEGORY_ICON[category];
}

export function categoryLabelFor(category: ActivityCategory): string {
  return CATEGORY_LABEL[category];
}
