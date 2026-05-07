'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';

import type { FeedItemDTO, FeedResultDTO } from '../contracts/FeedResultDTO';
import { ActivityCard, type ActivityCardVariant } from './ActivityCard';

type FeedGridProps = {
  initialItems: FeedItemDTO[];
  initialCursor: string | null;
  filterQueryString: string;
  variant?: ActivityCardVariant;
};

export function FeedGrid({
  initialItems,
  initialCursor,
  filterQueryString,
  variant = 'standard',
}: FeedGridProps): ReactElement {
  const [items, setItems] = useState<FeedItemDTO[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (cursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadNext();
            break;
          }
        }
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();

    async function loadNext(): Promise<void> {
      if (loading || cursor === null) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(filterQueryString);
        params.set('cursor', cursor);
        const res = await fetch(`/api/feed?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`feed request failed: ${res.status}`);
        const dto: FeedResultDTO = await res.json();
        setItems((prev) => [...prev, ...dto.items]);
        setCursor(dto.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load more.');
      } finally {
        setLoading(false);
      }
    }
  }, [cursor, loading, filterQueryString]);

  if (items.length === 0) {
    return <p style={emptyStyle}>No activities match your filters.</p>;
  }

  return (
    <div>
      <div style={gridStyle} role="list" aria-label="Activities">
        {items.map((item) => (
          <div role="listitem" key={item.id}>
            <ActivityCard activity={item} variant={variant} />
          </div>
        ))}
      </div>
      <div ref={sentinelRef} style={sentinelStyle} aria-hidden="true" />
      {loading ? <p style={statusStyle}>Loading more…</p> : null}
      {error ? <p style={errorStyle}>{error}</p> : null}
      {cursor === null && items.length > 0 ? (
        <p style={statusStyle}>You&rsquo;ve reached the end.</p>
      ) : null}
    </div>
  );
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
  width: '100%',
};

const sentinelStyle: CSSProperties = {
  height: 1,
  width: '100%',
};

const emptyStyle: CSSProperties = {
  margin: 0,
  padding: '2rem',
  textAlign: 'center',
  color: '#5A5C66',
  fontFamily: 'system-ui, sans-serif',
};

const statusStyle: CSSProperties = {
  margin: '1.5rem 0 0',
  textAlign: 'center',
  color: '#5A5C66',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '0.875rem',
};

const errorStyle: CSSProperties = {
  margin: '1.5rem 0 0',
  textAlign: 'center',
  color: '#B42323',
  fontFamily: 'system-ui, sans-serif',
  fontSize: '0.875rem',
};
