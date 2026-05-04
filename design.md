# design.md — Wandr Design System

Tokens, primitives, and composition rules. This is what the engineer ships against. Brand voice and aesthetic intent are noted at the end as a one-page closing section, not the headline.

> Engineering rule: every visual decision must be expressed as a named token. "Soft shadow" is not a token; `shadow-2` is.

---

## 1. Foundation

### 1.1 Typography

- **Family:** Inter Variable (`font-family: "Inter Variable", system-ui, sans-serif`).
- **Self-hosted** via `next/font` to avoid CLS.
- **Scale:** modular 1.250 (major third), base 16px.

| Token | Size | Line height | Weight | Use |
|---|---|---|---|---|
| `display`   | 56px | 60px | 600 | Hero titles |
| `headline`  | 36px | 40px | 600 | Page titles |
| `title`     | 24px | 32px | 600 | Section titles, card titles (hero variant) |
| `subtitle`  | 18px | 26px | 500 | Standard card titles, panel headers |
| `body`      | 16px | 24px | 400 | Default body |
| `body-sm`   | 14px | 20px | 400 | Secondary text |
| `caption`   | 12px | 16px | 500 | Labels, metadata |
| `mono`      | 14px | 20px | 400 | Code, IDs |

Letter-spacing: `-0.01em` for `display` and `headline`; `0` everywhere else.

### 1.2 Spacing — 4-pt grid

```
space-1 = 4px    space-5 = 24px   space-9 = 64px
space-2 = 8px    space-6 = 32px   space-10 = 80px
space-3 = 12px   space-7 = 40px   space-11 = 96px
space-4 = 16px   space-8 = 48px   space-12 = 128px
```

Layout container max-width: `1280px`. Page gutter: `space-6` desktop, `space-4` mobile.

### 1.3 Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm`   | 6px  | Inputs, chips |
| `radius-md`   | 12px | Cards, sheets |
| `radius-lg`   | 20px | Hero cards, dialogs |
| `radius-full` | 9999px | Pills, avatars |

### 1.4 Shadow

| Token | CSS |
|---|---|
| `shadow-1` | `0 1px 2px rgba(0,0,0,0.06)` |
| `shadow-2` | `0 4px 12px rgba(0,0,0,0.08)` |
| `shadow-3` | `0 12px 32px rgba(0,0,0,0.12)` |
| `shadow-focus` | `0 0 0 3px rgba(255, 122, 51, 0.45)` |

Default card shadow `shadow-1`; hover lifts to `shadow-2`; dialogs/sheets use `shadow-3`.

### 1.5 Motion

| Token | Duration | Easing | Use |
|---|---|---|---|
| `dur-fast`  | 150ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Hover/state changes |
| `dur-base`  | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Card lifts, dropdowns |
| `dur-slow`  | 400ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Sheet/dialog enter |
| `dur-page`  | 600ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Page transitions |

`prefers-reduced-motion: reduce` collapses every duration to `1ms`.

### 1.6 Color tokens

Light theme. (Dark theme is post-POC.)

| Token | Hex | Use | Min contrast (vs companion) |
|---|---|---|---|
| `bg`              | `#FBF7F1` | Page background | — |
| `surface`         | `#FFFFFF` | Cards, sheets | 1.05 vs `bg` (decorative) |
| `surface-muted`   | `#F2EBE0` | Inputs, chips, sticky sidebar | — |
| `text`            | `#0E0F12` | Default text | 16.8 vs `bg` (AAA) |
| `text-muted`      | `#5A5C66` | Secondary text | 5.6 vs `bg` (AA) |
| `border`          | `#E5DED1` | Subtle borders | — |
| `accent`          | `#FF7A33` | Primary CTAs, selection, deal badges | 4.5 vs `surface` (AA, large only — pair with white text or use `text` over) |
| `accent-strong`   | `#E65A12` | Hover state of accent | 5.4 vs `surface` (AA) |
| `accent-soft`     | `#FFE7D6` | Subtle accent backgrounds | — |
| `success`         | `#1F7A4A` | Confirmations | 5.0 vs `surface` |
| `danger`          | `#B42323` | Errors, destructive | 6.1 vs `surface` |

Contrast values are computed (sRGB → relative luminance) and verified by a Vitest snapshot test in `shared/ui/tokens.test.ts`. Any token edit fails CI if a documented pair drops below its target.

### 1.7 Iconography

- Source: `lucide-react`, version-pinned.
- Sizes: `icon-sm = 16px`, `icon-md = 20px`, `icon-lg = 24px`, `icon-xl = 32px`.
- Stroke width: 1.75 for `sm`/`md`, 2 for `lg`/`xl`.

---

## 2. Component primitives (`shared/ui`)

Each primitive is a thin React component that takes a typed prop API and emits semantic HTML with the tokens above. No business logic, no data fetching. Storybook is optional but recommended.

