# Sectioned activity feed — richer Category & Home pages — Design

**Date:** 2026-06-01
**Stage:** personal POC (single locale, single user, single deployment)
**Scope:** Replace the single uniform `FeedGrid` on Category pages — and the Home "Recommended for You" grid — with a richer multi-section layout that **reuses the existing card variants** (`HeroActivityCard`, `ClassActivityCard`, `MediaRowActivityCard`, `CoverActivityCard`). One shared, declarative section list drives all 6 categories **and** Home. This is the deferred "Declarative multi-section Category page system" (`tbd.md` → Future changes; `CONTEXT.md` → "Deferred: declarative section system") finally picked up now that its consumer (this design) exists.

---

## Locked decisions

1. **Anatomy (validated with mockup).** Each themed section = a full-width **feature** card that *opens* the section, then a repeating rhythm of **MediaRow (image left/right, alternating)** + **grid of 4** cover cards. The page shells differ only by their existing hero, kept as-is:
   - **Category page (decision A):** `page-hero` banner (unchanged) → **N themed sections** → trailing **"Tout `<catégorie>`"** grid. *No* `HeroActivityCard` hero section — the banner is the hero.
   - **Home page:** `HeroSection` + `MapSection` (unchanged) → **N themed sections** (replacing the "Recommended for You" grid) → trailing grid → `FooterBanner`.
2. **Data sourcing = one partitioned pool.** A single ranked feed (`limit=48`) is fetched server-side, then partitioned **in the web layer** by **real attributes** of `FeedItemDTO`. No per-theme queries, no new API surface, no new endpoint. Chosen over editorial slicing (themes would be fake) and per-theme queries (N requests + cross-section dedup; too heavy for POC).
3. **Sections are declarative + shared.** One ordered `DEFAULT_FEED_SECTIONS` list, identical for all 6 categories **and** Home (the "generic enough for every category" requirement). **Not** per-category config — that would be the speculative DSL `CLAUDE.md` §2 forbids.
4. **Default sections (ordered):** `top` (top matchScore) · `featured` (`isFeatured`) · `outdoor` (`outdoor`) · `free` (`priceMinCents === 0`). Each **auto-hides** when it can't reach its minimum item count. Attributes are interchangeable (also available: `indoor`, `paid`).
5. **Greedy assignment, zero duplication.** Each pool item is used by at most one curated section (processed in list order). Unused pool items = **leftovers** → seed the trailing grid. The trailing grid continues the catalogue from the pool's `nextCursor` (page 2+), so curated items never repeat below.
6. **Reuse all four cards; one new CSS class only** (`.cover-feature` = full-width, taller cover). No new card component. `SectionedFeed` is a **server component** that injects `FavoriteButton` / `AddToCalendarButton` as slots — the exact pattern `design-showcase/page.tsx` already proves.
7. **Home keeps Hero + Map.** Only the "Recommended for You" grid becomes `SectionedFeed` + trailing grid. `HeroSection`, `MapSection`, `FooterBanner` unchanged.
8. **`design-showcase` stays** (dev-only reference); `tbd.md` is updated to reflect that the section system now exists (its eventual retirement stays deferred).

---

## Architecture (layer DAG preserved)

| New file | Layer | Responsibility |
|---|---|---|
| `src/shared/presets/FEED_SECTIONS.ts` | `shared/presets` | `FeedSectionSpec` type + `DEFAULT_FEED_SECTIONS` data. **Pure config, no imports of contracts/domain** — `source` is a string union, predicates live in the partitioner. |
| `src/modules/feed/web/buildFeedSections.ts` | `feed/web` | Pure function: `(items, specs, opts) → { sections, leftovers }`. Unit-tested in isolation. |
| `src/modules/feed/web/SectionedFeed.tsx` | `feed/web` | Server component. Renders the validated rhythm; embeds cards + Favorite/Calendar slots. |

Edges used: `feed/web → shared/contracts` (reads `FeedItemDTO`), `feed/web → shared/presets`, `feed/web → activities/web` (cards), `feed/web → favorites/web` + `feed/web → calendar/web` (slots — already done by `FeedGrid`). No new forbidden edges. `shared/presets` gains no upward edge (stays data-only).

