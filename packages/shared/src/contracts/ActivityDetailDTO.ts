import type { ActivityDTO } from './ActivityDTO';

export type ActivityDetailDTO = ActivityDTO & {
  isFavorited?: boolean;
  isBookmarked?: boolean;
};
