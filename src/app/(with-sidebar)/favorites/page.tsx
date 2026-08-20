import { getActiveCity } from '../../../modules/activities/web/activeCity';
import { loadFavoritesFeedDTO } from '../../../modules/favorites/web/favoritesFeedRoute';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import { FeedGrid } from '../../../modules/feed/web/FeedGrid';
import { withCity } from '../../../shared/ui/format/eyebrow';
import { PageHero } from '../../../shared/ui/PageHero';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FavoritesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const [initialFeed, city] = await Promise.all([loadFavoritesFeedDTO(params), getActiveCity()]);
  const filterQueryString = serializeFilters(filters).toString();

  return (
    <>
      <PageHero
        eyebrow={withCity('SAVED IN {city}', city.name)}
        title={'Your\ncollection.'}
        subtitle="The places, events and plans you’ve saved — kept in one quiet, curated place."
        image="https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=1600&q=80"
        actions={<a className="btn-charcoal" href="/">Discover more</a>}
      />
      <FeedGrid
        key={`${city.slug}-${filterQueryString}`}
        initialItems={initialFeed.items}
        initialCursor={initialFeed.nextCursor}
        filterQueryString={filterQueryString}
        feedApiPath="/api/favorites/feed"
        emptyMessage="You haven't favorited anything yet. Tap the flame on a card to save it."
      />
    </>
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
