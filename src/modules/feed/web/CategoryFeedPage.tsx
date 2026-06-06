import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CATEGORY_PRESETS, type CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { FeaturedHero } from '../../activities/web/FeaturedHero';
import { MapSection } from '../../activities/web/MapSection';
import { SectionedFeed } from './SectionedFeed';

type CategoryFeedPageProps = {
  categoryKey: CategoryKey;
  initialFeed: FeedResultDTO; // the 48-item pool
  filterQueryString: string;
};

export function CategoryFeedPage({
  categoryKey,
  initialFeed,
  filterQueryString,
}: CategoryFeedPageProps) {
  const cfg = CATEGORY_PRESETS[categoryKey];
  const presetQuery = filterQueryString
    ? `preset=${categoryKey}&${filterQueryString}`
    : `preset=${categoryKey}`;

  const heroItems = initialFeed.items.filter((a) => Boolean(a.imageUrl)).slice(0, 3);
  const heroIds = new Set(heroItems.map((a) => a.id));

  return (
    <>
      <FeaturedHero activities={heroItems} eyebrow={cfg.eyebrow} />

      <div id="map" className="scroll-anchor">
        <MapSection nearbyActivities={initialFeed.items} />
      </div>

      <div id="feed" className="scroll-anchor">
        <SectionedFeed
          key={`${categoryKey}-${filterQueryString}`}
          items={initialFeed.items}
          nextCursor={initialFeed.nextCursor}
          filterQueryString={presetQuery}
          excludeIds={heroIds}
        />
      </div>
    </>
  );
}
