import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CATEGORY_PRESETS, type CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { FeedGrid } from './FeedGrid';

type CategoryFeedPageProps = {
  categoryKey: CategoryKey;
  initialFeed: FeedResultDTO;
  filterQueryString: string;
};

export function CategoryFeedPage({
  categoryKey,
  initialFeed,
  filterQueryString,
}: CategoryFeedPageProps) {
  const cfg = CATEGORY_PRESETS[categoryKey];
  const titleLines = cfg.heroTitle.split('\n');

  return (
    <>
      <div className="sport-hero">
        <div className="sport-hero-img" style={{ backgroundImage: `url(${cfg.heroImage})` }} />
        <div className="sport-hero-inner">
          <div className="hero-eyebrow">{cfg.eyebrow}</div>
          <h1>
            {titleLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </h1>
          <p>{cfg.heroSub}</p>
        </div>
      </div>

      <section className="sport-section">
        <div className="section-head">
          <div>
            <h2>{cfg.label}</h2>
            <p>What the city is doing in this lane right now.</p>
          </div>
        </div>
        <FeedGrid
          key={`${categoryKey}-${filterQueryString}`}
          initialItems={initialFeed.items}
          initialCursor={initialFeed.nextCursor}
          filterQueryString={filterQueryString ? `preset=${categoryKey}&${filterQueryString}` : `preset=${categoryKey}`}
        />
      </section>
    </>
  );
}
