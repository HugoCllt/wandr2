import { HeroSection } from '../../modules/activities/web/HeroSection';
import { listFeaturedActivities } from '../../modules/activities/web/listFeaturedActivities';
import { MapSection } from '../../modules/activities/web/MapSection';
import { RecommendationsSection } from '../../modules/feed/web/RecommendationsSection';
import { loadFeedDTO } from '../../modules/feed/web/feedRoute';
import { parseFilters, serializeFilters } from '../../modules/filters/application/url-codec';
import { FooterBanner } from '../../shared/ui/FooterBanner';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const [initialFeed, featured, nearby] = await Promise.all([
    loadFeedDTO(params),
    listFeaturedActivities(6),
    listFeaturedActivities(8),
  ]);

  const filterQueryString = serializeFilters(filters).toString();

  return (
    <>
      <HeroSection featured={featured} />
      <MapSection nearbyActivities={nearby.slice(featured.length)} />
      <RecommendationsSection initialFeed={initialFeed} filterQueryString={filterQueryString} />
      <FooterBanner />
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
