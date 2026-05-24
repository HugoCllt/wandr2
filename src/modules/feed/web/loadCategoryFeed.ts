import { CATEGORY_PRESETS, type CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { loadFeedDTO } from './feedRoute';
import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';

export async function loadCategoryFeedDTO(
  categoryKey: CategoryKey,
  searchParams: URLSearchParams,
): Promise<FeedResultDTO> {
  return loadFeedDTO(searchParams, CATEGORY_PRESETS[categoryKey].baseFilters);
}
