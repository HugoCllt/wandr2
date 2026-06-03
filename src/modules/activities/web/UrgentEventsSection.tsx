import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { LiveActivityCard } from './cards/LiveActivityCard';

type UrgentEventsSectionProps = {
  activities: ActivityDTO[];
};

/**
 * A global "happening soon" band: events that start, or whose deadline falls,
 * within the next week. Rendered at the top of every page under the sidebar
 * layout. Renders nothing when there is nothing urgent so it stays out of the
 * way on quiet days.
 */
export function UrgentEventsSection({
  activities,
}: UrgentEventsSectionProps): ReactElement | null {
  if (activities.length === 0) return null;

  return (
    <section className="urgent-section">
      <div className="section-head">
        <div>
          <span className="urgent-pill">
            <Icon name="fire" size={12} /> This week only
          </span>
          <h2>Happening Soon</h2>
          <p>Catch these before they&rsquo;re gone — starting or closing within the week.</p>
        </div>
      </div>

      <div className="urgent-row" role="list" aria-label="Activities happening soon">
        {activities.map((activity) => (
          <div role="listitem" key={activity.id}>
            <LiveActivityCard activity={activity} />
          </div>
        ))}
      </div>
    </section>
  );
}
