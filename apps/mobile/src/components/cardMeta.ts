import type { ActivityCategory, ActivityDTO } from '@wandr/shared';
import type { IconName } from '../ui/Icon';

const DEFAULT_CITY_NAME = 'Montréal';

export function formatActivityWhen(activity: Pick<ActivityDTO, 'kind' | 'dateStart'>): string {
  if (activity.kind === 'PLACE') return 'Ouvert tous les jours';
  if (!activity.dateStart) return 'À venir';
  const d = new Date(activity.dateStart);
  return d.toLocaleString('fr-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatActivityWhere(activity: Pick<ActivityDTO, 'neighborhood'>): string {
  return activity.neighborhood ?? DEFAULT_CITY_NAME;
}

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
