# Plan — Generic Card Primitive + Full-Width Variants

## 1. Context (read-only audit)

### Existing card components in `src/shared/ui/cards/`

| File | CSS class | Layout | Used by |
|---|---|---|---|
| `RecActivityCard.tsx` | `.rec-card` | Overlay grid tile, text on full-bleed image, aspect 0.74:1 | `FeedGrid` (standard) → Recommendations, Sport, Category, Favorites |
| `FromMapActivityCard.tsx` | `.fm-card` | Image-top tile, text below | `MapSection` sidebar list, `FeedGrid` (compact) |
| `HeroActivityCard.tsx` | `.hero-card` | Large composite, image full-bleed, content overlay with eyebrow + CTA | `HeroSection` main slide |
| `SideActivityCard.tsx` | `.side-card` | Small horizontal dark card (130 px image left + body) | `HeroSection` side stack |

Shared behaviour lives in `src/shared/ui/cards/helpers.ts` (`useOpenActivity`, `formatActivity{Price,When,Where}`).

### Patterns observed in `wandr_design/` not yet ported

- `live-card` (`sport.jsx`) — large overlay row tile with live pill (variant of `rec-card`).
- `play-card` (`sport.jsx`) — image-top tile with deal pill (variant of `fm-card`).
- `class-card` (`sport.jsx`, `styles.css:947`) — **`display: grid; grid-template-columns: 110px 1fr`** — horizontal media-left card. This is the closest existing reference for the user's new "full-width media-left" requirement and the layout we extend.

### Architectural constraints

- `shared/ui` is presentational only — no fetch, no business rules, no upward edges. Consumes `ActivityDTO` (per `CLAUDE.md` §5–6).
- Don't import from `wandr_design/` — design reference only.
- Plain CSS classes in `src/app/globals.css`; current cards follow BEM-ish naming (`.rec-img`, `.rec-content`).
- Single source of truth for callers: one `<ActivityCard variant=… />` facade rather than four independent component imports.

## 2. Variants to expose

Final variant set behind the facade:

| `variant` value | Layout | Behaviour |
|---|---|---|
| `overlay-tile` | Current `RecActivityCard` | grid tile, badge slot, favorite + calendar actions |
| `image-top` | Current `FromMapActivityCard` | small tile with flame row, optional distance label |
| `hero` | Current `HeroActivityCard` | full-bleed composite with eyebrow + CTA |
| `side` | Current `SideActivityCard` | dark horizontal stub |
| **`media-left`** *(new)* | Full row width, image left (~ 38%), content right | clickable card, badge slot, footer actions slot |
| **`media-right`** *(new)* | Mirror of `media-left`, image right, content left | same |

Defer (not in scope of this task): `live-card`, `play-card` ports — call out as follow-ups in todo.

## 3. Props API sketch

```ts
// src/shared/ui/cards/types.ts
export type CardVariant =
  | 'overlay-tile'
  | 'image-top'
  | 'hero'
  | 'side'
  | 'media-left'
  | 'media-right';

// src/shared/ui/cards/ActivityCard.tsx
type ActivityCardProps = {
  variant: CardVariant;
  activity: ActivityDTO;
  // shared optional slots; variants ignore irrelevant ones
  isFavorited?: boolean;          // overlay-tile, media-left/right
  badge?: { label: string; kind: 'trending'|'popular'|'hot'|'new' };
  eyebrow?: string;                // hero, media-left/right
  flames?: number;                 // image-top, side
  distanceLabel?: string;          // image-top
  showCalendarAction?: boolean;    // media-left/right (default true)
};
```

Internal switch dispatches to existing files or to the new `MediaRowActivityCard`. No prop reshuffling at the call sites that already use the specific components — we keep their imports working and add the facade as the new recommended entry. Removing the specific imports is a follow-up after the new variants are in.

## 4. Dependency graph (touched files)

