import type { CSSProperties, ReactElement, ReactNode } from 'react';

import type { PagePreset } from '../presets/HOME_PRESET';

type PageShellProps = {
  preset: PagePreset;
  hero?: ReactNode;
  filters?: ReactNode;
  feed: ReactNode;
};

export function PageShell({ preset, hero, filters, feed }: PageShellProps): ReactElement {
  const showHero = preset.sections.hero && hero !== undefined;
  const showFilters = preset.visibleFilters.length > 0 && filters !== undefined;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {showHero ? <section style={heroStyle}>{hero}</section> : null}
        <div style={showFilters ? layoutWithFiltersStyle : layoutFeedOnlyStyle}>
          {showFilters ? (
            <aside style={filterColumnStyle} aria-label="Filters">
              {filters}
            </aside>
          ) : null}
          <section style={feedColumnStyle} aria-label="Feed">
            {feed}
          </section>
        </div>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#FBF7F1',
  color: '#0E0F12',
  fontFamily: 'system-ui, sans-serif',
};

const containerStyle: CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
  padding: '2rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

const heroStyle: CSSProperties = {
  width: '100%',
};

const layoutWithFiltersStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
  gap: '2rem',
  alignItems: 'start',
};

const layoutFeedOnlyStyle: CSSProperties = {
  display: 'block',
};

const filterColumnStyle: CSSProperties = {
  position: 'sticky',
  top: '1.5rem',
};

const feedColumnStyle: CSSProperties = {
  minWidth: 0,
};
