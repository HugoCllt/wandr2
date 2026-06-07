# SilverBlackMode re-skin — Home + category pages

_Design spec · 2026-06-06 (rev. 2026-06-07, post-grill) · branch `claude/app-design-theme-redesign`_

## 1. Goal

Re-skin the Wandr Home and every category page to the `wandr-silverblackmode`
design language (Claude Design handoff): a header-flush large-image carousel on
top, an airy editorial feed built from **one consolidated three-card system**, a
premium upsell band + modal, a restyled navbar, a multi-column footer, and a
**reworked map block** with an inline activity carousel.

The design is **art direction only**. All section content, ordering, and data
keep coming from the existing presets/DTOs (`CATEGORY_PRESETS`,
`DEFAULT_FEED_SECTIONS`, `ActivityDTO`/`FeedItemDTO`). Nothing is imported or
copied from the prototype bundle; it is reproduced. `.design-tmp/` is reference
only and is deleted at the end.

The Quiet-Luxury tokens (`--ink-*`, `--brushed`, `--panel`, `--paper`,
`--silver-*`, `--smoke*`, `--line*`, `--shadow-*`, `--offwhite`) already exist in
`src/app/globals.css`, and the composition seams (global `Nav`, `FeaturedHero`,
`MapSection`, `SectionedFeed`, the filter rail, the preset registry, the global
`ActivityProvider`/`ActivityModal`) already exist. This is a **consolidation +
reskin + one new interactive map block**, not new plumbing.

## 2. Non-goals / hard constraints

- **No prototype imports.** No source file may resolve a path into `.design-tmp/`.
- **Presets are the source of truth.** No invented sections, ordering, or
  activity copy.
- **Filter rail untouched.** Keep its 268px desktop column and proportions
  (`src/modules/filters/web/TopFilters.tsx`, `.filter-rail` in `globals.css`).
- **Layer DAG stays green** (`pnpm dep:check`). DTO-aware components live in a
  capability's `web/`; DTO-free chrome lives in `shared/ui`.
- Out of scope: section definitions, data fetching, routing, new categories,
  backend/domain/infra, chat/profile/login pages.

## 3. Decisions (locked — from the grill)

| # | Question | Decision |
|---|---|---|
| D1 | Premium band + modal + Footer placement | **Shared `(with-sidebar)/layout.tsx`** — renders once on Home, all 6 category pages, Favorites, Calendar. |
| D2 | Imageless card surface | **Paper (light) brushed** — single production variant, no toggle. |
| D3 | Language | **French + coherence pass** (see §4). |
| D4 | Feed-card actions | **Design-pure**: favorite (save) only on Tuile + Imageless; Feature = price + "Découvrir →"; the calendar action stays in the modal. |
| D5 | Section heads | **Eyebrow + title**, no "Voir tout" (sections have no dedicated page). Add an optional `eyebrow` to `FeedSectionSpec`. |
| D6 | Map block | **Full rework** — full-width map + inline activity carousel volet (see §9). Replaces the old map+4-card list. |
| D7 | Map open trigger / close | **Click a pin** opens the volet (map shrinks); **Escape / ✕ / click map background / click outside block** closes (map back to full width). |
| D8 | Map wheel/zoom | **Click activates** wheel zoom (map is "active" while the volet is open); closing returns the wheel to page scroll. |
| D9 | Nav overflow dropdown | **Charcoal `--panel` surface** so the existing light link text reads (fixes the current invisible-on-`--offwhite` bug). |
| D10 | `design-showcase` | **Delete** the route entirely (sole consumer of the two legacy cards; already slated to retire in `tbd.md`). |
| D11 | Activity modal | **Kept.** Feed cards and the map-volet card open it on click. |

## 4. Language — French + coherence (D3)

Today the app is bilingual: chrome is English (prices `Free`/`$45+`, dates via
`en-US`, MapSection headings) while feed section titles are French. The design is
fully French. New copy **and** the chrome I already touch go to French:

- `cards/helpers.ts` — `formatActivityPrice` → `Gratuit` / `45 $+` / `23–32 $`;
  `formatActivityWhen` → `Ouvert tous les jours` / `À venir` / `fr-CA` locale;
  `formatActivityWhere` default stays `Montréal`.
- `MapSection` headings + the volet copy → French.
- New copy (Feature "À la une"/"Découvrir", section eyebrows, Premium, Footer) →
  French.
- **Blast radius note:** `cards/helpers.ts` is shared by Favorites/Calendar
  cards, which will therefore also read French. Acceptable (whole app → French).
- The `ActivityModal` internal strings (`About this activity`, `Book this`, …)
  are translated in the same pass for coherence.

## 5. The consolidated card system (exactly three)

Routing signal is the activity image: an item with `imageUrl` renders a **Tuile**;
without one it renders an **Imageless** card. The **Feature** is the per-section
anchor.

