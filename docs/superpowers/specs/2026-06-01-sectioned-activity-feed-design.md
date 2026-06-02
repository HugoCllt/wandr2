# Sectioned activity feed — richer Category & Home pages — Design

**Date:** 2026-06-01 · **Updated:** 2026-06-02 (grill — decisions folded into "Locked decisions")
**Stage:** personal POC (single locale, single user, single deployment)
**Scope:** Replace the single uniform `FeedGrid` on Category pages — and the Home "Recommended for You" grid — with a richer, **data-adaptive** multi-section layout that **reuses the existing card variants** (`HeroActivityCard`, `ClassActivityCard`, `MediaRowActivityCard`, `CoverActivityCard`) and surfaces the existing `MapSection` on every page. One shared, declarative section list drives all 6 categories **and** Home. This is the deferred "Declarative multi-section Category page system" (`tbd.md`; `CONTEXT.md` → "Deferred: declarative section system"), picked up now that its consumer exists.

---

## Locked decisions (post-grill)

1. **Per-page anatomy.** The themed-section rhythm is shared; the shells differ only by their existing hero:
   - **Category page:** `page-hero` banner (unchanged) → **Map** → **themed sections** → trailing **"Toutes les activités"** grid.
   - **Home page:** `HeroSection` (featured) + **Map** → **themed sections** (replacing the "Recommended for You" grid) → trailing grid → `FooterBanner`.
   - **Section rhythm:** a full-width **feature** card *opens* the section, then a repeating rhythm of **MediaRow (image L/R, alternating)** + **grid of 4** cover cards.
2. **One partitioned pool.** A single ranked feed (`limit=48`) fetched server-side, partitioned **in the web layer** by **real attributes** of `FeedItemDTO`. No per-theme queries, no new API.
3. **Three shared sections, ordered:** `Pour toi` (affinity) · `En plein air` (`outdoor`) · `Gratuit` (`priceMinCents === 0`). **No "featured" section** — featured is the **universal layer** that lives in the hero (Home) / banner (Category). Confirmed by ranking: `isFeatured` already sorts to the top of the pool (`ranking/p1.ts:24`), so a featured section would duplicate the hero.
4. **Partition = themed-claim-first, "Pour toi" = ranked remainder, rendered first.**
   - **Pass 1 (themed):** `outdoor`, then `free`, each claims its matching, not-yet-used items in pool order, capped at `MAX`. A themed section is **kept only if it reaches `MIN`** (= 6: feature + one full stanza); otherwise it is skipped and its items return to the pool (**auto-hide**, never a hollow section).
   - **Pass 2 (`Pour toi`):** claims the best (highest `matchScore`) of everything still unused, capped at `MAX`. It is the **catch-all** (kept if ≥1 item) but **rendered first**.
   - **Leftovers** (beyond caps / low-affinity non-themed) → trailing grid.
   - **Exhaustive:** every pool item ends up in a section **or** in the trailing grid — nothing is dropped.