---

## 1. Section spec (config)

`src/shared/presets/FEED_SECTIONS.ts`

```ts
export type FeedSectionSource =
  | 'top'       // highest matchScore (the algorithm's cream); predicate = always true
  | 'featured'  // isFeatured
  | 'free'      // priceMinCents === 0
  | 'paid'      // priceMinCents > 0
  | 'indoor'    // indoor === true
  | 'outdoor';  // outdoor === true

export type FeedSectionSpec = {
  key: string;        // stable React key + section id
  title: string;      // section heading (user-facing, FR copy)
  subtitle?: string;  // section sub-line
  source: FeedSectionSource;
};

export const DEFAULT_FEED_SECTIONS: FeedSectionSpec[] = [
  { key: 'top',      title: 'Sélectionné par notre algorithme pour vous', subtitle: 'Nos meilleurs choix selon tes affinités.', source: 'top' },
  { key: 'featured', title: 'À ne pas manquer',        subtitle: 'Les incontournables du moment.', source: 'featured' },
  { key: 'outdoor',  title: 'Au grand air',            subtitle: 'Quand la ville se vit dehors.',  source: 'outdoor' },
  { key: 'free',     title: 'Sans dépenser un sou',    subtitle: 'Gratuit, et ça vaut le détour.', source: 'free' },
];
```

No logic here (config only) — reordering/renaming/dropping a theme = editing this array, satisfying "pages are config."

---

## 2. Partitioner (pure, tested first)

`src/modules/feed/web/buildFeedSections.ts`

```ts
import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSpec, FeedSectionSource } from '../../../shared/presets/FEED_SECTIONS';

export type RenderedSection = { spec: FeedSectionSpec; items: FeedItemDTO[] };
export type SectionedResult = { sections: RenderedSection[]; leftovers: FeedItemDTO[] };

export const MIN_SECTION_ITEMS = 5;   // feature(1) + 1 MediaRow + ≥3 grid
export const MAX_SECTION_ITEMS = 11;  // feature(1) + 2 stanzas of [MediaRow + 4 grid]

const PREDICATES: Record<FeedSectionSource, (a: FeedItemDTO) => boolean> = {
  top: () => true,
  featured: (a) => a.isFeatured,
  free: (a) => a.priceMinCents === 0,
  paid: (a) => a.priceMinCents > 0,
  indoor: (a) => a.indoor,
  outdoor: (a) => a.outdoor,
};

export function buildFeedSections(
  items: FeedItemDTO[],
  specs: FeedSectionSpec[],
): SectionedResult { /* greedy, see rules below */ }
```

**Rules:**
- Iterate `specs` in order. For each, take items matching `PREDICATES[source]` **that are not yet used**, preserving incoming order (already matchScore-sorted), up to `MAX_SECTION_ITEMS`.
- If the take has **≥ `MIN_SECTION_ITEMS`** → emit `{ spec, items }`, mark used. Else **skip** (auto-hide) and leave those items for later specs / leftovers.
- `leftovers` = every item never marked used, in original order.
- Pure & deterministic; no `Date`, no fetch, no React.

---

## 3. Renderer

`src/modules/feed/web/SectionedFeed.tsx` (server component)

Props:
```ts
type SectionedFeedProps = {
  sections: RenderedSection[];
};
```

Per section → `<section className="content-section">` with `.section-head` (title + subtitle), then:
- `items[0]` → **feature**: `<CoverActivityCard size="lg" showPrice ... />` wrapped in `.cover-feature` (full-width, taller), with Favorite + Calendar slots.
- `items.slice(1)` → **stanzas**. Each stanza consumes 1 + 4 items:
  - 1 → `<MediaRowActivityCard side={stanzaIdx % 2 === 0 ? 'left' : 'right'} ... />` (+ slots).
  - next ≤4 → `.cover-grid` row of `<CoverActivityCard showPrice ... />` (+ slots).
  - A trailing partial stanza (e.g. MediaRow + 1–3 grid, or grid only) renders what remains.

Cards stay client (`'use client'`); the section scaffold is server-rendered (mirrors `design-showcase/page.tsx`).

