import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { FeedGrid } from './FeedGrid';
import { Icon } from '../../../shared/ui/icons/Icon';

type RecommendationsSectionProps = {
  initialFeed: FeedResultDTO;
  filterQueryString: string;
};

const CHIPS = [
  { name: 'All', icon: null },
  { name: 'Popular', icon: 'fire' as const },
  { name: 'This Weekend', icon: 'calendar' as const },
  { name: 'Near You', icon: 'pin' as const },
];

export function RecommendationsSection({
  initialFeed,
  filterQueryString,
}: RecommendationsSectionProps) {
  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Recommended for You</h2>
          <p>Curated picks based on your vibe</p>
        </div>
      </div>

      <div className="rec-controls">
        {CHIPS.map((c, i) => (
          <button
            key={c.name}
            type="button"
            className={'chip ' + (i === 0 ? 'active' : '')}
            disabled
          >
            {c.icon ? <Icon name={c.icon} size={13} /> : null}
            {c.name}
          </button>
        ))}
        <span className="spacer" />
        <button type="button" className="sort-btn" disabled>
          Sort
          <Icon name="chev-down" size={14} />
        </button>
      </div>

      <FeedGrid
        key={filterQueryString}
        initialItems={initialFeed.items}
        initialCursor={initialFeed.nextCursor}
        filterQueryString={filterQueryString}
      />
    </section>
  );
}
