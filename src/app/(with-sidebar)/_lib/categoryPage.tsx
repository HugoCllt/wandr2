import { CategoryFeedPage } from '../../../modules/feed/web/CategoryFeedPage';
import { loadCategoryFeedDTO } from '../../../modules/feed/web/loadCategoryFeed';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import type { CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';

type SearchParams = Record<string, string | string[] | undefined>;

export async function renderCategoryPage(categoryKey: CategoryKey, searchParams: SearchParams) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);
  const initialFeed = await loadCategoryFeedDTO(categoryKey, params);
  const filterQueryString = serializeFilters(filters).toString();

  return (
    <CategoryFeedPage
      categoryKey={categoryKey}
      initialFeed={initialFeed}
      filterQueryString={filterQueryString}
    />
  );
}

function toURLSearchParams(searchParams: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value[0]);
    } else {
      params.set(key, value);
    }
  }
  return params;
}
