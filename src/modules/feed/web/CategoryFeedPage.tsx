import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CATEGORY_PRESETS, type CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { PageHero } from '../../../shared/ui/PageHero';
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

  return (
    <>
      <PageHero
        eyebrow={cfg.eyebrow}
        title={cfg.heroTitle}
        subtitle={cfg.heroSub}
        image={cfg.heroImage}
        actions={
          <>
            <a className="btn-charcoal" href="#map">View map</a>
            <a className="btn-silver" href="#feed">Browse activities</a>
          </>
        }
      />

      <div id="map" className="scroll-anchor">
        <MapSection nearbyActivities={initialFeed.items} />
      </div>

      <div id="feed" className="scroll-anchor">
        <SectionedFeed
          key={`${categoryKey}-${filterQueryString}`}
          items={initialFeed.items}
          nextCursor={initialFeed.nextCursor}
          filterQueryString={presetQuery}
        />
      </div>
    </>
  );
}
