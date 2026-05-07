import type { ActivityDTO } from './ActivityDTO';

export type FeedItemDTO = ActivityDTO & {
  matchScore: number;
};

export type FeedResultDTO = {
  items: FeedItemDTO[];
  nextCursor: string | null;
};
