import type { ActivityCategorySet } from './ActivityCategorySet';

export const ActivityKinds = ['EVENT', 'PLACE'] as const;
export type ActivityKind = (typeof ActivityKinds)[number];

export const ActivityStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ActivityStatus = (typeof ActivityStatuses)[number];

export type Activity = {
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
  dateStart: Date | null;
  dateEnd: Date | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  externalUrl: string | null;
  indoor: boolean;
  outdoor: boolean;
  isFeatured: boolean;
  status: ActivityStatus;
  sourceId: string;
  cityId: string;
  dedupeKey: string;
  expiresAt: Date | null;
  lastSeenAt: Date;
  lastVerifiedAt: Date | null;
  recheckAfter: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