---

## 4. Trailing "Tout" grid

After `SectionedFeed`, render the existing `FeedGrid` for the long tail:

```tsx
<section className="content-section">
  <div className="section-head"><div><h2>{title}</h2><p>Tout le reste, à explorer.</p></div></div>
  <FeedGrid initialItems={leftovers} initialCursor={pool.nextCursor} filterQueryString={...} />
</section>
```

- **Title is page-supplied** (the trailing grid is rendered by the page, not `SectionedFeed`): category → `Tout ${cfg.label}`, Home → `Plus d'activités`.
- `FeedGrid` already infinite-scrolls from `initialCursor`. Seeded with `leftovers` → no empty flash; continues at `nextCursor` (disjoint from the pool).
- **Auto-hide** the whole trailing section when `leftovers.length === 0 && pool.nextCursor === null` (small category fully shown above).

---

## 5. Wiring

- **Pool size.** `loadCategoryFeedDTO` and Home's `loadFeedDTO` must fetch the pool at `limit=48` (`MAX_FEED_LIMIT` is 50; `DEFAULT_FEED_LIMIT` is 12). Add a `POOL_LIMIT = 48` and pass it (param `limit=48` or an explicit arg). The returned `nextCursor` feeds §4.
- **Category page.** `CategoryFeedPage` (or `renderCategoryPage`) computes `buildFeedSections(initialFeed.items, DEFAULT_FEED_SECTIONS)` and renders: `page-hero` banner → `<SectionedFeed>` → trailing `<FeedGrid>`. Per **decision A**, the `page-hero` banner is the only hero — no `HeroActivityCard` hero section is added.
- **Home.** `RecommendationsSection`: keep `<section>` head + chips, **replace** its single `<FeedGrid>` with `<SectionedFeed>` (from the same `DEFAULT_FEED_SECTIONS`) + trailing `<FeedGrid>`. `HeroSection` + `MapSection` + `FooterBanner` untouched.
- **CSS.** Add `.cover-feature` to `globals.css` (full width, `min-height ~380px`, larger title). Reuse `.cover-grid`, `.media-row-card`, `.content-section`, `.section-head`. (One new rule only.)

---

## 6. Edge cases

- **Thin category** (no theme reaches min): `top` (always-true) still fills from the top; others auto-hide; trailing grid catches the rest.
- **Pool < 48:** `nextCursor === null` → trailing grid = leftovers only, no infinite scroll; head auto-hidden if also no leftovers.
- **Item matches two themes** (free *and* featured): greedy → assigned to the earlier section in the list.
- **Partial last stanza:** render MediaRow + whatever grid items remain (or grid-only / nothing).
- **Empty pool:** `SectionedFeed` renders nothing; trailing grid shows its `emptyMessage`.

---

## 7. Testing

- **`buildFeedSections` (vitest, written first):** greedy no-duplication; matchScore order preserved within a section; auto-hide below `MIN_SECTION_ITEMS`; cap at `MAX_SECTION_ITEMS`; correct leftovers; two-attribute precedence (earlier spec wins); empty input → `{ sections: [], leftovers: [] }`.
- **Verification gate:** `pnpm type-check && pnpm dep:check && pnpm test && pnpm lint`, then `pnpm build` before the finishing commit.

---

## 8. Deferrals (`tbd.md` updates on implementation)

- Update the **"Declarative multi-section Category page system"** bullet: the `sections[...]` config + single renderer now **exist** (`FEED_SECTIONS` + `SectionedFeed`); what stays deferred is **retiring `design-showcase`** and any **per-category** section overrides.
- New **Hardcoded** bullets: `POOL_LIMIT = 48`, `MIN_SECTION_ITEMS = 5`, `MAX_SECTION_ITEMS = 11` — tuning constants for the partitioner.

---

## Out of scope (YAGNI)

- Per-category custom section lists / a section DSL (`CLAUDE.md` §2).
- Real time-based themes ("this weekend") — weak for PLACE activities (no `dateStart`).
- Retiring/deleting `design-showcase`.
- New card components — the four existing variants cover every block.
