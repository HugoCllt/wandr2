'use client';

import { useLenis } from 'lenis/react';
import { useRef, useState } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import {
  coverImageUrl,
  formatActivityPrice,
  formatActivityWhen,
  formatActivityWhere,
  useOpenActivity,
} from './cards/helpers';

type FeaturedHeroProps = {
  /** Featured pool; only entries with a real image are shown, capped at 3. */
  activities: ActivityDTO[];
  /** Page eyebrow above the activity title (e.g. "SPORT IN MONTREAL"). */
  eyebrow: string;
};

/**
 * Full-bleed cinematic hero shown directly under the nav on Home and every
 * category page. Each slide is a real featured activity (photo + name + meta +
 * CTA that opens it); the background cross-fades between up to three slides.
 * Reuses the `.page-hero` band/scrim styling and adds carousel chrome.
 */
export function FeaturedHero({ activities, eyebrow }: FeaturedHeroProps) {
  const slides = activities.filter((a) => Boolean(a.imageUrl)).slice(0, 3);
  const [idx, setIdx] = useState(0);
  const open = useOpenActivity();

  // Subtle parallax: the image layers drift up slower than the page, so the
  // hero feels deep and the filter rail reads as emerging from under it. Driven
  // imperatively via a CSS var (no per-frame React re-render). Disabled for
  // reduced-motion users.
  const sectionRef = useRef<HTMLElement>(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useLenis(
    ({ scroll }) => {
      if (reduced) return;
      const shift = Math.min(scroll, 700) * 0.28;
      sectionRef.current?.style.setProperty('--hero-parallax', `${shift}px`);
    },
    [reduced],
  );

  if (slides.length === 0) return null;

  const safeIdx = Math.min(idx, slides.length - 1);
  const active = slides[safeIdx];
  const next = () => setIdx((i) => (i + 1) % slides.length);
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const titleLines = active.title.split('\n');

  return (
    <section ref={sectionRef} className="page-hero featured-hero">
      {slides.map((a, i) => (
        <div
          key={a.id}
          className={'featured-hero-img' + (i === safeIdx ? ' active' : '')}
          style={{ backgroundImage: `url(${coverImageUrl(a)})` }}
          aria-hidden={i === safeIdx ? undefined : true}
        />
      ))}

      <div className="page-hero-inner">
        <div className="page-hero-eyebrow">{eyebrow}</div>
        <h1>
          {titleLines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </h1>
        <div className="featured-hero-meta">
          <span>{formatActivityWhere(active)}</span>
          <span className="dot" />
          <span>{formatActivityWhen(active)}</span>
          <span className="dot" />
          <span>{formatActivityPrice(active)}</span>
        </div>
        <div className="page-hero-actions">
          <button type="button" className="btn-charcoal" onClick={() => open(active)}>
            View activity
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="featured-hero-arrow prev"
            onClick={prev}
            aria-label="Previous"
          >
            <Icon name="chev-left" size={18} />
          </button>
          <button
            type="button"
            className="featured-hero-arrow next"
            onClick={next}
            aria-label="Next"
          >
            <Icon name="chev-right" size={18} />
          </button>
          <div className="featured-hero-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className={'featured-hero-dot' + (i === safeIdx ? ' active' : '')}
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
