export type FeedSectionSource = 'top' | 'outdoor' | 'free';

export type FeedSectionSpec = {
  /** Stable React key + section id. */
  key: string;
  /** User-facing title (honest, literal — no subtitle). */
  title: string;
  source: FeedSectionSource;
};

/**
 * The single shared section list driving every Category page AND Home.
 * `top` ("Pour toi") is the affinity catch-all — assigned last, rendered first.
 * Reorder / rename / drop a theme by editing this array.
 */
export const DEFAULT_FEED_SECTIONS: FeedSectionSpec[] = [
  { key: 'top', title: 'Pour toi', source: 'top' },
  { key: 'outdoor', title: 'En plein air', source: 'outdoor' },
  { key: 'free', title: 'Gratuit', source: 'free' },
];
