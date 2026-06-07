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

  const [pool, featured] = await Promise.all([
    loadFeedDTO(poolParams),
    listFeaturedActivities(6),
  ]);

  const filterQueryString = serializeFilters(filters).toString();
  const excludeIds = new Set(featured.map((a) => a.id));

  return (
    <>
      <FeaturedHero activities={featured} eyebrow="THIS WEEK IN MONTREAL" />
      <MapSection nearbyActivities={pool.items} />
      <SectionedFeed
        items={pool.items}
        nextCursor={pool.nextCursor}
        filterQueryString={filterQueryString}
        excludeIds={excludeIds}
      />
    </>
  );
}
