import Link from 'next/link';
import type { CSSProperties, ReactElement } from 'react';

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

export type ActivityCardVariant = 'standard' | 'compact' | 'hero';

type ActivityCardProps = {
  activity: ActivityDTO;
  variant?: ActivityCardVariant;
};

export function ActivityCard({
  activity,
  variant = 'standard',
}: ActivityCardProps): ReactElement {
  if (variant === 'hero') return <HeroActivityCard activity={activity} />;

  const dateLabel = buildDateLabel(activity);
  const priceLabel = buildPriceLabel(activity);
  const categoryLabel = CATEGORY_LABEL[activity.category];
  const styles = variant === 'compact' ? compactStyles : standardStyles;
  const href = `/activity/${activity.slug}`;

  return (
    <Link href={href} style={styles.card} aria-label={activity.title}>
      <div style={styles.imageWrap}>
        <img
          src={activity.imageUrl}
          alt={activity.title}
          loading="lazy"
          style={styles.image}
        />
        {activity.isFeatured ? <span style={styles.featuredBadge}>Featured</span> : null}
      </div>
      <div style={styles.body}>
        <div style={styles.metaTop}>
          <span style={styles.category}>{categoryLabel}</span>
          {activity.neighborhood ? (
            <span style={styles.neighborhood}>· {activity.neighborhood}</span>
          ) : null}
        </div>
        <h3 style={styles.title}>{activity.title}</h3>
        <div style={styles.metaBottom}>
          <span style={styles.dateOrLieu}>{dateLabel}</span>
          <span style={styles.divider} aria-hidden="true">
            ·
          </span>
          <span style={styles.price}>{priceLabel}</span>
        </div>
      </div>
    </Link>
  );
}

function HeroActivityCard({ activity }: { activity: ActivityDTO }): ReactElement {
  const categoryLabel = CATEGORY_LABEL[activity.category];
  const dateLabel = buildDateLabel(activity);
  const href = `/activity/${activity.slug}`;

  return (
    <Link href={href} style={heroStyles.card} aria-label={activity.title}>
      <img
        src={activity.imageUrl}
        alt={activity.title}
        loading="lazy"
        style={heroStyles.image}
      />
      <div style={heroStyles.scrim} aria-hidden="true" />
      <div style={heroStyles.body}>
        <div style={heroStyles.metaTop}>
          <span style={heroStyles.category}>{categoryLabel}</span>
          {activity.neighborhood ? (
            <span style={heroStyles.neighborhood}>· {activity.neighborhood}</span>
          ) : null}
          {activity.isFeatured ? <span style={heroStyles.featuredBadge}>Featured</span> : null}
        </div>
        <h2 style={heroStyles.title}>{activity.title}</h2>
        <p style={heroStyles.description}>{activity.description}</p>
        <span style={heroStyles.dateLabel}>{dateLabel}</span>
      </div>
    </Link>
  );
}

function buildDateLabel(activity: ActivityDTO): string {
  if (activity.kind === 'PLACE') return 'Lieu';
  if (!activity.dateStart) return 'TBA';
  return formatDateTimeInTZ(activity.dateStart);
}

function buildPriceLabel(activity: ActivityDTO): string {
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
  return `$${Math.round(cents / 100)}`;
}

const standardStyles: Record<string, CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E5DED1',
    overflow: 'hidden',
    color: '#0E0F12',
    textDecoration: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    fontFamily: 'system-ui, sans-serif',
    transition: 'box-shadow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4 / 3',
    background: '#F2EBE0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '0.25rem 0.625rem',
    borderRadius: 9999,
    background: '#FF7A33',
    color: '#FFFFFF',
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  body: {
    padding: '0 1rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metaTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: '#5A5C66',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  category: {
    textTransform: 'uppercase',
  },
  neighborhood: {},
  title: {
    margin: 0,
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.3,
    color: '#0E0F12',
  },
  metaBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#5A5C66',
  },
  dateOrLieu: {},
  divider: {
    color: '#E5DED1',
  },
  price: {
    fontWeight: 500,
    color: '#0E0F12',
  },
};

const heroStyles: Record<string, CSSProperties> = {
  card: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    minHeight: 360,
    borderRadius: 20,
    overflow: 'hidden',
    color: '#FFFFFF',
    textDecoration: 'none',
    background: '#0E0F12',
    fontFamily: 'system-ui, sans-serif',
    isolation: 'isolate',
  },
  image: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    zIndex: 0,
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(14,15,18,0) 35%, rgba(14,15,18,0.55) 70%, rgba(14,15,18,0.85) 100%)',
    zIndex: 1,
  },
  body: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1.5rem',
  },
  metaTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.85)',
  },
  category: {},
  neighborhood: {
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: 500,
  },
  featuredBadge: {
    marginLeft: 'auto',
    padding: '0.25rem 0.625rem',
    borderRadius: 9999,
    background: '#FF7A33',
    color: '#FFFFFF',
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    lineHeight: 1.15,
    fontWeight: 600,
  },
  description: {
    margin: 0,
    fontSize: '0.9375rem',
    lineHeight: 1.4,
    color: 'rgba(255,255,255,0.85)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  dateLabel: {
    fontSize: '0.8125rem',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: '0.02em',
  },
};

const compactStyles: Record<string, CSSProperties> = {
  card: {
    display: 'grid',
    gridTemplateColumns: '96px 1fr',
    gap: '1rem',
    padding: '0.75rem',
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1px solid #E5DED1',
    color: '#0E0F12',
    textDecoration: 'none',
    fontFamily: 'system-ui, sans-serif',
  },
  imageWrap: {
    position: 'relative',
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    background: '#F2EBE0',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    padding: '0.125rem 0.375rem',
    borderRadius: 9999,
    background: '#FF7A33',
    color: '#FFFFFF',
    fontSize: '0.625rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  metaTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.6875rem',
    color: '#5A5C66',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  category: {
    textTransform: 'uppercase',
  },
  neighborhood: {},
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.3,
    color: '#0E0F12',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metaBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    color: '#5A5C66',
  },
  dateOrLieu: {},
  divider: {
    color: '#E5DED1',
  },
  price: {
    fontWeight: 500,
    color: '#0E0F12',
  },
};
