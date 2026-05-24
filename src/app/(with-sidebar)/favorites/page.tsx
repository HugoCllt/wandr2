import { loadFavoritesFeedDTO } from '../../../modules/favorites/web/favoritesFeedRoute';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import { FeedGrid } from '../../../modules/feed/web/FeedGrid';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FavoritesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const initialFeed = await loadFavoritesFeedDTO(params);
  const filterQueryString = serializeFilters(filters).toString();

  return (
    <section>
      <div className="section-head">
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32 }}>
            Your Favorites
          </h1>
          <p>The places, events and plans you&rsquo;ve saved.</p>
        </div>
      </div>
      <FeedGrid
        key={filterQueryString}
        initialItems={initialFeed.items}
        initialCursor={initialFeed.nextCursor}
        filterQueryString={filterQueryString}
        feedApiPath="/api/favorites/feed"
        emptyMessage="You haven't favorited anything yet. Tap the flame on a card to save it."
      />
    </section>
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
