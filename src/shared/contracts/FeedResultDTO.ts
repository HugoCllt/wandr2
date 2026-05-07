import type { ActivityDTO } from './ActivityDTO';

export type FeedItemDTO = ActivityDTO & {
  matchScore: number;
  isFavorited: boolean;
};

export type FeedResultDTO = {
  items: FeedItemDTO[];
  nextCursor: string | null;
};
