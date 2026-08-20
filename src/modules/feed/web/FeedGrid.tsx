'use client';

import { useLenis } from 'lenis/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { ImagelessActivityCard } from '../../activities/web/cards/ImagelessActivityCard';
import { CardActions } from './CardActions';

type FeedGridProps = {
  initialItems: FeedItemDTO[];
  initialCursor: string | null;
  filterQueryString: string;
  feedApiPath?: string;
  emptyMessage?: string;
  /** When false, the grid is static: no infinite-scroll sentinel, no end message. */
  paginate?: boolean;
};

/**
 * Deterministic masonry: at 3 columns, every odd grid row carries exactly one
 * 20%-shorter card, the reduced column cycling col2 → col1 → col3. Even rows are
 * all normal. Cards are distributed round-robin (`i % cols`), so global index `i`
 * lands at row `floor(i/3)`, column `i % 3`. See plan for the truth table.
 */
function isShort(i: number): boolean {
  const row = Math.floor(i / 3);
  if (row % 2 === 0) return false;
  const col = i % 3;
  const reducedCol = [1, 0, 2][((row - 1) / 2) % 3];
  return col === reducedCol;
}

/** Columns for the current width: 3 desktop, 2 ≤1080px, 1 ≤760px. */
function useColumnCount(): number {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const mqOne = window.matchMedia('(max-width: 760px)');
    const mqTwo = window.matchMedia('(max-width: 1080px)');
    const update = () => setCols(mqOne.matches ? 1 : mqTwo.matches ? 2 : 3);
    update();
    mqOne.addEventListener('change', update);
    mqTwo.addEventListener('change', update);
    return () => {
      mqOne.removeEventListener('change', update);
      mqTwo.removeEventListener('change', update);
    };
  }, []);
  return cols;
}

export function FeedGrid({
  initialItems,
  initialCursor,
  filterQueryString,
  feedApiPath = '/api/feed',
  emptyMessage = 'Aucune activité ne correspond à vos filtres.',
  paginate = true,
}: FeedGridProps): ReactElement {
  const [items, setItems] = useState<FeedItemDTO[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const masonryRef = useRef<HTMLDivElement | null>(null);
  const cols = useColumnCount();

  // Subtle per-column parallax (3-col only): the columns drift at slightly
  // different rates, anchored to the top of the grid. Progress `d` is 0 while
  // the grid's top sits at (or below) the viewport top — the three top cards are
  // aligned — and grows to 1 across the section's full scroll extent, reaching
  // the cap exactly when the grid's bottom meets the viewport bottom. Clamping
  // to [0,1] means scrolling back up realigns the top, and once the section has
  // left the viewport the offset is frozen, so the rest of the page never shifts
  // the columns. Driven imperatively via CSS vars (no per-frame re-render),
  // mirroring FeaturedHero. Disabled for reduced-motion users.
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useLenis(
    () => {
      const el = masonryRef.current;
      if (!el || reduced || cols !== 3) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const d = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - vh)));
      el.style.setProperty('--p-col-0', `${d * -80}px`);
      el.style.setProperty('--p-col-1', `${d * 40}px`);
      el.style.setProperty('--p-col-2', `${d * -8}px`);
    },
    [reduced, cols],
  );

  useEffect(() => {
    if (!paginate) return;
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
  }, [cursor, loading, filterQueryString, feedApiPath, paginate]);

  if (items.length === 0) {
    return <p className="feed-empty">{emptyMessage}</p>;
  }

  const columns: { item: FeedItemDTO; i: number }[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => columns[i % cols].push({ item, i }));

  return (
    <div>
      <div
        className="feed-masonry"
        ref={masonryRef}
        data-cols={cols}
        role="list"
        aria-label="Activities"
      >
        {columns.map((col, c) => (
          <div className="feed-col" data-col={c} key={c}>
            {col.map(({ item, i }) => (
              <div
                role="listitem"
                key={item.id}
                className={cols === 3 && isShort(i) ? 'feed-cell feed-cell--short' : 'feed-cell'}
              >
                {item.imageUrl ? (
                  <CoverActivityCard
                    activity={item}
                    showPrice
                    actionsSlot={<CardActions item={item} />}
                  />
                ) : (
                  <ImagelessActivityCard activity={item} actionsSlot={<CardActions item={item} />} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {paginate && (
        <>
          <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />
          {loading ? <p className="feed-status">Chargement…</p> : null}
          {error ? <p className="feed-error">{error}</p> : null}
          {cursor === null && items.length > 0 ? (
            <p className="feed-status">No more activities to display</p>
          ) : null}
        </>
      )}
    </div>
  );
}
