'use client';

import { useEffect, useState, type ReactElement } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';

/** Below this the marquee loop looks broken (huge gaps) — better to show nothing. */
const MIN_ITEMS = 4;
const MAX_ITEMS = 12;

/**
 * The empty state's inspiration strip: an auto-scrolling marquee of real
 * activities with photos, pulled from the feed (chat → feed is an allowed
 * edge). Picking one pre-fills a targeted prompt — the parent owns that text.
 * Decorative by design: a failed fetch or a thin feed just hides the strip.
 */
export function ChatInspirationCarousel({
  onPick,
}: {
  onPick: (activity: ActivityDTO) => void;
}): ReactElement | null {
  const [items, setItems] = useState<ActivityDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/feed?limit=24', { cache: 'no-store' });
        if (!res.ok) return;
        const dto = (await res.json()) as FeedResultDTO;
        const withImages = dto.items.filter((a) => a.imageUrl).slice(0, MAX_ITEMS);
        if (!cancelled) setItems(withImages);
      } catch {
        // Inspiration only — no error state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length < MIN_ITEMS) return null;

  // The track holds the list twice: the CSS marquee slides by -50% then loops
  // seamlessly. The clones are hidden from keyboard and screen readers.
  const track = [...items, ...items];

  return (
    <div className="chat-carousel">
      <div className="chat-carousel-eyebrow">Pour t&rsquo;inspirer</div>
      <div className="chat-carousel-mask">
        <div className="chat-carousel-track">
          {track.map((activity, i) => (
            <button
              key={`${activity.id}-${i}`}
              type="button"
              className="chat-carousel-card"
              onClick={() => onPick(activity)}
              tabIndex={i < items.length ? 0 : -1}
              aria-hidden={i >= items.length}
            >
              <span
                className="chat-carousel-img"
                style={{ backgroundImage: `url(${activity.imageUrl})` }}
              />
              <span className="chat-carousel-scrim" />
              <span className="chat-carousel-title">{activity.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