```
ActivityDTO (contracts)
        │
        ▼
helpers.ts ──────────► useOpenActivity, formatters
        │
        ▼
MediaRowActivityCard.tsx ── new (covers media-left + media-right via `side: 'left' | 'right'`)
        │
        ▼
ActivityCard.tsx ── new facade
        ▲
        │
FeedGrid.tsx ── accepts new variants 'wide-left' | 'wide-right'
        ▲
        │
demo call site (e.g. favorites page) ── proves the wiring
```

CSS additions in `src/app/globals.css` — new `.wide-card*` classes following the existing class-card naming pattern.

## 5. Vertical slices (each ends in a verifiable state)

### Slice A — Facade with no behavioural change
Add `ActivityCard` facade + `CardVariant` type. Switch maps `overlay-tile / image-top / hero / side` to existing components verbatim. Export a barrel `src/shared/ui/cards/index.ts`. No call sites change yet.

**Verify:** `pnpm typecheck` clean; importing `ActivityCard` from new barrel works in a scratch file (deleted after).

### Slice B — `MediaRowActivityCard` component + CSS
Add `src/shared/ui/cards/MediaRowActivityCard.tsx` and corresponding `.wide-card`, `.wide-card-img`, `.wide-card-body`, `.wide-card-foot`, `.wide-card.reverse` rules in `globals.css`. Component takes `side: 'left' | 'right'` and renders image-left or image-right.

**Verify:** mount with mock `ActivityDTO` on a throwaway route (`src/app/_dev/cards/page.tsx`) and inspect in browser. Both left and right orientations show image, title, when/where, price, badge, favorite + calendar actions. Card stretches to 100 % of grid width.

### Slice C — Wire variants into facade
Wire `media-left` / `media-right` into the `ActivityCard` switch.

**Verify:** scratch render of `<ActivityCard variant="media-left" activity={…} />` produces same output as Slice B's direct render.

### Slice D — Extend `FeedGrid` to support full-width rows
Extend `FeedGridVariant` to `'standard' | 'compact' | 'wide-left' | 'wide-right'`. Add `wide-feed-list` CSS (single column, vertical stack with gap). Route variant to `<ActivityCard variant="media-left|media-right" />`.

**Verify:** in `FavoritesPage` (or a clearly-labeled experiment route) pass `variant="wide-left"`. Run `pnpm dev`, navigate, confirm: rows are full-width, image left, content right, favorite/calendar buttons work, infinite scroll still fires.

### Slice E — Cleanup + remove scratch route
Remove `_dev/cards` scratch route. Confirm `pnpm typecheck`, `pnpm lint`, `pnpm dep:check` all clean. Confirm `dependency-cruiser` shows no new forbidden edges.

**Verify:** all three scripts exit 0.

## 6. Checkpoints (human review points)

- **After Slice A:** confirm facade API shape before adding new variants.
- **After Slice B:** review visual rendering of media-left/right before wiring into `FeedGrid`. The user explicitly mentioned `wandr_design` patterns — this is the moment they should confirm the visual matches their intent.
- **After Slice E:** final smoke test — toggle `variant` between `standard`, `wide-left`, `wide-right` on Favorites page and confirm UX.

## 7. Out of scope (track as follow-ups)

- Porting `live-card` and `play-card` patterns from `wandr_design`.
- Migrating existing call sites from `RecActivityCard` / `FromMapActivityCard` etc. to the facade — facade is opt-in; current imports keep working.
- Storybook / visual regression tests.
- Responsive collapse rules for `media-left|right` on narrow viewports beyond what the existing class-card patterns already demonstrate.

## 8. Hard constraints honored

- No imports from `wandr_design/`.
- New files live under `src/shared/ui/cards/`; nothing reaches into `app/` or `application/`.
- Naming: PascalCase components, camelCase props (per `CLAUDE.md` §7).
- Surgical: existing component files untouched in slices A–C; modified only if the facade or FeedGrid demands it.
