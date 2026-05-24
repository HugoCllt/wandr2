import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { FeedGrid } from './FeedGrid';

type SportTabbedFeedProps = {
  initialFeed: FeedResultDTO;
  filterQueryString: string;
};

export function SportTabbedFeed({ initialFeed, filterQueryString }: SportTabbedFeedProps) {
  return (
    <>
      <div className="sport-hero">
        <div
          className="sport-hero-img"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80)',
          }}
        />
        <div className="sport-hero-inner">
          <div className="hero-eyebrow">SPORT IN MONTREAL</div>
          <h1>Watch the city play.</h1>
          <p>
            From front-row hockey nights to padel courts, climbing walls and sunrise yoga on the
            mountain — your sport, curated.
          </p>
        </div>
      </div>

      <section className="sport-section">
        <div className="section-head">
          <div>
            <h2>Sport in Montréal</h2>
            <p>Hand-picked sport activities — use the filters to refine.</p>
          </div>
        </div>
        <FeedGrid
          key={filterQueryString}
          initialItems={initialFeed.items}
          initialCursor={initialFeed.nextCursor}
          filterQueryString={filterQueryString}
        />
      </section>
    </>
  );
}
