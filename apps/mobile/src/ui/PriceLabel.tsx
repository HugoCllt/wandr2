import type { ActivityDTO } from '@wandr/shared';
import type { StyleProp, TextStyle } from 'react-native';
import { AppText } from './AppText';

export function formatActivityPrice(activity: Pick<ActivityDTO, 'priceMinCents' | 'priceMaxCents'>): string | null {
  if (activity.priceMinCents === null) return null;
  if (activity.priceMinCents <= 0 && (activity.priceMaxCents === null || activity.priceMaxCents === 0)) {
    return 'Gratuit';
  }
  const min = Math.round(activity.priceMinCents / 100);
  if (activity.priceMaxCents === null || activity.priceMaxCents === activity.priceMinCents) {
    return `${min} $+`;
  }
  return `${min}–${Math.round(activity.priceMaxCents / 100)} $`;
}

type PriceLabelProps = {
  activity: Pick<ActivityDTO, 'priceMinCents' | 'priceMaxCents'>;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function PriceLabel({ activity, color, style }: PriceLabelProps) {
  const price = formatActivityPrice(activity);
  if (!price) return null;
  return (
    <AppText variant="caption" color={color} style={style}>
      {price}
    </AppText>
  );
}
