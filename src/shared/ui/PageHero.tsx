import type { ReactNode } from 'react';

/**
 * DTO-free full-bleed page header band. Renders an image with a charcoal scrim,
 * eyebrow, title (newlines become stacked lines), optional subtitle and an
 * actions row. Used by the category and favorites pages; the home page keeps its
 * featured carousel instead.
 */
type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, subtitle, image, actions }: PageHeroProps) {
  const lines = title.split('\n');
  return (
    <section className="page-hero">
      <div className="page-hero-img" style={{ backgroundImage: `url(${image})` }} />
      <div className="page-hero-inner">
        <div className="page-hero-eyebrow">{eyebrow}</div>
        <h1>
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {actions ? <div className="page-hero-actions">{actions}</div> : null}
      </div>
    </section>
  );
}
