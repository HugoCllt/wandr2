import type { ActivityCategory, ActivityKind, ActivityStatus } from './Activity';

export type ActivityCandidateCriteria = {
  status: ActivityStatus;
  cityId: string;
  notExpiredAsOf?: Date;
  kinds?: ActivityKind[];
  categories?: ActivityCategory[];
  neighborhoods?: string[];
  priceMaxCents?: number;
  indoor?: true;
  outdoor?: true;
  free?: true;
  paid?: true;
  eventDateWindow?: { from: Date; to: Date };
  activityIds?: string[];
};
