export type FeedSectionSource = 'top';

export type FeedSectionSpec = {
  /** Stable React key + section id. */
  key: string;
  /** User-facing title (honest, literal — no subtitle). */
  title: string;
  source: FeedSectionSource;
};

/**
 * The single shared section list driving every Category page AND Home.
 * `top` ("Pour toi") claims the first ranked items; the remainder spills into the
 * trailing "D’autres ont aussi aimé" grid. Rename the band by editing this entry.
 */
export const DEFAULT_FEED_SECTIONS: FeedSectionSpec[] = [
  { key: 'top', title: 'Pour toi', source: 'top' },
];
