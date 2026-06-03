import { CategoryFeedPage } from '../../../modules/feed/web/CategoryFeedPage';
import { loadCategoryFeedDTO } from '../../../modules/feed/web/loadCategoryFeed';
import { POOL_LIMIT } from '../../../modules/feed/web/buildFeedSections';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import type { CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { toURLSearchParams, type SearchParamsInput } from './searchParams';

export async function renderCategoryPage(categoryKey: CategoryKey, searchParams: SearchParamsInput) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const poolParams = new URLSearchParams(params);
  poolParams.set('limit', String(POOL_LIMIT));

  const initialFeed = await loadCategoryFeedDTO(categoryKey, poolParams);
  const filterQueryString = serializeFilters(filters).toString();

  return (
    <CategoryFeedPage
      categoryKey={categoryKey}
      initialFeed={initialFeed}
      filterQueryString={filterQueryString}
    />
  );
}
