# Home page coherence rework — design

**Date:** 2026-06-22
**Stage:** Phase 1 POC. Single locale (Montréal), single user.

## Goal

Make the Home page sections coherent. Final order:

> Hero → Map → **Pour toi** → **Coup de cœur** → **D'autres ont aussi aimé** → Premium → Footer

(Premium + Footer come from `(with-sidebar)/layout.tsx`, after `<main>`.)

## Decisions

- **Feed simplification applies everywhere** (global `DEFAULT_FEED_SECTIONS`), not Home-only. Category pages get the same two-band layout.
- **Map zoom disengages** when clicking outside the map / pressing Escape; the activity panel stays open.

## Changes

### 1. Map (`MapSection`) — open by default, click-to-engage zoom

- Panel **open by default**: `activeIndex` starts at `0`; the stage stays in `.open` layout permanently with the first activity on the side.
- New `engaged` state (default `false`) drives `scrollZoom`, **decoupled** from the panel being open.
- Clicking **anywhere on the map** (background or a pin) → `engaged = true` (wheel zoom captured).
- Clicking outside the section (mousedown) or pressing Escape → `engaged = false` (page scroll restored); panel stays open.
- Remove the close (X) button (panel is permanent). Keep prev/next nav + counter.

### 2. Feed sections — global simplification + parallax masonry

- `DEFAULT_FEED_SECTIONS` → just `[{ key: 'top', title: 'Pour toi', source: 'top' }]`. Drop `outdoor` and `free` themed buckets; simplify `buildFeedSections` to: `top` takes the first **12** ranked items, everything else → leftovers.
- **Pour toi** renders as a `FeedGrid` parallax masonry, **static** (no load-more, no end message) — first 12 items.
- **D'autres ont aussi aimé** = leftovers, `FeedGrid` parallax masonry **with** load-more (the renamed former "Toutes les activités" tail; drop its "Tout explorer" eyebrow).
- `FeedGrid` gains a `paginate?: boolean` prop (default `true`); Pour toi passes `paginate={false}` to skip the IntersectionObserver sentinel and the "Vous avez tout vu." footer.
- The old `Section` layout (MediaRow feature anchor + `feed-grid`) is dropped from these pages. `MediaRowActivityCard` stays in the repo, unused here.

### 3. Coup de cœur spotlight — reposition + heading fix

- Move from above the map to **between** "Pour toi" and "D'autres ont aussi aimé".
- Inject via a new optional `interludeSlot` prop on `SectionedFeed` (rendered between the sections and the tail). Home passes the spotlight; category pages pass nothing.
- **Heading fix:** wrap the spotlight in `<section className="feed-section">` with `<div className="feed-head"><h2>Coup de cœur</h2></div>`; drop the in-card eyebrow so the label is a real `h2` like every other section.
- Exclude the spotlight activity id from the feed pool so it isn't shown twice.

## Files touched

- `src/shared/presets/FEED_SECTIONS.ts`
- `src/modules/feed/web/buildFeedSections.ts`
- `src/modules/feed/web/SectionedFeed.tsx`
- `src/modules/feed/web/FeedGrid.tsx`
- `src/modules/activities/web/MapSection.tsx`
- `src/modules/activities/web/cards/SpotlightActivityCard.tsx`
- `src/app/(with-sidebar)/page.tsx`
- `src/app/globals.css` (minor, if spotlight needs `feed-section` wrapper styling)

## Verification

`pnpm type-check && pnpm dep:check && pnpm test && pnpm lint`, then `pnpm build` before the finishing commit.