### 5.1 Tuile — standard rectangular (keep `CoverActivityCard`)
Full-bleed photo + bottom scrim; title + meta + price overlaid; favorite (save)
control top-right; optional trending badge. Restyle CSS to `.tuile`
(`aspect-ratio: 4 / 3.15`, gradient scrim, hover lift + image zoom). **No rating
dots** (no rating field on the DTO). **No calendar button** (D4). Stays the
workhorse for the `SectionedFeed` grid, `FeedGrid`, and the map volet.

### 5.2 Feature — full-width "À la une" (keep `MediaRowActivityCard`)
Editorial split (photo panel + text panel), alternating left/right by section
index (`flip = i % 2 === 1`). Eyebrow "À la une", large light (300-weight) title,
description, meta, foot = price + "Découvrir →" (no inline save/calendar, D4).
Becomes the section anchor, replacing today's `CoverActivityCard size="lg"`
anchor. Handles a no-image first item via a placeholder media (brushed icon mark).

### 5.3 Imageless — no-photo rectangular (new `ImagelessActivityCard`)
Paper brushed-gradient card, same footprint as a Tuile (`aspect-ratio: 4 /
3.15`): category eyebrow (top-left) + brushed icon mark (top-right), large title,
meta, footed price + favorite (save). Category **label** from `CATEGORY_OPTIONS`
keyed by `activity.categories.primary`; category **icon** from a small
`ActivityCategory → IconName` map (`SPORT→ball, ROMANTIC→heart, FOOD→fork,
CULTURE→culture, OUTDOOR→leaf, NIGHTLIFE→moon`). Lives in
`src/modules/activities/web/cards/` (consumes `ActivityDTO`). Replaces today's
placeholder-SVG-in-a-cover-card path.

### 5.4 Deleted variants
`HeroActivityCard.tsx` + `ClassActivityCard.tsx` (used only by the deleted
`design-showcase`).

## 6. Feed composition (`SectionedFeed` + `FeedGrid`)

Per section, in order:
1. `section-head` — **eyebrow + title** (no "Voir tout", D5).
2. One **Feature** anchor, `flip = sectionIndex % 2 === 1`.
3. A grid (3 cols desktop, tokenized) of the remaining items, each routed
   `imageUrl ? <CoverActivityCard/Tuile> : <ImagelessActivityCard>`.

Trailing "Toutes les activités" `FeedGrid` keeps the same image-based routing.
The stanza pattern (MediaRow inside grid-of-4) is removed — MediaRow is the
section Feature only. `DEFAULT_FEED_SECTIONS` ordering and `buildFeedSections`
partitioning are unchanged; add an optional `eyebrow` field to `FeedSectionSpec`
and fill the three specs.

## 7. Carousel (`FeaturedHero`)

Already the header-flush large-image carousel with the centred elongated active
pill. No data/structure change; reconcile only drifting CSS values against the
prototype hero. Slide source unchanged (`listFeaturedActivities` on Home;
category pool top-3-with-images on category pages).

## 8. Premium band + modal & Footer

### 8.1 `shared/ui/Premium.tsx` (new, DTO-free, client)
- **Band**: brushed-charcoal panel (`--panel` + metallic gradient), "Wandr
  Premium" badge, title, sub, three feature bullets, "Découvrir Premium →" CTA +
  "À partir de 9,99 $/mois", and the static AI-companion preview card (mini chat,
  a suggested pick, a daily-tracking row).
- **Modal**: recap of the three premium features, sticky footer with price +
  "Passer à Premium" / "Plus tard". Opened by the band CTA via local `useState`
  (no `window.*`); closes on Escape, overlay click, or ✕; locks body scroll.

### 8.2 `shared/ui/SiteFooter.tsx` (new, DTO-free)
Multi-column (brand blurb + **Explorer** / **À propos** / **Suivez-nous**) + bottom
bar (© + Confidentialité / Conditions). Internal links use `next/link`
(`/`, `/sport`, `/calendar`, `/chat`); social links inert. Needs **3 new social
glyphs** added to `shared/ui/icons/Icon.tsx` (`instagram`, `facebook`, `x`).

### 8.3 Placement (D1)
`(with-sidebar)/layout.tsx`: `SmoothScroll` > `TopFilters` > `.shell/.main`
{children} > **`<Premium/>`** > **`<SiteFooter/>`** > `OnboardingGate`. Drop the
home-only `<FooterBanner/>`; delete `FooterBanner.tsx` + its sole dependency
`decor/FooterSkyline.tsx`.

## 9. Map block rework (`MapSection`) — D6/D7/D8

Replaces the current map+4-card list. `MapSection` is already `'use client'`;
rework it into a stateful explorer. State machine:

- **Repos**: map at **full content width** (full-bleed-card sized), pins for
  nearby activities (cap 24). Wheel → page scroll (`scrollZoom={false}`, no
  lenis-prevent). Zoom via the on-map +/− control + pinch.
- **Open** (click a **pin**): map animates to a reduced width (transition douce);
  an **activity volet** slides in on the right at standard card size (reuses
  `CoverActivityCard`/Tuile — no new card). The clicked pin **highlights**
  (distinct color). The map becomes **active**: `scrollZoom={true}` +
  `data-lenis-prevent-wheel` on, so the wheel now zooms the map; the map
  recenters (`flyTo`) on the activity.
