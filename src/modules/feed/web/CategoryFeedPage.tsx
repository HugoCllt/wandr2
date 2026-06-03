import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CATEGORY_PRESETS, type CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
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
  const titleLines = cfg.heroTitle.split('\n');
  const presetQuery = filterQueryString
    ? `preset=${categoryKey}&${filterQueryString}`
    : `preset=${categoryKey}`;

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-img" style={{ backgroundImage: `url(${cfg.heroImage})` }} />
        <div className="page-hero-inner">
          <div className="hero-eyebrow">{cfg.eyebrow}</div>
          <h1>
            {titleLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </h1>
          <p>{cfg.heroSub}</p>
        </div>
      </div>

      <MapSection nearbyActivities={initialFeed.items} />

      <SectionedFeed
        key={`${categoryKey}-${filterQueryString}`}
        items={initialFeed.items}
        nextCursor={initialFeed.nextCursor}
        filterQueryString={presetQuery}
      />
    </>
  );
}
