import type { ReactElement } from 'react';

import type { ActivityDTO } from '../contracts/ActivityDTO';
import { formatDateTimeInTZ } from './format/formatInTZ';

const CATEGORY_LABEL: Record<ActivityDTO['category'], string> = {
  SPORT: 'Sport',
  ROMANTIC: 'Romantic',
  FOOD: 'Food',
  CULTURE: 'Culture',
  OUTDOOR: 'Outdoor',
  NIGHTLIFE: 'Nightlife',
};

export function ActivityDetail({ activity }: { activity: ActivityDTO }): ReactElement {
  return (
    <article style={styles.article}>
      <figure style={styles.hero}>
        <img src={activity.imageUrl} alt={activity.title} style={styles.heroImage} />
        {activity.imageCredit ? (
          <figcaption style={styles.imageCredit}>{activity.imageCredit}</figcaption>
        ) : null}
      </figure>

      <header style={styles.header}>
        <div style={styles.badges}>
          {activity.kind === 'PLACE' ? (
            <span style={styles.badge} data-testid="kind-badge">
              Lieu
            </span>
          ) : null}
          <span style={styles.categoryBadge}>{CATEGORY_LABEL[activity.category]}</span>
          {activity.isFeatured ? <span style={styles.featuredBadge}>Featured</span> : null}
        </div>
        <h1 style={styles.title}>{activity.title}</h1>
      </header>

      <section aria-labelledby="about-heading" style={styles.section}>
        <h2 id="about-heading" style={styles.sectionHeading}>
          About
        </h2>
        <p style={styles.description}>{activity.description}</p>
      </section>

      {activity.kind === 'EVENT' ? <Schedule activity={activity} /> : null}

      <section aria-labelledby="pricing-heading" style={styles.section}>
        <h2 id="pricing-heading" style={styles.sectionHeading}>
          Pricing
        </h2>
        <p style={styles.body}>{formatPrice(activity)}</p>
      </section>

      <section aria-labelledby="location-heading" style={styles.section}>
        <h2 id="location-heading" style={styles.sectionHeading}>
          Location
        </h2>
        <p style={styles.body}>{activity.address}</p>
        {activity.neighborhood ? <p style={styles.muted}>{activity.neighborhood}</p> : null}
      </section>

      {activity.externalUrl ? (
        <section style={styles.section}>
          <a
            href={activity.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.cta}
          >
            Visit official site
          </a>
        </section>
      ) : null}
    </article>
  );
}

function Schedule({ activity }: { activity: ActivityDTO }): ReactElement | null {
  if (!activity.dateStart || !activity.dateEnd) return null;

  return (
    <section aria-labelledby="schedule-heading" style={styles.section}>
      <h2 id="schedule-heading" style={styles.sectionHeading}>
        Schedule
      </h2>
      <p style={styles.body}>
        <time dateTime={activity.dateStart}>{formatDateTimeInTZ(activity.dateStart)}</time>
        {' → '}
        <time dateTime={activity.dateEnd}>{formatDateTimeInTZ(activity.dateEnd)}</time>
      </p>
    </section>
  );
}

function formatPrice(activity: ActivityDTO): string {
  if (
    activity.priceMinCents === 0 &&
    (activity.priceMaxCents === null || activity.priceMaxCents === 0)
  ) {
    return 'Free';
  }

  const min = formatCents(activity.priceMinCents);
  if (activity.priceMaxCents === null || activity.priceMaxCents === activity.priceMinCents) {
    return min;
  }
  return `${min} – ${formatCents(activity.priceMaxCents)}`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const styles: Record<string, React.CSSProperties> = {
  article: {
    maxWidth: 880,
    margin: '0 auto',
    padding: '1.5rem',
    fontFamily: 'system-ui, sans-serif',
    color: '#111',
  },
  hero: {
    margin: 0,
    overflow: 'hidden',
    borderRadius: 12,
    background: '#f4f4f4',
  },
  heroImage: {
    width: '100%',
    maxHeight: 560,
    objectFit: 'cover',
    display: 'block',
  },
  imageCredit: {
    fontSize: '0.75rem',
    color: '#666',
    padding: '0.5rem 0.75rem',
    textAlign: 'right',
  },
  header: {
    marginTop: '1.5rem',
  },
  badges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    borderRadius: 999,
    background: '#eef2ff',
    color: '#3730a3',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    borderRadius: 999,
    background: '#f1f5f9',
    color: '#0f172a',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  featuredBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.625rem',
    borderRadius: 999,
    background: '#fef3c7',
    color: '#92400e',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.15,
  },
  section: {
    marginTop: '1.5rem',
  },
  sectionHeading: {
    fontSize: '1rem',
    fontWeight: 600,
    margin: 0,
    marginBottom: '0.5rem',
    color: '#374151',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  description: {
    margin: 0,
    lineHeight: 1.6,
    fontSize: '1rem',
  },
  body: {
    margin: 0,
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  muted: {
    margin: 0,
    marginTop: '0.25rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  cta: {
    display: 'inline-block',
    padding: '0.75rem 1.25rem',
    borderRadius: 8,
    background: '#111',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 600,
  },
};
