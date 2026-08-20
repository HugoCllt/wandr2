import { getActiveCity, toCityDTO } from '../../../modules/activities/web/activeCity';
import { CategoryFeedPage } from '../../../modules/feed/web/CategoryFeedPage';
import { loadCategoryFeedDTO } from '../../../modules/feed/web/loadCategoryFeed';
import { POOL_LIMIT } from '../../../modules/feed/web/buildFeedSections';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import {
  CATEGORY_KEYS,
  CATEGORY_PRESETS,
  type CategoryKey,
} from '../../../shared/presets/CATEGORY_PRESETS';
import { RouteSplash } from '../../../shared/ui/RouteSplash';
import { toURLSearchParams, type SearchParamsInput } from './searchParams';

export async function renderCategoryPage(categoryKey: CategoryKey, searchParams: SearchParamsInput) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const poolParams = new URLSearchParams(params);
  poolParams.set('limit', String(POOL_LIMIT));

  const [initialFeed, city] = await Promise.all([
    loadCategoryFeedDTO(categoryKey, poolParams),
    getActiveCity(),
  ]);
  const filterQueryString = serializeFilters(filters).toString();

  return (
    <>
      <RouteSplash
        label={CATEGORY_PRESETS[categoryKey].label}
        highlight={CATEGORY_KEYS.indexOf(categoryKey)}
      />
      <CategoryFeedPage
        categoryKey={categoryKey}
        initialFeed={initialFeed}
        filterQueryString={filterQueryString}
        city={toCityDTO(city)}
      />
    </>
  );
}
