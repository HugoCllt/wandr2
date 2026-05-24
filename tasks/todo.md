# Todo — Generic Card Primitive + Full-Width Variants

Each task is one vertical slice. Tick the acceptance criteria, then proceed.

---

## Slice A — `ActivityCard` facade (no behavioural change)

- [ ] Add `src/shared/ui/cards/types.ts` exporting `CardVariant = 'overlay-tile' | 'image-top' | 'hero' | 'side' | 'media-left' | 'media-right'`.
- [ ] Add `src/shared/ui/cards/ActivityCard.tsx` — switches on `variant`, dispatches to existing `RecActivityCard`, `FromMapActivityCard`, `HeroActivityCard`, `SideActivityCard` for the four already-implemented variants. `media-left|right` cases throw `not implemented` (filled in Slice C).
- [ ] Add `src/shared/ui/cards/index.ts` barrel — re-exports `ActivityCard`, `CardVariant`, and the existing variant components for backward compatibility.

**Acceptance criteria**
- `import { ActivityCard, type CardVariant } from '@/shared/ui/cards'` resolves.
- All four already-implemented variants render with the same DOM as before.
- `pnpm typecheck` exits 0.

**Verification**
1. `pnpm typecheck`
2. Temporarily import `ActivityCard` in `FavoritesPage`, render with `variant="overlay-tile"` for one item, confirm visual = current.
3. Revert the temp change.

**Checkpoint:** stop and confirm API shape with user before Slice B.

---

## Slice B — `MediaRowActivityCard` + CSS

- [ ] Add `src/shared/ui/cards/MediaRowActivityCard.tsx`. Props: `activity`, `side: 'left' | 'right'`, `isFavorited?`, `badge?`, `eyebrow?`, `showCalendarAction?` (default `true`).
- [ ] DOM: `<article class="wide-card {reverse?}"><div class="wide-card-img"/><div class="wide-card-body"><eyebrow><title><meta><foot/actions/></div></article>`.
- [ ] Click on the card body opens the activity modal via `useOpenActivity()`; clicks on `FavoriteButton` / `AddToCalendarButton` `stopPropagation`.
- [ ] Add CSS in `src/app/globals.css` (just after the `.class-card` block to keep horizontal-card styles together):
  - `.wide-card` — `display: grid; grid-template-columns: minmax(220px, 38%) 1fr;` `border-radius: 18px;` `overflow: hidden;` `background: #fff;` `border: 1px solid var(--line);` `cursor: pointer;` `text-align: left;` `transition: transform .2s, box-shadow .2s;`
  - `.wide-card:hover` — translateY + shadow-md.
  - `.wide-card.reverse` — `grid-template-columns: 1fr minmax(220px, 38%);` and swap child order.
  - `.wide-card-img` — `background: center/cover; min-height: 220px; position: relative;`
  - `.wide-card-body` — `padding: 22px 26px; display: flex; flex-direction: column; gap: 10px;`
  - `.wide-card-eyebrow`, `.wide-card-title`, `.wide-card-meta`, `.wide-card-foot` — mirror existing class-card / rec-card typography scale.
- [ ] Add throwaway dev route `src/app/_dev/cards/page.tsx` rendering one `media-left` and one `media-right` against a hardcoded `ActivityDTO` fixture.

**Acceptance criteria**
- `/[/_dev/cards]` shows two full-width rows: one image-left, one image-right.
- Both have correct title, when/where, price, favorite + calendar actions wired.
- Hover transition triggers translateY + shadow.

**Verification**
1. `pnpm dev`, navigate to `/_dev/cards`, screenshot both orientations.
2. Click card body → modal opens. Click favorite → no modal open (event stopped).
3. `pnpm typecheck`.

**Checkpoint:** show screenshots to user, confirm visual matches their intent before wiring into FeedGrid.

---

## Slice C — Wire `media-left|right` into facade

- [ ] In `ActivityCard.tsx`, replace the `media-left` / `media-right` `not implemented` branches with `<MediaRowActivityCard side="left|right" {...} />` calls.
- [ ] Move the dev route to render via `<ActivityCard variant="media-left" />` to prove the facade path is equivalent.

**Acceptance criteria**
- `<ActivityCard variant="media-left" activity={…} />` renders pixel-equivalent to `<MediaRowActivityCard side="left" activity={…} />`.
- `pnpm typecheck` clean.

**Verification**
1. Reload `/_dev/cards`, visual identical to Slice B.

---

## Slice D — Extend `FeedGrid` with full-width variants

- [ ] In `src/shared/ui/FeedGrid.tsx`, extend `FeedGridVariant` to `'standard' | 'compact' | 'wide-left' | 'wide-right'`.
- [ ] Add a `wide-feed-list` CSS class to `globals.css`: `display: flex; flex-direction: column; gap: 14px;`.
- [ ] In the `wide-left` / `wide-right` branches, render `<ActivityCard variant="media-left|media-right" activity={item} isFavorited={item.isFavorited} />`.
- [ ] Demo: pass `variant="wide-left"` from `FavoritesPage` so the user can flip the toggle to see it in production context. (Leave `variant` defaulted on the other call sites so they don't regress.)

**Acceptance criteria**
- Favorites page renders favorites as full-width rows, image left, content right, with infinite scroll still firing the sentinel.
- `Empty` state still shows correctly.
- Other pages using `FeedGrid` are visually unchanged.

**Verification**
1. `pnpm dev`, log in, favorite ≥ 5 activities, visit `/favorites`. Confirm full-width layout, scroll loads more.
2. Visit `/`, `/sport`, `/food` — confirm `rec-grid` layout unchanged.
3. `pnpm typecheck`.

---

## Slice E — Cleanup & invariants

- [ ] Delete `src/app/_dev/cards/page.tsx`.
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm dep:check` (or repo equivalents). Fix any output.
- [ ] Confirm no new `wandr_design/` imports introduced (`grep -r "wandr_design" src/`).

**Acceptance criteria**
- All three scripts exit 0.
- `grep` returns nothing.

**Verification**
1. Scripts run clean.
2. `git diff --stat` — confirm only expected files touched.

---

## Out of scope (capture for future)

- Port `live-card` (overlay row tile) and `play-card` (image-top with deal pill) patterns from `wandr_design/sport.jsx`.
- Migrate existing call sites (Recommendations, Sport, Category, MapSection) from direct `RecActivityCard` / `FromMapActivityCard` imports to the `ActivityCard` facade — facade is opt-in for now.
- Storybook stories or visual regression tests for the variant matrix.
- Narrow-viewport responsive rules (collapse `media-left|right` to stacked) beyond what `class-card` already covers.