| Component | Props (excerpt) | Used by |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost'`, `size: 'sm' \| 'md' \| 'lg'`, `loading`, `as?` | Everywhere |
| `IconButton` | same as `Button` minus `as`, plus `aria-label` required | Filters, card actions |
| `Input` | `prefixIcon?`, `suffixSlot?`, `state: 'default' \| 'invalid'` | Search, filter dialogs |
| `Select` | controlled, `options: { value; label }[]` | Sort, filters |
| `Toggle` | controlled boolean | Indoor/outdoor, free/paid |
| `Chip` | `selected`, `onToggle`, `count?` | Multi-select filters |
| `Card` | `as?`, `interactive?` | Foundation for `ActivityCard`, surface containers |
| `Sheet` | `side: 'right' \| 'bottom'`, `open`, `onOpenChange` | Filters drawer (mobile), detail edits |
| `Dialog` | `open`, `onOpenChange` | Mini map overlay, confirmations |
| `Skeleton` | `w`, `h`, `radius` | Loading states |
| `Carousel` | `items`, `interval?`, `pauseOnHover` | Hero, suggested prompts |
| `MapPin` | `state: 'idle' \| 'hover' \| 'selected'`, `count?` | `MapSection` |
| `FlameIcon` | `level: FlameLevel` | Cards (P2+) |
| `DealBadge` | `kind: DealKind`, `value?` | Cards |
| `Rating` | `value: 0..5`, `size` | Detail (P2+) |

---

## 3. Composed components (`shared/ui`, depend on primitives)

These are the four units every page is built from.

### 3.1 `ActivityCard`

Three variants selected by the preset:
- `hero` — full-bleed image, large title, two-line description.
- `standard` — square cover image, title, three-line meta row (date · price · distance).
- `compact` — horizontal row, thumbnail + dense meta. Used in lists and "Similar".

Common API:
```ts
type ActivityCardVM = {
  id: string
  slug: string
  title: string
  imageUrl: string
  imageAlt: string
  dateLabel: string         // formatted
  priceLabel: string        // "Free" | "$15" | "$15–$30"
  distanceLabel: string     // "1.2 km" | "Walking"
  flame?: FlameLevel        // P2+
  dealKind?: DealKind
  isFavorited: boolean
  href: string
}
```

Click target: whole card. Save and Location are nested buttons with `stopPropagation`.

### 3.2 `FilterBar`

Sticky on the left at ≥ 1024px; collapses to a `Sheet` below. Driven entirely by `preset.feed.visibleFilters` and the current filter state object. Any filter not in `visibleFilters` is not rendered — adding/removing a filter to a page is a one-line preset edit.

### 3.3 `FeedGrid`

Responsive: 3 cols ≥ 1280px, 2 cols 768–1279px, 1 col < 768px. Items are `<ActivityCard variant={preset.gridVariant} />`. Uses `IntersectionObserver` to fire `VIEWED` events. Pagination is cursor-based; loads the next page when the second-to-last row enters the viewport.

### 3.4 `MapSection`

`<MapSection activities={feed.items} selectedId={…} onSelect={…} />`. Mapbox under the hood through `IMapProvider` so we can swap providers without touching the component.

### 3.5 `<PageShell preset={…} />`

The composition root for every page. Reads the preset and renders, in order: `<Hero>` (if `preset.sections.hero`), `<FilterBar>`, `<MapSection>` (if `preset.sections.map`), `<FeedGrid>`. Accepts a `slot` prop for pages that need a non-feed section (Profile).

---

## 4. Layout

### 4.1 Top navigation

Sticky, `64px` tall, `surface` background, `border-bottom: 1px solid border`. Slots: logo (left), search (center, `max-width: 480px`), nav links (right: Home, Sport, Romantic, Food, Chat (P3), Profile).

### 4.2 Home structure (1280px)

```
┌──────────────────────────────────────────────────────────┐
│ Top Nav                                                  │
├──────┬───────────────────────────────────────────────────┤
│      │ Hero carousel (3-up at 1280px)                    │
│      ├───────────────────────────────────────────────────┤
│ F    │ Map section                                       │
│ i    │                                                   │
│ l    ├───────────────────────────────────────────────────┤
│ t    │ Feed grid (3 cols)                                │
│ e    │ ░░░  ░░░  ░░░                                     │
│ r    │ ░░░  ░░░  ░░░                                     │
│ s    │ …                                                 │
└──────┴───────────────────────────────────────────────────┘
```

Sidebar width: `280px`. Gutter between sidebar and main: `space-6`.

### 4.3 Activity detail (`/activity/[slug]`)

Full page (not a modal). Hero image up to `560px` tall; title, save, share, flame above the fold. Below: description, schedule, pricing, location with embedded map, booking CTA, reviews (P2), similar activities (P2).

---

## 5. Accessibility

- WCAG 2.1 AA on Home, Detail, Favorites at P1; expanded to all routes at P2.
- Visible focus ring on every interactive element via `shadow-focus`.
- Focus trap inside `Dialog` and `Sheet`. Esc closes.
- Color is never the sole signal — every selected state pairs with a shape change (filled background, checkmark, bold weight).
- All images have `alt`. Decorative images have `alt=""` (not `role="presentation"`).
- Carousel exposes pause and prev/next as real buttons; auto-rotation halts on hover/focus and respects `prefers-reduced-motion`.

---

## 6. Brand voice (one page, deliberately last)

The product is **calm, confident, curated**. It is not loud, not gamified, not maximalist. The aesthetic reference is the warmth of well-designed lifestyle media (think Cereal magazine) crossed with the editorial precision of a great newspaper website. Apple's restraint is the structural reference; it is not the visual one.

What we avoid: gradients-as-decoration, glassmorphism, chunky drop shadows, emoji-as-icon, "sparkle" effects, motion for motion's sake.

What we earn: spacing-led hierarchy, typography that does the work color usually does, an accent color used so sparingly that when it does appear it actually means something.

When in doubt: **remove**. The next iteration is almost always smaller.
