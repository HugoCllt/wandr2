import { getActiveCity } from '../../modules/activities/web/activeCity';
import { withCity } from '../../shared/ui/format/eyebrow';
import { SpotlightActivityCard } from '../../modules/activities/web/cards/SpotlightActivityCard';
import { FeaturedHero } from '../../modules/activities/web/FeaturedHero';
import { listFeaturedActivities } from '../../modules/activities/web/listFeaturedActivities';
import { MapSection } from '../../modules/activities/web/MapSection';
import { POOL_LIMIT } from '../../modules/feed/web/buildFeedSections';
import { loadFeedDTO } from '../../modules/feed/web/feedRoute';
import { SectionedFeed } from '../../modules/feed/web/SectionedFeed';
import { parseFilters, serializeFilters } from '../../modules/filters/application/url-codec';
import { toURLSearchParams, type SearchParamsInput } from './_lib/searchParams';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const poolParams = new URLSearchParams(params);
  poolParams.set('limit', String(POOL_LIMIT));

  const city = await getActiveCity();
  const [pool, featured] = await Promise.all([
    loadFeedDTO(poolParams),
    listFeaturedActivities(6, city.id),
  ]);

  const filterQueryString = serializeFilters(filters).toString();

  // The curated `isFeatured` pool drives the hero. When nothing is flagged
  // featured, fall back to the feed pool (like category pages) so the hero
  // carousel still shows real, image-bearing activities.
  const featuredWithImage = featured.filter((a) => Boolean(a.imageUrl));
  const heroItems =
    featuredWithImage.length > 0
      ? featuredWithImage
      : pool.items.filter((a) => Boolean(a.imageUrl)).slice(0, 3);
  const heroIds = new Set(heroItems.map((a) => a.id));

  // First image-bearing pool item not already shown in the hero drives the
  // "Coup de cœur" spotlight, injected between "Pour toi" and the long tail.
  // The highlights (hero, map volet, spotlight) never shrink the feed: with a
  // filter on, the pool is often small enough that removing them would empty it.
  const spotlight = pool.items.find((a) => Boolean(a.imageUrl) && !heroIds.has(a.id));

  return (
    <>
      <FeaturedHero activities={heroItems} eyebrow={withCity('THIS WEEK IN {city}', city.name)} />
      <MapSection nearbyActivities={pool.items} />
      <SectionedFeed
        key={city.slug}
        items={pool.items}
        nextCursor={pool.nextCursor}
        filterQueryString={filterQueryString}
        interludeSlot={
          spotlight ? (
            <section className="spotlight-band" aria-label="Coup de cœur">
              <SpotlightActivityCard activity={spotlight} />
            </section>
          ) : undefined
        }
      />
    </>
  );
}
