import type {
  ActivityCategory,
  ActivityKind,
  ActivityStatus,
} from '../../modules/activities/domain/Activity';

export type ActivityDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageCredit: string | null;
  kind: ActivityKind;
  category: ActivityCategory;
  address: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  dateStart: string | null;
  dateEnd: string | null;
  priceMinCents: number;
  priceMaxCents: number | null;
  externalUrl: string | null;
  indoor: boolean;
  outdoor: boolean;
  isFeatured: boolean;
  status: ActivityStatus;
  sourceId: string;
  externalId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
