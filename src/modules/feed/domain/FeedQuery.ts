import type { Activity } from '../../activities/domain/Activity';
import type { FilterValue } from '../../filters/domain/FilterValue';

export const DEFAULT_FEED_LIMIT = 12;
export const DEFAULT_MATCH_SCORE = 5;

export type FeedQuery = {
  filters: FilterValue;
  cursor: string | null;
  limit: number;
};

export type RankedActivity = Activity & {
  matchScore: number;
};

export type FeedResult = {
  items: RankedActivity[];
  nextCursor: string | null;
};
