import { loadFeedDTO } from '../../../modules/feed/web/feedRoute';
import { SportTabbedFeed } from '../../../modules/feed/web/SportTabbedFeed';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import { SPORT_PRESET } from '../../../shared/presets/SPORT_PRESET';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const initialFeed = await loadFeedDTO(params, SPORT_PRESET.baseFilters);
  const userQs = serializeFilters(filters).toString();
  const filterQueryString = userQs ? `preset=sport&${userQs}` : 'preset=sport';

  return (
    <SportTabbedFeed
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
