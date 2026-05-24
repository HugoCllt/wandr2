import type { ActivityCategory } from '../../activities/domain/Activity';
import type { FilterValue } from '../../filters/domain/FilterValue';
import type { GetFeedUseCase } from '../../feed/application/GetFeedUseCase';
import type { FeedResult } from '../../feed/domain/FeedQuery';
import type { IFavoriteRepository } from '../domain/IFavoriteRepository';

export type ListFavoritesInput = {
  userId: string;
  filters: FilterValue;
  cursor: string | null;
  limit?: number;
  affinityMap: Map<ActivityCategory, number>;
  now: Date;
  cityId: string;
  baseFilters?: FilterValue;
};

export class ListFavoritesUseCase {
  constructor(
    private readonly favorites: IFavoriteRepository,
    private readonly feed: GetFeedUseCase,
  ) {}

  async execute(input: ListFavoritesInput): Promise<FeedResult> {
    const ids = await this.favorites.listActivityIdsForUser(input.userId);
    if (ids.length === 0) return { items: [], nextCursor: null };

    return this.feed.execute({
      filters: input.filters,
      cursor: input.cursor,
      limit: input.limit,
      affinityMap: input.affinityMap,
      now: input.now,
      cityId: input.cityId,
      baseFilters: input.baseFilters,
      activityIds: ids,
    });
  }
}