- **Volet = carousel** (← →): cycles the pinned activities; each change updates
  the highlighted pin + recenters the map. Clicking another pin jumps the volet
  to it. Clicking the volet card opens the `ActivityModal`.
- **Close** (Escape / ✕ on the volet / click the map background / click outside
  the block): volet closes, map returns to full width, deactivates
  (`scrollZoom={false}`, wheel → page scroll).
- **Responsive**: below ~900px the volet stacks **under** the map (full width)
  instead of side-by-side; the map does not shrink horizontally.

### 9.1 `MapView` extensions required
- `scrollZoom?: boolean` prop forwarded to react-map-gl `<Map scrollZoom>`.
- Active-marker highlight: add an `activeId?: string` (or per-marker `active`)
  → distinct `.map-pin` color/scale.
- Recenter: forward a map `ref` (or controlled center) so the parent can
  `flyTo` the active activity on carousel/pin change.

## 10. Navbar (`Nav.tsx`) — D9

Keep the structure (primary vs overflow already derive from `CATEGORY_PRESETS`;
burger "More" dropdown already exists). Changes: render primary categories
inline + the rest behind the burger; **fix the dropdown color** — swap the
overflow panel background from `--offwhite` (light, which hides the light link
text) to the charcoal `--panel` surface matching the bar. Restyle spacing/brand
to the prototype using existing tokens. No registry/routing change.

## 11. Files

**Added**
- `src/modules/activities/web/cards/ImagelessActivityCard.tsx`
- `src/shared/ui/Premium.tsx`
- `src/shared/ui/SiteFooter.tsx`
- CSS blocks in `src/app/globals.css` (`.tuile`, `.feature`, `.nophoto`,
  premium band/modal, footer, map-explorer volet + transitions).

**Changed**
- `src/app/globals.css`
- `src/shared/ui/Nav.tsx`
- `src/shared/ui/icons/Icon.tsx` (3 social glyphs)
- `src/app/(with-sidebar)/layout.tsx`
- `src/app/(with-sidebar)/page.tsx` (drop `FooterBanner`)
- `src/modules/feed/web/SectionedFeed.tsx`
- `src/modules/feed/web/FeedGrid.tsx`
- `src/modules/activities/web/cards/CoverActivityCard.tsx`
- `src/modules/activities/web/cards/MediaRowActivityCard.tsx`
- `src/modules/activities/web/cards/helpers.ts` (French price/date)
- `src/modules/activities/web/MapSection.tsx` (full rework)
- `src/modules/activities/web/Map/MapView.tsx` (scrollZoom / highlight / recenter)
- `src/modules/activities/web/ActivityModal/ActivityModal.tsx` (FR strings)
- `src/shared/presets/FEED_SECTIONS.ts` (optional `eyebrow`)
- `tbd.md`

**Deleted**
- `src/modules/activities/web/cards/HeroActivityCard.tsx`
- `src/modules/activities/web/cards/ClassActivityCard.tsx`
- `src/shared/ui/FooterBanner.tsx`
- `src/shared/ui/decor/FooterSkyline.tsx`
- `src/app/(with-sidebar)/design-showcase/` (whole route)

## 12. Layer-DAG check

- `ImagelessActivityCard` reads `ActivityDTO` → `activities/web`. ✓
- `Premium`, `SiteFooter` are DTO-free → `shared/ui` (must not import any
  `shared/contracts` DTO). ✓
- `(with-sidebar)/layout.tsx` (app) imports `shared/ui` + capability `web/`. ✓
- Map volet reuses `CoverActivityCard` within `activities/web`. ✓
- No `src/modules → src/app`, no `shared/* → web|app`, no cycles.

## 13. Verification (all must pass before "done")

```
pnpm type-check
pnpm dep:check
pnpm test
pnpm lint
pnpm build
```

## 14. Incremental order

1. Language pass: `cards/helpers.ts`, `MapSection` headings, `ActivityModal`
   strings → FR.
2. `ImagelessActivityCard` + CSS; route it into `SectionedFeed`/`FeedGrid`.
3. Restyle `CoverActivityCard` (Tuile) + `MediaRowActivityCard` (Feature) CSS;
   rework `SectionedFeed` composition + section eyebrows; D4 actions.
4. Delete legacy cards + `design-showcase`.
5. `Premium` + `SiteFooter` (+ social glyphs); mount in `(with-sidebar)` layout;
   drop + delete `FooterBanner` (+ `FooterSkyline`).
6. Nav reskin + dropdown-color fix (D9).
7. Map block rework (D6/D7/D8): `MapView` extensions, then stateful `MapSection`
   (full-width → pin-click → shrink + carousel volet + highlight + recenter +
   wheel-activate; Escape/✕/background/outside close; <900px stack).
8. Hero CSS reconcile; full verification gate; update `tbd.md`; delete
   `.design-tmp/`.
