# Sectioned Activity Feed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single uniform `FeedGrid` on Category pages and the Home "Recommended for You" grid with a data-adaptive multi-section layout (feature → alternating MediaRow + grid-of-4), plus a `MapSection` on every page, all driven by one shared section list over a single partitioned feed pool.

**Architecture:** One ranked pool (`limit=48`) is fetched server-side per page. A pure web-layer function `buildFeedSections` partitions it by real attributes — themed buckets (`outdoor`, `free`) claim first if they reach a minimum, then a `Pour toi` catch-all takes the ranked remainder, rendered first. A server component `SectionedFeed` renders the rhythm (reusing the existing `CoverActivityCard` / `MediaRowActivityCard`) plus a trailing "Toutes les activités" `FeedGrid` for the long tail. `MapSection` is fed from the same pool. Spec: `docs/superpowers/specs/2026-06-01-sectioned-activity-feed-design.md`.

**Tech Stack:** Next.js App Router (server components), TypeScript, Vitest, dependency-cruiser, ESLint, pnpm.

**Preconditions / context for the implementer:**
- The working tree has an **in-progress, uncommitted card refactor** (the four surviving cards: `HeroActivityCard`, `ClassActivityCard`, `MediaRowActivityCard`, `CoverActivityCard`; `CoverActivityCard.tsx` is currently untracked). This feature **depends on that working-tree state** — do not revert or `git stash` it.
- The working tree also has **unrelated pre-staged files** (`package.json`, `pnpm-workspace.yaml`, `tbd.md`, `tsconfig.tsbuildinfo`, `.claude/agents/wandr-theme-scout.md`). So every commit below runs with an **explicit pathspec** — `git add <paths> && git commit -m "…" -- <paths>` (never `git add -A`/`git add .`, never a path-less `git commit`) — committing *only* the named feature files and leaving everything else staged/untouched.
- Branch: work continues on the current branch (`claude/user-auth-profile-plan-EJIY9`).
- No new CSS is required: the feature card is a full-width standalone `CoverActivityCard size="lg"`; spacing uses inline `gap` (matching `design-showcase/page.tsx`); the grid reuses `.cover-grid`.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/shared/presets/FEED_SECTIONS.ts` | Create | `FeedSectionSource`, `FeedSectionSpec`, `DEFAULT_FEED_SECTIONS` (pure config). |
| `src/modules/feed/web/buildFeedSections.ts` | Create | Pure partition `(items, specs, opts?) → { sections, leftovers }` + `POOL_LIMIT`, `MIN_SECTION_ITEMS`, `MAX_SECTION_ITEMS`. |
| `src/modules/feed/web/buildFeedSections.test.ts` | Create | Vitest unit tests for the partitioner. |
| `src/modules/feed/web/SectionedFeed.tsx` | Create | Server component: partitions, renders the rhythm + trailing grid. |
| `src/modules/activities/web/MapSection.tsx` | Modify | Cap markers at 24; render nothing when no geolocated items. |
| `src/modules/activities/web/cards/MediaRowActivityCard.tsx` | Modify | Render the eyebrow only when one is provided (drop the English default). |
| `src/modules/feed/web/CategoryFeedPage.tsx` | Modify | `page-hero` → `MapSection` → `SectionedFeed` (replaces the single `FeedGrid`). |
| `src/app/(with-sidebar)/_lib/categoryPage.tsx` | Modify | Fetch the pool at `limit=48`. |
| `src/app/(with-sidebar)/page.tsx` | Modify | Pool@48, drop the `nearby` query, `MapSection(pool)`, `SectionedFeed(excludeIds=hero ids)`. |
| `src/modules/feed/web/RecommendationsSection.tsx` | Delete | Replaced by `SectionedFeed` (chips/header were dead/duplicative). |
| `tbd.md` | Modify | Mark the section system as existing; record the new tuning constants. |

---

## Task 1: Section config (`FEED_SECTIONS`)

**Files:**
- Create: `src/shared/presets/FEED_SECTIONS.ts`

- [ ] **Step 1: Create the config file**

```ts
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
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/shared/presets/FEED_SECTIONS.ts
git commit -m "feat(feed): add shared FEED_SECTIONS config" -- src/shared/presets/FEED_SECTIONS.ts
```

---

## Task 2: Partitioner (`buildFeedSections`) — TDD

**Files:**
- Create: `src/modules/feed/web/buildFeedSections.ts`
- Test: `src/modules/feed/web/buildFeedSections.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/feed/web/buildFeedSections.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSpec } from '../../../shared/presets/FEED_SECTIONS';
import { buildFeedSections } from './buildFeedSections';

