import type { ActivityKind, ActivityStatus } from '../../modules/activities/domain/Activity';
import type { ActivityCategorySet } from '../../modules/activities/domain/ActivityCategorySet';

export type ActivityDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  kind: ActivityKind;
  categories: ActivityCategorySet;
  address: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  dateStart: string | null;
  dateEnd: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  externalUrl: string | null;
  indoor: boolean;
  outdoor: boolean;
  isFeatured: boolean;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
};
