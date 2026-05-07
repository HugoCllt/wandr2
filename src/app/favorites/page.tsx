import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { loadFavoritesFeedDTO } from '../../modules/favorites/web/favoritesFeedRoute';
import { FilterBarController } from '../../modules/filters/web/FilterBarController';
import { parseFilters, serializeFilters } from '../../modules/filters/application/url-codec';
import { FAVORITES_PRESET } from '../../shared/presets/FAVORITES_PRESET';
import { FeedGrid } from '../../shared/ui/FeedGrid';
import { PageShell } from '../../shared/ui/PageShell';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FavoritesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const [initialFeed, neighborhoods] = await Promise.all([
    loadFavoritesFeedDTO(params),
    listNeighborhoods(),
  ]);

  const filterQueryString = serializeFilters(filters).toString();

  return (
    <PageShell
      preset={FAVORITES_PRESET}
      filters={<FilterBarController value={filters} neighborhoods={neighborhoods} />}
      feed={
        <FeedGrid
          key={filterQueryString}
          initialItems={initialFeed.items}
          initialCursor={initialFeed.nextCursor}
          filterQueryString={filterQueryString}
          variant={FAVORITES_PRESET.gridVariant}
          feedApiPath="/api/favorites/feed"
          emptyMessage="You haven't favorited anything yet. Tap the heart on a card to save it."
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