const SPECS: FeedSectionSpec[] = [
  { key: 'top', title: 'Pour toi', source: 'top' },
  { key: 'outdoor', title: 'En plein air', source: 'outdoor' },
  { key: 'free', title: 'Gratuit', source: 'free' },
];

let seq = 0;
function item(overrides: Partial<FeedItemDTO> = {}): FeedItemDTO {
  seq += 1;
  return {
    id: `a_${seq}`,
    slug: `a-${seq}`,
    title: `Activity ${seq}`,
    description: 'desc',
    imageUrl: null,
    kind: 'PLACE',
    categories: { primary: 'CULTURE', secondary: [] },
    address: 'Montreal',
    neighborhood: null,
    latitude: 45.5,
    longitude: -73.5,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 1000, // paid by default
    priceMaxCents: null,
    externalUrl: null,
    indoor: true, // indoor + paid => non-themed by default => goes to `top`
    outdoor: false,
    isFeatured: false,
    status: 'PUBLISHED',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    matchScore: 5,
    isFavorited: false,
    ...overrides,
  };
}

const ids = (items: FeedItemDTO[]) => items.map((a) => a.id);

describe('buildFeedSections', () => {
  it('returns empty result for empty input', () => {
    expect(buildFeedSections([], SPECS)).toEqual({ sections: [], leftovers: [] });
  });

  it('renders `top` first even though it is assigned last', () => {
    const outdoor = Array.from({ length: 6 }, () => item({ outdoor: true }));
    const rest = Array.from({ length: 6 }, () => item()); // non-themed -> top
    const { sections } = buildFeedSections([...outdoor, ...rest], SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top', 'outdoor']);
    expect(sections[0].items).toHaveLength(6);
    expect(sections[1].items).toHaveLength(6);
  });

  it('auto-hides a themed section below MIN (6) and folds its items into `top`', () => {
    const outdoor = Array.from({ length: 5 }, () => item({ outdoor: true })); // 5 < 6
    const rest = Array.from({ length: 6 }, () => item());
    const { sections, leftovers } = buildFeedSections([...outdoor, ...rest], SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top']);
    expect(sections[0].items).toHaveLength(11); // 5 + 6, capped at MAX
    expect(leftovers).toHaveLength(0);
  });

  it('caps a section at MAX (11) and overflows the rest to leftovers', () => {
    const many = Array.from({ length: 15 }, () => item()); // all non-themed -> top
    const { sections, leftovers } = buildFeedSections(many, SPECS);

    expect(sections.map((s) => s.spec.key)).toEqual(['top']);
    expect(sections[0].items).toHaveLength(11);
    expect(leftovers).toHaveLength(4);
  });

  it('preserves input order within `top` (pool is pre-ranked by matchScore)', () => {
    const a = item({ matchScore: 9 });
    const b = item({ matchScore: 8 });
    const c = item({ matchScore: 7 });
    const { sections } = buildFeedSections([a, b, c], SPECS);

    expect(sections).toHaveLength(1);
    expect(ids(sections[0].items)).toEqual([a.id, b.id, c.id]);
  });

  it('gives a dual-attribute item to the earlier themed pass (outdoor before free)', () => {
    const outdoorOnly = Array.from({ length: 6 }, () => item({ outdoor: true }));
    const dual = item({ outdoor: true, priceMinCents: 0 }); // outdoor AND free
    const freeOnly = Array.from({ length: 6 }, () => item({ priceMinCents: 0 }));
    const { sections } = buildFeedSections([...outdoorOnly, dual, ...freeOnly], SPECS);

    const outdoor = sections.find((s) => s.spec.key === 'outdoor');
    const free = sections.find((s) => s.spec.key === 'free');
    expect(outdoor && ids(outdoor.items)).toContain(dual.id);
    expect(free && ids(free.items)).not.toContain(dual.id);
  });

  it('never places an item in two sections (disjoint)', () => {
    const outdoor = Array.from({ length: 6 }, () => item({ outdoor: true }));
    const free = Array.from({ length: 6 }, () => item({ priceMinCents: 0 }));
    const rest = Array.from({ length: 6 }, () => item());
    const { sections, leftovers } = buildFeedSections([...outdoor, ...free, ...rest], SPECS);

    const all = [...sections.flatMap((s) => s.items), ...leftovers].map((a) => a.id);
    expect(new Set(all).size).toBe(all.length);
  });

  it('is exhaustive: section items + leftovers === input', () => {
    const items = [
      ...Array.from({ length: 6 }, () => item({ outdoor: true })),
      ...Array.from({ length: 4 }, () => item({ priceMinCents: 0 })),
      ...Array.from({ length: 9 }, () => item()),
    ];
    const { sections, leftovers } = buildFeedSections(items, SPECS);
    const total = sections.reduce((n, s) => n + s.items.length, 0) + leftovers.length;
    expect(total).toBe(items.length);
  });

  it('removes excludeIds from both sections and leftovers', () => {
    const keep = Array.from({ length: 6 }, () => item());
    const dropped = item();
    const excludeIds = new Set([dropped.id]);
    const { sections, leftovers } = buildFeedSections([dropped, ...keep], SPECS, { excludeIds });

    const all = [...sections.flatMap((s) => s.items), ...leftovers].map((a) => a.id);
    expect(all).not.toContain(dropped.id);
    expect(all).toHaveLength(keep.length);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/modules/feed/web/buildFeedSections.test.ts`
Expected: FAIL — `buildFeedSections` is not exported / module not found.

- [ ] **Step 3: Implement the partitioner**

Create `src/modules/feed/web/buildFeedSections.ts`:

```ts
import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSource, FeedSectionSpec } from '../../../shared/presets/FEED_SECTIONS';

export type RenderedSection = { spec: FeedSectionSpec; items: FeedItemDTO[] };
export type SectionedResult = { sections: RenderedSection[]; leftovers: FeedItemDTO[] };

/** How many items the page pool is fetched at (cap is MAX_FEED_LIMIT = 50). */
export const POOL_LIMIT = 48;
/** Below this, a themed section auto-hides (feature + 1 full stanza). */
export const MIN_SECTION_ITEMS = 6;
/** feature(1) + 2 stanzas of [MediaRow + 4 grid]. */
export const MAX_SECTION_ITEMS = 11;

const THEMED_PREDICATES: Record<Exclude<FeedSectionSource, 'top'>, (a: FeedItemDTO) => boolean> = {
  outdoor: (a) => a.outdoor,
  free: (a) => a.priceMinCents === 0,
};

/**
 * Partitions a ranked pool into sections by real attributes.
 * - Themed specs (source !== 'top') claim matching, unused items first, in spec
 *   order, capped at MAX; kept only if they reach MIN (else auto-hidden).
 * - `top` claims the best of the remainder (input is matchScore-sorted), capped
 *   at MAX; kept if non-empty. It is assigned last but rendered in spec order.
 * - Exhaustive: every non-excluded item lands in a section or in leftovers.
 */
export function buildFeedSections(
  items: FeedItemDTO[],
  specs: FeedSectionSpec[],
  opts?: { excludeIds?: ReadonlySet<string> },
): SectionedResult {
  const exclude = opts?.excludeIds;
  const pool = exclude ? items.filter((a) => !exclude.has(a.id)) : items;

  const used = new Set<string>();
  const claimed = new Map<string, FeedItemDTO[]>();

  const take = (matches: (a: FeedItemDTO) => boolean): FeedItemDTO[] => {
    const picked: FeedItemDTO[] = [];
    for (const a of pool) {
      if (picked.length >= MAX_SECTION_ITEMS) break;
      if (used.has(a.id)) continue;
      if (matches(a)) picked.push(a);
    }
    return picked;
  };

  // Pass 1 — themed buckets claim first.
  for (const spec of specs) {
    if (spec.source === 'top') continue;
    const picked = take(THEMED_PREDICATES[spec.source]);
    if (picked.length >= MIN_SECTION_ITEMS) {
      picked.forEach((a) => used.add(a.id));
      claimed.set(spec.key, picked);
    }
  }

  // Pass 2 — `top` takes the ranked remainder.
  for (const spec of specs) {
    if (spec.source !== 'top') continue;
    const picked = take(() => true);
    if (picked.length > 0) {
      picked.forEach((a) => used.add(a.id));
      claimed.set(spec.key, picked);
    }
  }

  // Render in spec order (so `top` shows first).
  const sections: RenderedSection[] = [];
  for (const spec of specs) {
    const got = claimed.get(spec.key);
    if (got && got.length > 0) sections.push({ spec, items: got });
  }

  const leftovers = pool.filter((a) => !used.has(a.id));
  return { sections, leftovers };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/modules/feed/web/buildFeedSections.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Type-check + dependency check**

Run: `pnpm type-check && pnpm dep:check`
Expected: PASS (no new forbidden edges — `feed/web → shared/contracts` and `feed/web → shared/presets` are allowed).

- [ ] **Step 6: Commit**

```bash
git add src/modules/feed/web/buildFeedSections.ts src/modules/feed/web/buildFeedSections.test.ts
git commit -m "feat(feed): add buildFeedSections partitioner (TDD)" -- src/modules/feed/web/buildFeedSections.ts src/modules/feed/web/buildFeedSections.test.ts
```

---

## Task 3: `MapSection` — cap markers + hide when empty

**Files:**
- Modify: `src/modules/activities/web/MapSection.tsx`

- [ ] **Step 1: Add a marker cap and an empty guard**

In `src/modules/activities/web/MapSection.tsx`, replace the marker-building block and add the guard. Change:

```tsx
  const markers: MapMarkerData[] = nearbyActivities
    .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
    .map((a) => ({
      id: a.id,
      lng: a.longitude,
      lat: a.latitude,
      label: a.title,
      color: a.kind === 'EVENT' ? 'orange' : 'blue',
      onClick: () => open(a),
    }));

  return (
```

to:

```tsx
  const MARKER_CAP = 24;
  const markers: MapMarkerData[] = nearbyActivities
    .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
    .slice(0, MARKER_CAP)
    .map((a) => ({
      id: a.id,
      lng: a.longitude,
      lat: a.latitude,
      label: a.title,
      color: a.kind === 'EVENT' ? 'orange' : 'blue',
      onClick: () => open(a),
    }));

  if (markers.length === 0) return null;

  return (
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/web/MapSection.tsx
git commit -m "feat(activities): cap MapSection markers at 24 and hide when none geolocated" -- src/modules/activities/web/MapSection.tsx
```

---

## Task 4: `MediaRowActivityCard` — eyebrow only when provided

**Files:**
- Modify: `src/modules/activities/web/cards/MediaRowActivityCard.tsx`

Rationale: the default eyebrow `'IN THE SPOTLIGHT'` is editorial English; the new sections pass no eyebrow and must show none. The `design-showcase` always passes an explicit eyebrow, so dropping the default is safe.

- [ ] **Step 1: Render the eyebrow conditionally**

In `src/modules/activities/web/cards/MediaRowActivityCard.tsx`, change:

```tsx
        <div className="media-row-eyebrow">{eyebrow ?? 'IN THE SPOTLIGHT'}</div>
```

to:

```tsx
        {eyebrow ? <div className="media-row-eyebrow">{eyebrow}</div> : null}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/web/cards/MediaRowActivityCard.tsx
git commit -m "feat(activities): render MediaRow eyebrow only when provided" -- src/modules/activities/web/cards/MediaRowActivityCard.tsx
```

---

## Task 5: `SectionedFeed` renderer

**Files:**
- Create: `src/modules/feed/web/SectionedFeed.tsx`

- [ ] **Step 1: Create the server component**

Create `src/modules/feed/web/SectionedFeed.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import { DEFAULT_FEED_SECTIONS } from '../../../shared/presets/FEED_SECTIONS';
import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { MediaRowActivityCard } from '../../activities/web/cards/MediaRowActivityCard';
import { AddToCalendarButton } from '../../calendar/web/AddToCalendarButton';
import { FavoriteButton } from '../../favorites/web/FavoriteButton';
import { buildFeedSections, type RenderedSection } from './buildFeedSections';
import { FeedGrid } from './FeedGrid';

/** 1 MediaRow + up to 4 grid cards. */
const STANZA = 5;

type SectionedFeedProps = {
  items: FeedItemDTO[];
  nextCursor: string | null;
  filterQueryString: string;
  feedApiPath?: string;
  /** Activity ids already shown elsewhere on the page (e.g. the Home hero). */
  excludeIds?: ReadonlySet<string>;
};

function favoriteSlot(a: FeedItemDTO): ReactNode {
  return <FavoriteButton activityId={a.id} initialFavorited={a.isFavorited} />;
}
function calendarSlot(a: FeedItemDTO): ReactNode {
  return <AddToCalendarButton activityId={a.id} activityTitle={a.title} />;
}

function chunk(items: FeedItemDTO[], size: number): FeedItemDTO[][] {
  const out: FeedItemDTO[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function Section({ section }: { section: RenderedSection }): ReactElement {
  const [feature, ...rest] = section.items;
  const stanzas = chunk(rest, STANZA);

  return (
    <section className="content-section">
      <div className="section-head">
        <div>
          <h2>{section.spec.title}</h2>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <CoverActivityCard
          activity={feature}
          size="lg"
          showPrice
          favoriteSlot={favoriteSlot(feature)}
          calendarSlot={calendarSlot(feature)}
        />
        {stanzas.map((stanza, i) => {
          const [row, ...grid] = stanza;
          return (
            <div key={`stanza-${i}`} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <MediaRowActivityCard
                activity={row}
                side={i % 2 === 0 ? 'left' : 'right'}
                favoriteSlot={favoriteSlot(row)}
                calendarSlot={calendarSlot(row)}
              />
              {grid.length > 0 && (
                <div className="cover-grid">
                  {grid.map((a) => (
                    <CoverActivityCard
                      key={a.id}
                      activity={a}
                      showPrice
                      favoriteSlot={favoriteSlot(a)}
                      calendarSlot={calendarSlot(a)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Renders the partitioned pool as themed sections (feature → alternating
 * MediaRow + grid-of-4) followed by a trailing "Toutes les activités" grid for
 * the long tail. Server component; the cards/slots are client leaves.
 */
export function SectionedFeed({
  items,
  nextCursor,
  filterQueryString,
  feedApiPath,
  excludeIds,
}: SectionedFeedProps): ReactElement {
  const { sections, leftovers } = buildFeedSections(items, DEFAULT_FEED_SECTIONS, { excludeIds });
  const showTail = leftovers.length > 0 || nextCursor !== null;

  return (
    <>
      {sections.map((section) => (
        <Section key={section.spec.key} section={section} />
      ))}
      {showTail && (
        <section className="content-section">
          <div className="section-head">
            <div>
              <h2>Toutes les activités</h2>
            </div>
          </div>
          <FeedGrid
            initialItems={leftovers}
            initialCursor={nextCursor}
            filterQueryString={filterQueryString}
            feedApiPath={feedApiPath}
          />
        </section>
      )}
    </>
  );
}
```

- [ ] **Step 2: Type-check + dependency check**

Run: `pnpm type-check && pnpm dep:check`
Expected: PASS. (`feed/web → activities/web`, `feed/web → favorites/web`, `feed/web → calendar/web` are allowed and already used by `FeedGrid`.)

- [ ] **Step 3: Commit**

```bash
git add src/modules/feed/web/SectionedFeed.tsx
git commit -m "feat(feed): add SectionedFeed renderer (rhythm + trailing grid)" -- src/modules/feed/web/SectionedFeed.tsx
```

---

## Task 6: Wire the Category page

**Files:**
- Modify: `src/modules/feed/web/CategoryFeedPage.tsx`
- Modify: `src/app/(with-sidebar)/_lib/categoryPage.tsx`

- [ ] **Step 1: Rewrite `CategoryFeedPage` to use Map + SectionedFeed**

Replace the entire contents of `src/modules/feed/web/CategoryFeedPage.tsx` with:

```tsx
import type { FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CATEGORY_PRESETS, type CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { MapSection } from '../../activities/web/MapSection';
import { SectionedFeed } from './SectionedFeed';

type CategoryFeedPageProps = {
  categoryKey: CategoryKey;
  initialFeed: FeedResultDTO; // the 48-item pool
  filterQueryString: string;
};

export function CategoryFeedPage({
  categoryKey,
  initialFeed,
  filterQueryString,
}: CategoryFeedPageProps) {
  const cfg = CATEGORY_PRESETS[categoryKey];
  const titleLines = cfg.heroTitle.split('\n');
  const presetQuery = filterQueryString
    ? `preset=${categoryKey}&${filterQueryString}`
    : `preset=${categoryKey}`;

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-img" style={{ backgroundImage: `url(${cfg.heroImage})` }} />
        <div className="page-hero-inner">
          <div className="hero-eyebrow">{cfg.eyebrow}</div>
          <h1>
            {titleLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </h1>
          <p>{cfg.heroSub}</p>
        </div>
      </div>

      <MapSection nearbyActivities={initialFeed.items} />

      <SectionedFeed
        key={`${categoryKey}-${filterQueryString}`}
        items={initialFeed.items}
        nextCursor={initialFeed.nextCursor}
        filterQueryString={presetQuery}
      />
    </>
  );
}
```

- [ ] **Step 2: Fetch the pool at `limit=48` in `renderCategoryPage`**

Replace the entire contents of `src/app/(with-sidebar)/_lib/categoryPage.tsx` with:

```tsx
import { CategoryFeedPage } from '../../../modules/feed/web/CategoryFeedPage';
import { loadCategoryFeedDTO } from '../../../modules/feed/web/loadCategoryFeed';
import { POOL_LIMIT } from '../../../modules/feed/web/buildFeedSections';
import { parseFilters, serializeFilters } from '../../../modules/filters/application/url-codec';
import type { CategoryKey } from '../../../shared/presets/CATEGORY_PRESETS';
import { toURLSearchParams, type SearchParamsInput } from './searchParams';

export async function renderCategoryPage(categoryKey: CategoryKey, searchParams: SearchParamsInput) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const poolParams = new URLSearchParams(params);
  poolParams.set('limit', String(POOL_LIMIT));

  const initialFeed = await loadCategoryFeedDTO(categoryKey, poolParams);
  const filterQueryString = serializeFilters(filters).toString();

  return (
    <CategoryFeedPage
      categoryKey={categoryKey}
      initialFeed={initialFeed}
      filterQueryString={filterQueryString}
    />
  );
}
```

- [ ] **Step 3: Type-check + dependency check**

Run: `pnpm type-check && pnpm dep:check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/modules/feed/web/CategoryFeedPage.tsx "src/app/(with-sidebar)/_lib/categoryPage.tsx"
git commit -m "feat(feed): render Category pages with Map + sections" -- src/modules/feed/web/CategoryFeedPage.tsx "src/app/(with-sidebar)/_lib/categoryPage.tsx"
```

---

## Task 7: Wire the Home page + remove `RecommendationsSection`

**Files:**
- Modify: `src/app/(with-sidebar)/page.tsx`
- Delete: `src/modules/feed/web/RecommendationsSection.tsx`

- [ ] **Step 1: Confirm `RecommendationsSection` has no other importers**

Run: `git grep -n "RecommendationsSection" -- src`
Expected: matches only in `src/app/(with-sidebar)/page.tsx` (the import) and `src/modules/feed/web/RecommendationsSection.tsx` (its own definition). If any other file imports it, stop and reconcile.

- [ ] **Step 2: Rewrite `HomePage`**

Replace the entire contents of `src/app/(with-sidebar)/page.tsx` with:

```tsx
import { HeroSection } from '../../modules/activities/web/HeroSection';
import { listFeaturedActivities } from '../../modules/activities/web/listFeaturedActivities';
import { MapSection } from '../../modules/activities/web/MapSection';
import { POOL_LIMIT } from '../../modules/feed/web/buildFeedSections';
import { loadFeedDTO } from '../../modules/feed/web/feedRoute';
import { SectionedFeed } from '../../modules/feed/web/SectionedFeed';
import { parseFilters, serializeFilters } from '../../modules/filters/application/url-codec';
import { FooterBanner } from '../../shared/ui/FooterBanner';
import { toURLSearchParams, type SearchParamsInput } from './_lib/searchParams';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = toURLSearchParams(searchParams);
  const filters = parseFilters(params);

  const poolParams = new URLSearchParams(params);
  poolParams.set('limit', String(POOL_LIMIT));

  const [pool, featured] = await Promise.all([
    loadFeedDTO(poolParams),
    listFeaturedActivities(6),
  ]);

  const filterQueryString = serializeFilters(filters).toString();
  const excludeIds = new Set(featured.map((a) => a.id));

  return (
    <>
      <HeroSection featured={featured} />
      <MapSection nearbyActivities={pool.items} />
      <SectionedFeed
        items={pool.items}
        nextCursor={pool.nextCursor}
        filterQueryString={filterQueryString}
        excludeIds={excludeIds}
      />
      <FooterBanner />
    </>
  );
}
```

- [ ] **Step 3: Delete `RecommendationsSection`**

```bash
git rm src/modules/feed/web/RecommendationsSection.tsx
```

- [ ] **Step 4: Type-check + dependency check**

Run: `pnpm type-check && pnpm dep:check`
Expected: PASS (no dangling import of `RecommendationsSection`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(with-sidebar)/page.tsx"
git commit -m "feat(feed): render Home with Map + sections, drop dead recommendations chips" -- "src/app/(with-sidebar)/page.tsx" src/modules/feed/web/RecommendationsSection.tsx
```

---

## Task 8: Update `tbd.md`

**Files:**
- Modify: `tbd.md`

> Note: `tbd.md` already carries unrelated uncommitted edits from the in-progress card refactor; the pathspec commit below will include them. If you need them isolated, coordinate with the working-tree owner first.

- [ ] **Step 1: Mark the section system as existing**

In `tbd.md`, under `## Future changes`, replace the existing bullet that begins **"Declarative multi-section Category page system."** with:

```markdown
- **Retire the `design-showcase` palette.** The declarative section system now exists — `shared/presets/FEED_SECTIONS.ts` (`DEFAULT_FEED_SECTIONS`) + `src/modules/feed/web/SectionedFeed.tsx` (one renderer) drive Category pages and Home over a partitioned pool (`buildFeedSections`). What remains deferred: deleting the dev-only `design-showcase` palette, and adding **per-category** section overrides (today one shared list serves all). — `src/app/(with-sidebar)/design-showcase/page.tsx`.
```

- [ ] **Step 2: Record the new tuning constants**

In `tbd.md`, under `## Hardcoded`, add:

```markdown
- **Feed-section tuning constants** in `src/modules/feed/web/buildFeedSections.ts`: `POOL_LIMIT = 48` (page pool size, cap `MAX_FEED_LIMIT = 50`), `MIN_SECTION_ITEMS = 6` (themed-section auto-hide floor), `MAX_SECTION_ITEMS = 11` (feature + 2 stanzas). Plus `MARKER_CAP = 24` in `src/modules/activities/web/MapSection.tsx`. Tune when the catalogue grows. — spec `2026-06-01-sectioned-activity-feed-design.md`.
```

- [ ] **Step 3: Commit**

```bash
git add tbd.md
git commit -m "docs(tbd): section system now exists; record feed-section constants" -- tbd.md
```

---

## Task 9: Full verification gate

**Files:** none (verification only).

- [ ] **Step 1: Run the full gate**

Run: `pnpm type-check && pnpm dep:check && pnpm test && pnpm lint`
Expected: all PASS. The `buildFeedSections` suite passes; no forbidden edges; no lint errors.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: `next build` succeeds (no server/client boundary errors from `SectionedFeed` rendering client cards).

- [ ] **Step 3: Manual smoke check (optional but recommended)**

Run the dev server and verify:
- A Category page (e.g. `/culture`): banner → map with pins → at least a "Pour toi" section in the feature→MediaRow→grid rhythm; thin categories show one rich section.
- Home (`/`): hero → map with pins (more than before) → sections, with no hero activity repeated in the sections.

- [ ] **Step 4: Final commit (only if Step 3 required a fix)**

```bash
git add <changed files>
git commit -m "fix(feed): address smoke-check findings" -- <changed files>
```

---

## Self-review notes (already reconciled against the spec)

- **Spec coverage:** anatomy (Tasks 6–7), one partitioned pool (Tasks 2, 6, 7), 3 shared sections (Task 1), themed-first + `top` fallback rendered first (Task 2), adaptive thresholds MIN 6 / MAX 11 (Task 2), honest copy / no subtitles (Tasks 1, 4, 5), Map on every page fed from pool + hide-when-empty (Tasks 3, 6, 7), Home chips/header removal + hero dedup + drop `nearby` query (Task 7), trailing grid auto-hide (Task 5), `tbd.md` updates (Task 8).
- **No new CSS:** confirmed — feature = full-width `CoverActivityCard size="lg"`; spacing via inline `gap`; grid reuses `.cover-grid`. The spec's `.cover-feature` proved unnecessary.
- **Type consistency:** `buildFeedSections(items, specs, opts?)`, `RenderedSection`, `SectionedResult`, `POOL_LIMIT/MIN_SECTION_ITEMS/MAX_SECTION_ITEMS`, `FeedSectionSpec/FeedSectionSource`, and `SectionedFeed` props are identical across Tasks 1–7.
