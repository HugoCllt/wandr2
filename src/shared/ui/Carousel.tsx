'use client';

import { useEffect, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';

type CarouselProps = {
  slides: ReactNode[];
  interval?: number;
  pauseOnHover?: boolean;
  ariaLabel?: string;
};

export function Carousel({
  slides,
  interval = 5000,
  pauseOnHover = true,
  ariaLabel,
}: CarouselProps): ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const listener = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(id);
  }, [interval, paused, reducedMotion, slides.length]);

  const pause = () => setPaused(true);
  const resume = () => setPaused(false);
  const goPrev = () =>
    setActiveIndex((i) => (i - 1 + slides.length) % Math.max(slides.length, 1));
  const goNext = () => setActiveIndex((i) => (i + 1) % Math.max(slides.length, 1));

  if (slides.length === 0) return <div aria-label={ariaLabel} />;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={pauseOnHover ? pause : undefined}
      onMouseLeave={pauseOnHover ? resume : undefined}
      onFocus={pause}
      onBlur={resume}
      style={containerStyle}
    >
      <div style={trackStyle} aria-live="polite">
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} of ${slides.length}`}
            aria-current={i === activeIndex ? 'true' : undefined}
            style={i === activeIndex ? activeSlideStyle : slideStyle}
          >
            {slide}
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div style={controlsStyle}>
          <button type="button" onClick={goPrev} aria-label="Previous slide" style={iconButtonStyle}>
            ‹
          </button>
          <div style={dotsStyle} role="tablist" aria-label="Slide selection">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                style={i === activeIndex ? activeDotStyle : dotStyle}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume auto-rotation' : 'Pause auto-rotation'}
            aria-pressed={paused}
            style={iconButtonStyle}
          >
            {paused ? '▶' : '❚❚'}
          </button>
          <button type="button" onClick={goNext} aria-label="Next slide" style={iconButtonStyle}>
            ›
          </button>
        </div>
      ) : null}
    </section>
  );
}

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  width: '100%',
};

const trackStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
  alignItems: 'stretch',
};

const slideStyle: CSSProperties = {
  display: 'flex',
  borderRadius: 20,
  overflow: 'hidden',
  transition: 'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
};

const activeSlideStyle: CSSProperties = {
  ...slideStyle,
  boxShadow: '0 8px 24px rgba(14, 15, 18, 0.18)',
};

const controlsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
};

const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 9999,
  border: '1px solid #E5DED1',
  background: '#FFFFFF',
  color: '#0E0F12',
  fontSize: '1rem',
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
};

const dotsStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
};

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  padding: 0,
  borderRadius: 9999,
  border: 'none',
  background: '#E5DED1',
  cursor: 'pointer',
};

const activeDotStyle: CSSProperties = {
  ...dotStyle,
  width: 20,
  background: '#0E0F12',
};
