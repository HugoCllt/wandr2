import { listFeaturedActivities } from '../../modules/activities/web/listFeaturedActivities';
import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { loadFeedDTO } from '../../modules/feed/web/feedRoute';
import { FilterBarController } from '../../modules/filters/web/FilterBarController';
import { parseFilters } from '../../modules/filters/application/url-codec';
import { serializeFilters } from '../../modules/filters/application/url-codec';
import { HOME_PRESET } from '../../shared/presets/HOME_PRESET';
import { FeedGrid } from '../../shared/ui/FeedGrid';
import { HeroCarousel } from '../../shared/ui/HeroCarousel';
import { PageShell } from '../../shared/ui/PageShell';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const [initialFeed, neighborhoods, featured] = await Promise.all([
    loadFeedDTO(params),
    listNeighborhoods(),
    listFeaturedActivities(3),
  ]);

  const filterQueryString = serializeFilters(filters).toString();

  return (
    <PageShell
      preset={HOME_PRESET}
      hero={<HeroCarousel items={featured} />}
      filters={<FilterBarController value={filters} neighborhoods={neighborhoods} />}
      feed={
        <FeedGrid
          key={filterQueryString}
          initialItems={initialFeed.items}
          initialCursor={initialFeed.nextCursor}
          filterQueryString={filterQueryString}
          variant={HOME_PRESET.gridVariant}
        />
      }
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