5. **Data-adaptive (decision B).** With ~32 seeded activities (~10 per category), a category rarely fills 3 themed sections. Consequence by design: **Home (≈32) → several sections; most Categories (≈10) → one rich `Pour toi` section** that lays the whole category into the feature→MediaRow→grid rhythm. The split **emerges automatically** as ingestion grows a category past the thresholds. Same renderer throughout.
6. **Honest copy, no subtitles.** Titles describe the real filter: **`Pour toi` · `En plein air` · `Gratuit`**, trailing grid **`Toutes les activités`**. Subtitles dropped (that's where the editorial puffery lived). Existing copy elsewhere is **left untouched** (surgical). `Pour toi` is **uniform on every page** (decision **a**) and means "best-match first"; items the user is lukewarm on **sink to the bottom or overflow into `Toutes les activités`** — they are never falsely promoted.
7. **Map on every page.** Reuse `MapSection` as-is (map + 4 cover cards + Montréal center), placed under the banner (Category) / where it already is (Home). **Markers come from the page pool** (already loaded), capped at **~24** items with valid coords. **Hide the whole `MapSection` when 0 items are geolocated** (no empty map). The now-redundant Home `listFeaturedActivities(8)` "nearby" query is **dropped**.
8. **Home cleanup + dedup.** Remove the **disabled chips** (`All/Popular/This Weekend/Near You`) and the **`Sort`** button and the redundant "Recommended for You" header (dead/duplicative UI). Render `SectionedFeed` + trailing grid directly. Keep `HeroSection` (`listFeaturedActivities(6)`) + `Map`. **Exclude the Hero's displayed activity ids from the section partition** (by id) so `Pour toi`/sections never repeat the hero; the Map may still show them (spatial overview, no map dedup). Category pages have no featured hero → nothing to exclude.
9. **Reuse the four cards; one new CSS class** (`.cover-feature` = full-width, taller cover). No new card component. `SectionedFeed` is a **server component** injecting `FavoriteButton`/`AddToCalendarButton` slots (the pattern `design-showcase/page.tsx` already proves).
10. **Always authenticated.** `getCurrentUser()` throws on no session (`current-user.ts:29`) — no anonymous path. Affinities are **seed-only** today (`tbd.md`), so `Pour toi` is honest for the seeded user; for a user without affinities it degrades to featured+recent ordering. Accepted for POC.
11. **Trailing grid kept, auto-hiding.** `FeedGrid` seeded with `leftovers`, continuing from the pool's `nextCursor`. With the current catalog (< 48) it is usually empty → **auto-hidden**; retained for the day ingestion pushes a feed past 48.

---

## Architecture (layer DAG preserved)

| New file | Layer | Responsibility |
|---|---|---|
| `src/shared/presets/FEED_SECTIONS.ts` | `shared/presets` | `FeedSectionSpec` type + `DEFAULT_FEED_SECTIONS` data. Pure config (no contracts/domain imports — `source` is a string union; predicates live in the partitioner). |
| `src/modules/feed/web/buildFeedSections.ts` | `feed/web` | Pure function `(items, specs, opts?) → { sections, leftovers }`. Unit-tested first. |
| `src/modules/feed/web/SectionedFeed.tsx` | `feed/web` | Server component. Renders the rhythm; embeds cards + Favorite/Calendar slots. |

Edges used (all allowed): `feed/web → shared/contracts` (`FeedItemDTO`), `feed/web → shared/presets`, `feed/web → activities/web` (cards + `MapSection`), `feed/web → favorites/web` + `feed/web → calendar/web` (slots — already done by `FeedGrid`). `shared/presets` stays data-only (no upward edge).

---

## 1. Section spec (config)

`src/shared/presets/FEED_SECTIONS.ts`

```ts
export type FeedSectionSource = 'top' | 'outdoor' | 'free';

export type FeedSectionSpec = {
  key: string;   // stable React key + section id
  title: string; // user-facing FR title (honest, no subtitle)
  source: FeedSectionSource;
};

export const DEFAULT_FEED_SECTIONS: FeedSectionSpec[] = [
  { key: 'top',     title: 'Pour toi',      source: 'top' },     // affinity catch-all, rendered first
  { key: 'outdoor', title: 'En plein air',  source: 'outdoor' },
  { key: 'free',    title: 'Gratuit',       source: 'free' },
];
```

Enum reduced to what is used (no speculative `featured`/`indoor`/`paid`). Reorder/rename/drop a theme = edit this array.

---

## 2. Partitioner (pure, tested first)

`src/modules/feed/web/buildFeedSections.ts`

```ts
import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import type { FeedSectionSpec, FeedSectionSource } from '../../../shared/presets/FEED_SECTIONS';

export type RenderedSection = { spec: FeedSectionSpec; items: FeedItemDTO[] };
export type SectionedResult = { sections: RenderedSection[]; leftovers: FeedItemDTO[] };

export const MIN_SECTION_ITEMS = 6;   // feature(1) + 1 full stanza (MediaRow + 4)
export const MAX_SECTION_ITEMS = 11;  // feature(1) + 2 stanzas

const PREDICATES: Record<Exclude<FeedSectionSource, 'top'>, (a: FeedItemDTO) => boolean> = {
  outdoor: (a) => a.outdoor,
  free: (a) => a.priceMinCents === 0,
};

export function buildFeedSections(
  items: FeedItemDTO[],
  specs: FeedSectionSpec[],
  opts?: { excludeIds?: ReadonlySet<string> },
): SectionedResult { /* see rules */ }
```

**Rules:**
- Drop any item whose id ∈ `opts.excludeIds` up front (Home Hero dedup) — it appears in **no** section and **no** leftovers.
- **Themed pass** (`specs` where `source !== 'top'`, in array order): take matching, unused items (pool order) up to `MAX_SECTION_ITEMS`. Keep the section **iff** count ≥ `MIN_SECTION_ITEMS`; else leave the items unused.
- **`top` pass:** take the best (incoming order = `matchScore` desc) of remaining unused items up to `MAX_SECTION_ITEMS`. Keep iff ≥ 1.
- **Render order = `specs` order** (so `top`/"Pour toi" renders first though it was assigned last).
- `leftovers` = items never claimed (and not excluded), original order.
- Pure & deterministic; no `Date`, no fetch, no React.

---

## 3. Renderer

`src/modules/feed/web/SectionedFeed.tsx` (server component)

```ts
type SectionedFeedProps = { sections: RenderedSection[] };
```

Per section → `<section className="content-section">` + `.section-head` (title only), then:
- `items[0]` → **feature**: `<CoverActivityCard size="lg" showPrice />` in a `.cover-feature` wrapper (full-width, taller), with Favorite + Calendar slots.
- `items.slice(1)` → **stanzas** of 1 + 4: `<MediaRowActivityCard side={stanzaIdx % 2 === 0 ? 'left' : 'right'} />` then a `.cover-grid` row of ≤4 `<CoverActivityCard showPrice />`. A trailing partial stanza renders whatever remains. All cards carry Favorite + Calendar slots.

A thin category collapses to **one** section (`Pour toi`) that still uses the full rhythm over its ~10 items.

---

## 4. Trailing "Toutes les activités" grid

Rendered by the **page** (not `SectionedFeed`):

```tsx
<section className="content-section">
  <div className="section-head"><div><h2>Toutes les activités</h2></div></div>
  <FeedGrid initialItems={leftovers} initialCursor={pool.nextCursor} filterQueryString={...} />
</section>
```

- Seeded with `leftovers` (no empty flash), continues at `nextCursor` (disjoint from the pool).
- **Auto-hide** the whole section when `leftovers.length === 0 && pool.nextCursor === null`.

---

## 5. Map on every page

- Reuse `MapSection` unchanged (component, copy, Montréal center).
- Feed it `pool.items` (the same pool), capped at **~24** items with finite `latitude`/`longitude`. (`MapSection` already filters non-finite coords and renders its 4-card list from the head.)
- **Hide `MapSection`** when no pool item is geolocated.
- **Home:** drop `listFeaturedActivities(8)`; pass the pool to `MapSection`. **Category:** `MapSection` is newly added under the banner, fed by the category pool.

---

## 6. Wiring

- **Pool size.** `loadCategoryFeedDTO` and Home's `loadFeedDTO` fetch at `limit = POOL_LIMIT (48)` (`MAX_FEED_LIMIT` is 50; default is 12). Returned `nextCursor` feeds §4.
- **Category page** (`renderCategoryPage` / `CategoryFeedPage`): `buildFeedSections(pool.items, DEFAULT_FEED_SECTIONS)` → render `page-hero` → `<MapSection items={pool}>` → `<SectionedFeed sections>` → trailing `<FeedGrid>`. No hero exclusion.
- **Home** (`HomePage` + `RecommendationsSection`): `featured = listFeaturedActivities(6)` for `HeroSection`; `pool = loadFeedDTO(@48)`; `buildFeedSections(pool.items, DEFAULT_FEED_SECTIONS, { excludeIds: new Set(featured.map(a => a.id)) })`. Render `HeroSection` → `MapSection(pool)` → `SectionedFeed` → trailing `FeedGrid`. Remove chips/Sort/redundant header; drop the `nearby` query.
- **CSS.** Add `.cover-feature` to `globals.css` (full width, `min-height ≈ 380px`, larger title, responsive). Reuse `.cover-grid`, `.media-row-card`, `.content-section`, `.section-head`.

---

## 7. Edge cases

- **Item matching no theme** (e.g. tennis = indoor + paid + low affinity): excluded from `outdoor`/`free`; eligible for `Pour toi` (ranked, so it sinks). **Small category** → shown in `Pour toi` near the bottom. **Home** → outranked past the `MAX` cut → lands in `Toutes les activités`. Never dropped (exhaustiveness).
- **Item matching two themes** (outdoor + free): greedy → goes to the earlier themed pass (`outdoor`).
- **Thin category** (themes below `MIN`): only `Pour toi` + (usually hidden) grid.
- **Pool < 48:** `nextCursor === null` → trailing grid = leftovers only; hidden if also empty.
- **No geolocated items:** `MapSection` hidden.
- **Empty pool:** no sections; trailing grid shows its `emptyMessage` (or hidden).

---

## 8. Testing

- **`buildFeedSections` (vitest, first):** themed-pass priority; `MIN` auto-hide (themed below 6 returns items); `MAX` cap; `Pour toi` = ranked remainder, rendered first; `excludeIds` removed from sections **and** leftovers; **exhaustiveness** (Σ section items + leftovers + excluded = input); two-attribute precedence (`outdoor` before `free`); empty input → `{ sections: [], leftovers: [] }`.
- **Gate:** `pnpm type-check && pnpm dep:check && pnpm test && pnpm lint`, then `pnpm build` before the finishing commit.

---

## 9. Deferrals (`tbd.md` updates on implementation)

- Update the **"Declarative multi-section Category page system"** bullet: the `sections[...]` config (`FEED_SECTIONS`) + single renderer (`SectionedFeed`) now **exist**; what stays deferred is **retiring `design-showcase`** and any **per-category** section overrides.
- New **Hardcoded** bullets: `POOL_LIMIT = 48`, `MIN_SECTION_ITEMS = 6`, `MAX_SECTION_ITEMS = 11`, map marker cap `≈ 24`.

---

## Out of scope (YAGNI)

- Per-category custom section lists / a section DSL (`CLAUDE.md` §2).
- The Favorites page (a saved-items list, different intent).
- Real time-based themes ("this weekend") — weak for PLACE activities.
- Retiring/deleting `design-showcase`.
- New card components.
