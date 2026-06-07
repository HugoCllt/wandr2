'use client';

import { useCallback } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { useActivityContext } from '../ActivityModal/ActivityProvider';

export { coverImageUrl } from './coverImage';

export function formatActivityPrice(activity: ActivityDTO): string {
  if (activity.priceMinCents <= 0 && (activity.priceMaxCents === null || activity.priceMaxCents === 0)) {
    return 'Gratuit';
  }
  const min = Math.round(activity.priceMinCents / 100);
  if (activity.priceMaxCents === null || activity.priceMaxCents === activity.priceMinCents) {
    return `${min} $+`;
  }
  return `${min}–${Math.round(activity.priceMaxCents / 100)} $`;
}

export function formatActivityWhen(activity: ActivityDTO): string {
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

export function formatActivityWhere(activity: ActivityDTO): string {
  return activity.neighborhood ?? 'Montréal';
}

export function useOpenActivity() {
  const { open } = useActivityContext();
  return useCallback(
    (activity: ActivityDTO) => {
      open(activity);
    },
    [open],
  );
}
