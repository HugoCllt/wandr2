'use client';

import { useState } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { HeroActivityCard } from './cards/HeroActivityCard';
import { SideActivityCard } from './cards/SideActivityCard';
import { Icon } from '../../../shared/ui/icons/Icon';

type HeroSectionProps = {
  featured: ActivityDTO[];
};

const EYEBROWS = [
  'FEATURED THIS WEEK',
  'TRENDING IN MONTREAL',
  'UPCOMING MUST-DO',
  'HIDDEN GEM',
];

export function HeroSection({ featured }: HeroSectionProps) {
  const main = featured.slice(0, Math.max(featured.length - 3, 1));
  const side = featured.slice(main.length, main.length + 3);
  const [idx, setIdx] = useState(0);

  if (main.length === 0) return null;

  const safeIdx = Math.min(idx, main.length - 1);
  const slide = main[safeIdx];
  const next = () => setIdx((i) => (i + 1) % main.length);
  const prev = () => setIdx((i) => (i - 1 + main.length) % main.length);

  return (
    <section className="hero">
      <div style={{ position: 'relative' }}>
        <HeroActivityCard activity={slide} eyebrow={EYEBROWS[safeIdx % EYEBROWS.length]} />
        {main.length > 1 && (
          <>
            <button
              type="button"
              className="hero-arrow prev"
              onClick={prev}
              aria-label="Previous"
            >
              <Icon name="chev-left" size={18} />
            </button>
            <button type="button" className="hero-arrow next" onClick={next} aria-label="Next">
              <Icon name="chev-right" size={18} />
            </button>
            <div className="hero-dots">
              {main.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={'hero-dot ' + (i === safeIdx ? 'active' : '')}
                  onClick={() => setIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {side.length > 0 && (
        <div className="hero-side">
          {side.map((a) => (
            <SideActivityCard key={a.id} activity={a} flames={4} />
          ))}
        </div>
      )}
    </section>
  );
}
