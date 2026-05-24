'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';

import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { RecActivityCard } from '../../activities/web/cards/RecActivityCard';
import { FromMapActivityCard } from '../../activities/web/cards/FromMapActivityCard';

export type FeedGridVariant = 'standard' | 'compact';

type FeedGridProps = {
  initialItems: FeedItemDTO[];
  initialCursor: string | null;
  filterQueryString: string;
  variant?: FeedGridVariant;
  feedApiPath?: string;
  emptyMessage?: string;
};

export function FeedGrid({
  initialItems,
  initialCursor,
  filterQueryString,
  variant = 'standard',
  feedApiPath = '/api/feed',
  emptyMessage = 'No activities match your filters.',
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
        const res = await fetch(`${feedApiPath}?${params.toString()}`, { cache: 'no-store' });
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
  }, [cursor, loading, filterQueryString, feedApiPath]);

  if (items.length === 0) {
    return <p className="feed-empty">{emptyMessage}</p>;
  }

  const gridClass = variant === 'compact' ? 'from-map-grid' : 'rec-grid';

  return (
    <div>
      <div className={gridClass} role="list" aria-label="Activities">
        {items.map((item) => (
          <div role="listitem" key={item.id}>
            {variant === 'compact' ? (
              <FromMapActivityCard activity={item} />
            ) : (
              <RecActivityCard activity={item} isFavorited={item.isFavorited} />
            )}
          </div>
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />
      {loading ? <p className="feed-status">Loading more…</p> : null}
      {error ? <p className="feed-error">{error}</p> : null}
      {cursor === null && items.length > 0 ? (
        <p className="feed-status">You&rsquo;ve reached the end.</p>
      ) : null}
    </div>
  );
}
