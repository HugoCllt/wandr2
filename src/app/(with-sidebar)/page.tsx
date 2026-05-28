import { HeroSection } from '../../modules/activities/web/HeroSection';
import { listFeaturedActivities } from '../../modules/activities/web/listFeaturedActivities';
import { MapSection } from '../../modules/activities/web/MapSection';
import { RecommendationsSection } from '../../modules/feed/web/RecommendationsSection';
import { loadFeedDTO } from '../../modules/feed/web/feedRoute';
import { parseFilters, serializeFilters } from '../../modules/filters/application/url-codec';
import { FooterBanner } from '../../shared/ui/FooterBanner';
import { toURLSearchParams, type SearchParamsInput } from './_lib/searchParams';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: SearchParamsInput }) {
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
