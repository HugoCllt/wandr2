import type { ActivityDTO } from './ActivityDTO';

export type FeedItemDTO = ActivityDTO & {
  matchScore: number;
  isFavorited: boolean;
  /** True when the activity is bookmarked (present on the user's calendar). */
  isBookmarked: boolean;
};

export type FeedResultDTO = {
  items: FeedItemDTO[];
  nextCursor: string | null;
};
