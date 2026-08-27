import type { FeedItemDTO } from '@wandr/shared';

export type FeedRow =
  | { type: 'cards'; key: string; items: FeedItemDTO[] }
  | { type: 'spotlight'; key: string; item: FeedItemDTO };

const SPOTLIGHT_EVERY = 10;

function pickSpotlightIndexes(items: FeedItemDTO[]): Set<number> {
  const picked = new Set<number>();

  for (let start = SPOTLIGHT_EVERY; start < items.length; start += SPOTLIGHT_EVERY) {
    const end = Math.min(start + SPOTLIGHT_EVERY, items.length);
    let fallback = -1;
    let featured = -1;

    for (let i = start; i < end; i += 1) {
      if (!items[i].imageUrl) continue;
      if (items[i].isFeatured) {
        featured = i;
        break;
      }
      if (fallback === -1) fallback = i;
    }

    const chosen = featured !== -1 ? featured : fallback;
    if (chosen !== -1) picked.add(chosen);
  }

  return picked;
}

export function buildFeedRows(items: FeedItemDTO[], columns: 1 | 2): FeedRow[] {
  const spotlights = pickSpotlightIndexes(items);
  const rows: FeedRow[] = [];
  let pending: FeedItemDTO[] = [];

  function flush() {
    if (pending.length === 0) return;
    rows.push({ type: 'cards', key: `cards-${pending[0].id}`, items: pending });
    pending = [];
  }

  items.forEach((item, index) => {
    if (spotlights.has(index)) {
      flush();
      rows.push({ type: 'spotlight', key: `spotlight-${item.id}`, item });
      return;
    }
    pending.push(item);
    if (pending.length === columns) flush();
  });
  flush();

  return rows;
}
