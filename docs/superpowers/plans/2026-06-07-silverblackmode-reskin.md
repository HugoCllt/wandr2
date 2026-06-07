# SilverBlackMode Re-skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Wandr Home and all six category pages to the `wandr-silverblackmode` design language — a consolidated three-card feed, a premium upsell band + modal, a multi-column footer, a restyled navbar, and a stateful map-explorer block — without touching data, routing, or the layer DAG.

**Architecture:** Art-direction only. Section content, ordering, and data keep coming from the existing presets/DTOs (`CATEGORY_PRESETS`, `DEFAULT_FEED_SECTIONS`, `ActivityDTO`/`FeedItemDTO`). We consolidate to exactly three feed cards, add two DTO-free `shared/ui` blocks (Premium, SiteFooter), rework `MapSection` into a stateful explorer over the existing Mapbox `MapView`, and translate touched chrome to French. Nothing is imported from the `.design-tmp/` prototype; CSS/markup is reproduced.

**Tech Stack:** Next.js App Router (RSC + client leaves), TypeScript, plain CSS custom properties in `src/app/globals.css`, `react-map-gl/maplibre`, Lenis smooth scroll, Vitest.

---

## ⚠️ Spec reconciliation note (read before Task 1)

Spec §1 claims the Quiet-Luxury tokens (`--ink-*`, `--brushed`, `--panel`, `--paper`, `--silver-*`, `--smoke*`, `--line*`, `--shadow-*`) "already exist" in `globals.css`. **They do not.** The live `:root` uses an older vocabulary (`--charcoal-900`, `--ink`, `--silver`, `--silver-2`, `--grad-charcoal`, `--font-display/-body`). The reproduced prototype CSS in this plan references the richer names. **Task 1 establishes those tokens** — this is required to execute the spec faithfully, not a deviation from it. Net-new names are added; the ~6 near-identical names that already exist (`--smoke`, `--line`, `--line-2`, `--shadow-sm/-md/-lg`, `--offwhite`) are reused as-is so the recently-built hero + filter rail are not visually disturbed.

**Two other reconciliations baked into this plan (both honor a higher-priority locked decision over an incidental implementation note):**

1. Spec §5.3 says the Imageless card's category label comes "from `CATEGORY_OPTIONS`". `CATEGORY_OPTIONS` (`filters/web/FilterBar/filter-options.ts`) holds **English** labels (`Sport`, `Food`, …), which violates the locked French decision **D3**. This plan uses a small **French** label map co-located with the card. The **icon** map is taken verbatim from spec §5.3.
2. Spec §14 step 1 lists "MapSection headings → FR" in the language pass. `MapSection` is fully rewritten in Task 11; to avoid editing a file twice, its French copy is authored **in Task 11** (the rework), not the language task. The shared `helpers.ts` + `ActivityModal` French — the parts with real blast radius — are done in the language pass (Tasks 2 + 12 ordering preserved).

## Verification gate (every task)

This is a visual reskin; genuine unit tests exist only for pure logic (Task 2's formatters + category map). For all tasks the gate is:

```
pnpm type-check    # tsc --noEmit
pnpm dep:check     # dependency-cruiser — layer DAG must stay green
pnpm lint          # eslint
```

Tasks that change rendered output also run `pnpm build`. Tasks 2 runs `pnpm test`. After the final task run the **full** gate incl. `pnpm build`. Where a step says "Visual check," load the app (`pnpm dev`) on Home + one category page and confirm by eye — there is no meaningful automated assertion for CSS.

---

## Task 1: Establish the SilverBlackMode design tokens

**Files:**
- Modify: `src/app/globals.css:1-40` (inside `:root`)

- [ ] **Step 1: Add the net-new tokens to `:root`**

In `src/app/globals.css`, immediately before the line `--font-display: "Inter Tight", ui-sans-serif, system-ui;` (currently line 34), insert:

```css
  /* ---- SilverBlackMode reskin tokens (design handoff 2026-06) ----
     Net-new names referenced by the reskin CSS. The near-identical
     --smoke / --line / --line-2 / --shadow-sm|md|lg / --offwhite already
     defined above are reused as-is (kept to not disturb the hero + rail). */
  --ink-950: #050505;
  --ink-900: #0E0E0E;
  --ink-850: #141414;
  --ink-800: #1C1C1C;
  --ink-700: #262626;
  --ink-600: #333333;
  --smoke-2: #8C8C8C;
  --smoke-3: #A6A6A6;
  --silver-500: #C7C7C7;
  --silver-400: #D4D4D4;
  --silver-300: #DEDEDE;
  --silver-200: #EAEAEA;
  --silver-100: #F3F3F3;
  --paper: #FAFAFA;
  --white: #FFFFFF;
  --line-dark: rgba(255,255,255,0.10);
  --line-dark-2: rgba(255,255,255,0.16);
  --brushed: linear-gradient(180deg, #FCFCFC 0%, #ECECEC 48%, #DCDCDC 100%);
  --brushed-hover: linear-gradient(180deg, #FFFFFF 0%, #F1F1F1 48%, #E4E4E4 100%);
  --panel: linear-gradient(135deg, #0A0A0A 0%, #161616 46%, #242424 100%);
  --shadow-xs: 0 1px 2px rgba(10,10,10,0.05);
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --font: var(--font-display);
```

- [ ] **Step 2: Verify the tokens resolve and nothing else changed**

Run: `pnpm lint && pnpm build`
Expected: PASS. Build succeeds; no existing UI changes (no rule consumes the new tokens yet).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): add SilverBlackMode reskin design tokens"
```

---

## Task 2: French formatters + Imageless card category map

**Files:**
- Modify: `src/modules/activities/web/cards/helpers.ts`
- Create: `src/modules/activities/web/cards/categoryMeta.ts`
- Create: `src/modules/activities/web/cards/categoryMeta.test.ts`

- [ ] **Step 1: Write the failing test for the category map**

Create `src/modules/activities/web/cards/categoryMeta.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { categoryIconFor, categoryLabelFor } from './categoryMeta';

describe('categoryMeta', () => {
  it('maps every category to its design icon', () => {
    expect(categoryIconFor('SPORT')).toBe('ball');
    expect(categoryIconFor('ROMANTIC')).toBe('heart');
    expect(categoryIconFor('FOOD')).toBe('fork');
    expect(categoryIconFor('CULTURE')).toBe('culture');
    expect(categoryIconFor('OUTDOOR')).toBe('leaf');
    expect(categoryIconFor('NIGHTLIFE')).toBe('moon');
  });

  it('maps every category to a French label', () => {
    expect(categoryLabelFor('SPORT')).toBe('Sport');
    expect(categoryLabelFor('FOOD')).toBe('Gastronomie');
    expect(categoryLabelFor('NIGHTLIFE')).toBe('Vie nocturne');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test categoryMeta`
Expected: FAIL — `Cannot find module './categoryMeta'`.

- [ ] **Step 3: Implement `categoryMeta.ts`**

Create `src/modules/activities/web/cards/categoryMeta.ts`:

```ts
import type { ActivityCategory } from '../../domain/ActivityCategorySet';
import type { IconName } from '../../../../shared/ui/icons/Icon';

// Icon map is verbatim from design spec §5.3. Labels are French (decision D3);
// CATEGORY_OPTIONS would give English, so the FR labels live here instead.
const CATEGORY_ICON: Record<ActivityCategory, IconName> = {
  SPORT: 'ball',
  ROMANTIC: 'heart',
  FOOD: 'fork',
  CULTURE: 'culture',
  OUTDOOR: 'leaf',
  NIGHTLIFE: 'moon',
};

const CATEGORY_LABEL: Record<ActivityCategory, string> = {
  SPORT: 'Sport',
  ROMANTIC: 'Romantique',
  FOOD: 'Gastronomie',
  CULTURE: 'Culture',
  OUTDOOR: 'Plein air',
  NIGHTLIFE: 'Vie nocturne',
};

export function categoryIconFor(category: ActivityCategory): IconName {
  return CATEGORY_ICON[category];
}

export function categoryLabelFor(category: ActivityCategory): string {
  return CATEGORY_LABEL[category];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test categoryMeta`
Expected: PASS (2 tests).

- [ ] **Step 5: Translate the shared formatters to French in `helpers.ts`**

In `src/modules/activities/web/cards/helpers.ts`, replace `formatActivityPrice` and `formatActivityWhen` (lines 10-32) with:

```ts
export function formatActivityPrice(activity: ActivityDTO): string {
  if (activity.priceMinCents <= 0 && (activity.priceMaxCents === null || activity.priceMaxCents === 0)) {
    return 'Gratuit';
  }
  const min = Math.round(activity.priceMinCents / 100);
  if (activity.priceMaxCents === null || activity.priceMaxCents === activity.priceMinCents) {
    return `${min} $+`;
  }
  return `${min}–${Math.round(activity.priceMaxCents / 100)} $`;
}

export function formatActivityWhen(activity: ActivityDTO): string {
  if (activity.kind === 'PLACE') return 'Ouvert tous les jours';
  if (!activity.dateStart) return 'À venir';
  const d = new Date(activity.dateStart);
  return d.toLocaleString('fr-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
```

`formatActivityWhere` and `useOpenActivity` are unchanged (default `'Montréal'` is already French).

- [ ] **Step 6: Verify**

Run: `pnpm test categoryMeta && pnpm type-check && pnpm dep:check && pnpm lint`
Expected: PASS. (Blast radius: Favorites/Calendar cards now read French prices/dates — intended.)

- [ ] **Step 7: Commit**

```bash
git add src/modules/activities/web/cards/categoryMeta.ts src/modules/activities/web/cards/categoryMeta.test.ts src/modules/activities/web/cards/helpers.ts
git commit -m "feat(cards): French price/date formatters + category icon/label map"
```

---

## Task 3: ImagelessActivityCard + `.nophoto` CSS

**Files:**
- Create: `src/modules/activities/web/cards/ImagelessActivityCard.tsx`
- Modify: `src/app/globals.css` (append `.nophoto` block)

> Routing the card into the feed (`imageUrl ? Tuile : Imageless`) happens in Task 4 once the feed composition is reworked. This task builds the card + its CSS in isolation.

- [ ] **Step 1: Add the `.nophoto` CSS block**

Append to `src/app/globals.css` (end of file):

```css
/* ===========================================================
   IMAGELESS CARD (.nophoto) — paper brushed text card
   Same footprint as a Tuile; deliberate no-photo treatment.
   =========================================================== */
.nophoto {
  position: relative; display: flex; flex-direction: column; width: 100%;
  aspect-ratio: 4 / 3.15;
  border-radius: 14px;
  overflow: hidden; cursor: pointer; text-align: left;
  padding: 24px 24px 22px;
  background: linear-gradient(158deg, #FFFFFF 0%, #F4F4F4 54%, #E9E9E9 100%);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  transition: transform .4s var(--ease), box-shadow .4s var(--ease), border-color .4s var(--ease);
}
.nophoto::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(120deg, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.0) 60%);
  opacity: 0.6;
}
.nophoto:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); border-color: var(--line-2); }
.nophoto-top {
  position: relative; z-index: 1;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.nophoto-cat {
  font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--smoke-2);
}
.nophoto-mark {
  width: 40px; height: 40px; border-radius: 11px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--ink-800);
  background: var(--brushed);
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, var(--shadow-xs);
}
.nophoto-title {
  position: relative; z-index: 1;
  margin: 18px 0 0;
  font-size: 23px; font-weight: 400; letter-spacing: -0.028em;
  line-height: 1.1; color: var(--ink-900); text-wrap: pretty;
}
.nophoto-meta {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin-top: 10px; font-size: 13px; color: var(--smoke);
}
.nophoto-meta .dot { width: 3px; height: 3px; border-radius: 999px; background: var(--smoke-3); }
.nophoto-foot {
  position: relative; z-index: 1;
  margin-top: auto; padding-top: 16px;
  border-top: 1px solid var(--line);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.nophoto-price { font-size: 15px; font-weight: 500; color: var(--ink-900); letter-spacing: -0.01em; white-space: nowrap; }
/* The shared FavoriteButton renders an absolute .card-fav-btn; inside the
   imageless foot we want it inline (price left, save right). */
.nophoto-foot .card-fav-btn { position: static; top: auto; right: auto; }
```

- [ ] **Step 2: Implement `ImagelessActivityCard.tsx`**

Create `src/modules/activities/web/cards/ImagelessActivityCard.tsx`:

```tsx
'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { categoryIconFor, categoryLabelFor } from './categoryMeta';
import { formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  favoriteSlot?: ReactNode;
};

/**
 * No-photo card: a deliberate paper brushed-gradient text card with the same
 * footprint as a Tuile. Routed to when `activity.imageUrl` is null. Consumes
 * ActivityDTO → lives in activities/web.
 */
export function ImagelessActivityCard({ activity, favoriteSlot }: Props): ReactElement {
  const open = useOpenActivity();
  const primary = activity.categories.primary;
  const price = formatActivityPrice(activity);

  return (
    <article className="nophoto" onClick={() => open(activity)}>
      <div className="nophoto-top">
        <span className="nophoto-cat">{categoryLabelFor(primary)}</span>
        <span className="nophoto-mark">
          <Icon name={categoryIconFor(primary)} size={20} />
        </span>
      </div>
      <h3 className="nophoto-title">{activity.title}</h3>
      <div className="nophoto-meta">
        <span>{formatActivityWhen(activity)}</span>
        <span className="dot" />
        <span>{formatActivityWhere(activity)}</span>
      </div>
      <div className="nophoto-foot">
        {price ? <span className="nophoto-price">{price}</span> : <span />}
        {favoriteSlot}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm dep:check && pnpm lint`
Expected: PASS. (`dep:check` confirms `activities/web` → `shared/ui` icon import is legal.)

- [ ] **Step 4: Commit**

```bash
git add src/modules/activities/web/cards/ImagelessActivityCard.tsx src/app/globals.css
git commit -m "feat(cards): ImagelessActivityCard + .nophoto paper card styling"
```

---

## Task 4: Tuile + Feature restyle, feed composition rework, section eyebrows

**Files:**
- Modify: `src/shared/presets/FEED_SECTIONS.ts`
- Modify: `src/modules/activities/web/cards/CoverActivityCard.tsx`
- Modify: `src/modules/activities/web/cards/MediaRowActivityCard.tsx`
- Modify: `src/modules/feed/web/SectionedFeed.tsx`
- Modify: `src/modules/feed/web/FeedGrid.tsx`
- Modify: `src/app/globals.css` (append `.feed-section`/`.tuile`/`.feature` blocks)

- [ ] **Step 1: Add optional `eyebrow` to `FeedSectionSpec` and fill the three specs**

Replace `src/shared/presets/FEED_SECTIONS.ts` lines 3-20 with:

```ts
export type FeedSectionSpec = {
  /** Stable React key + section id. */
  key: string;
  /** User-facing title (honest, literal — no subtitle). */
  title: string;
  /** Small uppercase kicker above the title (design eyebrow). */
  eyebrow?: string;
  source: FeedSectionSource;
};

/**
 * The single shared section list driving every Category page AND Home.
 * `top` ("Pour toi") is the affinity catch-all — assigned last, rendered first.
 * Reorder / rename / drop a theme by editing this array.
 */
export const DEFAULT_FEED_SECTIONS: FeedSectionSpec[] = [
  { key: 'top', title: 'Pour toi', eyebrow: 'Sélection', source: 'top' },
  { key: 'outdoor', title: 'En plein air', eyebrow: 'Grand air', source: 'outdoor' },
  { key: 'free', title: 'Gratuit', eyebrow: 'Sans dépenser', source: 'free' },
];
```

- [ ] **Step 2: Add the feed shell + `.tuile` + `.feature` CSS**

Append to `src/app/globals.css`:

```css
/* ===========================================================
   FEED SHELL (reskin) — editorial whitespace, 3-col grid
   =========================================================== */
.feed-section { padding: 0 0 92px; }
.feed-section:last-child { padding-bottom: 64px; }
.feed-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 24px; margin-bottom: 34px;
}
.feed-eyebrow {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--smoke); margin-bottom: 13px;
}
.feed-head h2 {
  font-family: var(--font);
  font-weight: 300; font-size: 38px;
  letter-spacing: -0.035em; line-height: 1;
  color: var(--ink-900); margin: 0;
}
.feed-stack { display: flex; flex-direction: column; gap: 24px; }
.feed-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 24px; margin-top: 0;
}

/* ----- TUILE (full-bleed photo card) ----- */
.tuile {
  position: relative; display: block; width: 100%;
  aspect-ratio: 4 / 3.15;
  border-radius: 14px;
  overflow: hidden; cursor: pointer; text-align: left;
  background: var(--ink-900);
  box-shadow: var(--shadow-xs);
  transition: transform .4s var(--ease), box-shadow .4s var(--ease);
}
.tuile:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }
.tuile-img {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  transition: transform .8s var(--ease);
}
.tuile:hover .tuile-img { transform: scale(1.055); }
.tuile-scrim {
  position: absolute; inset: 0;
  background: linear-gradient(to top,
    rgba(5,5,5,0.80) 0%, rgba(5,5,5,0.46) 30%, rgba(5,5,5,0.08) 58%, rgba(5,5,5,0) 78%);
}
.tuile-badge {
  position: absolute; top: 15px; left: 15px; z-index: 3;
  display: inline-flex; align-items: center; height: 26px; padding: 0 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.92); color: var(--ink-900);
  font-size: 10px; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase;
  backdrop-filter: blur(6px);
}
.tuile-body {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
  padding: 22px 22px 20px; color: var(--white);
}
.tuile-title {
  font-size: 21px; font-weight: 500; letter-spacing: -0.022em;
  line-height: 1.12; margin: 0 0 9px; text-wrap: pretty;
}
.tuile-meta {
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  font-size: 13px; color: rgba(255,255,255,0.80); margin-bottom: 13px;
}
.tuile-meta .dot { width: 3px; height: 3px; border-radius: 999px; background: rgba(255,255,255,0.5); }
.tuile-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 24px; }
.tuile-price { font-size: 15px; font-weight: 500; color: var(--white); letter-spacing: -0.01em; white-space: nowrap; }

/* ----- FEATURE ("À la une" editorial split) ----- */
.feature {
  position: relative; display: grid;
  grid-template-columns: 1.18fr 1fr;
  border-radius: 18px; overflow: hidden;
  background: var(--white);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  min-height: 400px; cursor: pointer;
  transition: transform .4s var(--ease), box-shadow .4s var(--ease);
}
.feature:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
.feature.flip { grid-template-columns: 1fr 1.18fr; }
.feature.flip .feature-media { order: 2; }
.feature.flip .feature-body { order: 1; }
.feature-media { position: relative; overflow: hidden; background: var(--ink-900); }
.feature-media .img {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  transition: transform .9s var(--ease);
}
.feature:hover .feature-media .img { transform: scale(1.04); }
.feature-media.placeholder { display: flex; align-items: center; justify-content: center; background: var(--panel); }
.feature-media .ph-mark {
  width: 92px; height: 92px; border-radius: 24px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--ink-900); background: var(--brushed);
  box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, var(--shadow-sm);
}
.feature-body { padding: 46px 48px 38px; display: flex; flex-direction: column; }
.feature-eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--smoke); margin-bottom: 18px;
}
.feature-title {
  font-weight: 300; font-size: 42px; letter-spacing: -0.04em; line-height: 1.0;
  color: var(--ink-900); margin: 0 0 18px; text-wrap: balance;
}
.feature-desc {
  font-weight: 300; font-size: 16px; line-height: 1.62;
  color: var(--ink-700); margin: 0 0 24px; max-width: 46ch; text-wrap: pretty;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.feature-meta {
  display: flex; align-items: center; gap: 9px; flex-wrap: wrap;
  font-size: 14px; color: var(--smoke);
}
.feature-meta .dot { width: 3px; height: 3px; border-radius: 999px; background: var(--smoke-3); }
.feature-foot {
  margin-top: auto; padding-top: 26px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.feature-price b { font-weight: 400; font-size: 26px; color: var(--ink-900); letter-spacing: -0.02em; }
.feature-cta {
  display: inline-flex; align-items: center; gap: 11px;
  background: var(--ink-900); color: var(--white);
  font-weight: 500; font-size: 14px;
  padding: 13px 22px; border-radius: 10px;
  border: 1px solid var(--ink-700);
  transition: background .2s var(--ease), transform .2s var(--ease);
}
.feature:hover .feature-cta { background: var(--ink-800); }
.feature-cta svg { transition: transform .25s var(--ease); }
.feature:hover .feature-cta svg { transform: translateX(3px); }

@media (max-width: 1080px) {
  .feed-grid { grid-template-columns: repeat(2, 1fr); }
  .feature, .feature.flip { grid-template-columns: 1fr; min-height: 0; }
  .feature.flip .feature-media { order: 1; }
  .feature.flip .feature-body { order: 2; }
  .feature-media { min-height: 280px; }
  .feature-body { padding: 34px 32px; }
  .feature-title { font-size: 34px; }
}
@media (max-width: 760px) {
  .feed-grid { grid-template-columns: 1fr; }
  .feed-head h2 { font-size: 30px; }
}
```

- [ ] **Step 3: Restyle `CoverActivityCard` to the Tuile markup**

Replace the entire body of `src/modules/activities/web/cards/CoverActivityCard.tsx` with:

```tsx
'use client';

import type { ReactElement, ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Badge = { label: string; kind: 'trending' | 'popular' | 'hot' | 'new' };

type Props = {
  activity: ActivityDTO;
  live?: boolean;
  badge?: Badge;
  showPrice?: boolean;
  favoriteSlot?: ReactNode;
};

function deriveBadge(activity: ActivityDTO): Badge | null {
  if (activity.isFeatured) return { label: 'Tendance', kind: 'trending' };
  return null;
}

/**
 * Tuile — the workhorse full-bleed photo card. Title/meta/price overlaid on a
 * bottom scrim; optional favorite (save) top-right; optional trending badge.
 * No rating dots (no rating field) and no calendar button (decision D4).
 */
export function CoverActivityCard({
  activity,
  live = false,
  badge,
  showPrice = false,
  favoriteSlot,
}: Props): ReactElement {
  const open = useOpenActivity();
  const activeBadge = live ? null : badge ?? deriveBadge(activity);
  const price = formatActivityPrice(activity);

  return (
    <article className="tuile" onClick={() => open(activity)}>
      <div className="tuile-img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
      <div className="tuile-scrim" />
      {live && (
        <span className="cover-card-live">
          <span className="pulse" /> En direct
        </span>
      )}
      {activeBadge && <span className="tuile-badge">{activeBadge.label}</span>}
      {favoriteSlot}
      <div className="tuile-body">
        <h3 className="tuile-title">{activity.title}</h3>
        <div className="tuile-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
        <div className="tuile-foot">
          {showPrice && price ? <span className="tuile-price">{price}</span> : null}
        </div>
      </div>
    </article>
  );
}
```

(`size` and `calendarSlot` props are removed. The `.cover-card-live`/`.pulse` classes still exist in `globals.css` and are reused for the LIVE badge.)

- [ ] **Step 4: Restyle `MediaRowActivityCard` to the Feature markup**

Replace the entire body of `src/modules/activities/web/cards/MediaRowActivityCard.tsx` with:

```tsx
'use client';

import type { ReactElement } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../../shared/ui/icons/Icon';
import { coverImageUrl, formatActivityPrice, formatActivityWhen, formatActivityWhere, useOpenActivity } from './helpers';

type Props = {
  activity: ActivityDTO;
  /** Alternate the photo to the right (set per section index). */
  flip?: boolean;
  /** Eyebrow above the title. */
  eyebrow?: string;
};

/**
 * Feature — the per-section "À la une" anchor: an editorial photo/text split
 * that alternates sides by section index. Foot = price + "Découvrir →" only
 * (no inline save/calendar, decision D4). Handles a no-image item with a
 * brushed placeholder mark.
 */
export function MediaRowActivityCard({
  activity,
  flip = false,
  eyebrow = 'À la une',
}: Props): ReactElement {
  const open = useOpenActivity();
  const hasImage = Boolean(activity.imageUrl);
  const price = formatActivityPrice(activity);

  return (
    <article className={'feature' + (flip ? ' flip' : '')} onClick={() => open(activity)}>
      <div className={'feature-media' + (hasImage ? '' : ' placeholder')}>
        {hasImage ? (
          <div className="img" style={{ backgroundImage: `url(${coverImageUrl(activity)})` }} />
        ) : (
          <span className="ph-mark">
            <Icon name="compass" size={40} />
          </span>
        )}
      </div>
      <div className="feature-body">
        <div className="feature-eyebrow">{eyebrow}</div>
        <h3 className="feature-title">{activity.title}</h3>
        <p className="feature-desc">{activity.description}</p>
        <div className="feature-meta">
          <span>{formatActivityWhen(activity)}</span>
          <span className="dot" />
          <span>{formatActivityWhere(activity)}</span>
        </div>
        <div className="feature-foot">
          <span className="feature-price">{price ? <b>{price}</b> : null}</span>
          <span className="feature-cta">
            Découvrir <Icon name="arrow-right" size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
```

(`side`/`favoriteSlot`/`calendarSlot` props are removed; `flip` + `eyebrow` replace them.)

- [ ] **Step 5: Rework `SectionedFeed` composition**

Replace the entire body of `src/modules/feed/web/SectionedFeed.tsx` with:

```tsx
import type { ReactElement, ReactNode } from 'react';

import type { FeedItemDTO } from '../../../shared/contracts/FeedResultDTO';
import { DEFAULT_FEED_SECTIONS } from '../../../shared/presets/FEED_SECTIONS';
import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { ImagelessActivityCard } from '../../activities/web/cards/ImagelessActivityCard';
import { MediaRowActivityCard } from '../../activities/web/cards/MediaRowActivityCard';
import { FavoriteButton } from '../../favorites/web/FavoriteButton';
import { buildFeedSections, type RenderedSection } from './buildFeedSections';
import { FeedGrid } from './FeedGrid';

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

/** Routes a grid item to the Tuile (has photo) or the Imageless card. */
function GridCard({ item }: { item: FeedItemDTO }): ReactElement {
  return item.imageUrl ? (
    <CoverActivityCard activity={item} showPrice favoriteSlot={favoriteSlot(item)} />
  ) : (
    <ImagelessActivityCard activity={item} favoriteSlot={favoriteSlot(item)} />
  );
}

function Section({ section, index }: { section: RenderedSection; index: number }): ReactElement {
  const [feature, ...rest] = section.items;

  return (
    <section className="feed-section">
      <div className="feed-head">
        <div>
          {section.spec.eyebrow ? <div className="feed-eyebrow">{section.spec.eyebrow}</div> : null}
          <h2>{section.spec.title}</h2>
        </div>
      </div>
      <div className="feed-stack">
        <MediaRowActivityCard activity={feature} flip={index % 2 === 1} />
        {rest.length > 0 && (
          <div className="feed-grid">
            {rest.map((a) => (
              <GridCard key={a.id} item={a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Renders the partitioned pool as themed sections (a Feature anchor + a routed
 * 3-col grid) followed by a trailing "Toutes les activités" grid for the long
 * tail. Server component; cards/slots are client leaves.
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
      {sections.map((section, i) => (
        <Section key={section.spec.key} section={section} index={i} />
      ))}
      {showTail && (
        <section className="feed-section">
          <div className="feed-head">
            <div>
              <div className="feed-eyebrow">Tout explorer</div>
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

(Removes the `STANZA`/`chunk`/`calendarSlot` machinery and the MediaRow-in-grid stanza pattern. `MediaRow` is now the section anchor only.)

- [ ] **Step 6: Route image vs imageless in `FeedGrid` and drop the calendar action**

In `src/modules/feed/web/FeedGrid.tsx`:

1. Replace the imports block (lines 5-8) with:

```tsx
import type { FeedItemDTO, FeedResultDTO } from '../../../shared/contracts/FeedResultDTO';
import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { ImagelessActivityCard } from '../../activities/web/cards/ImagelessActivityCard';
import { FavoriteButton } from '../../favorites/web/FavoriteButton';
```

2. Replace the render grid (lines 75-92, the `return (<div>…</div>)` grid body) with:

```tsx
  return (
    <div>
      <div className="feed-grid" role="list" aria-label="Activities">
        {items.map((item) => (
          <div role="listitem" key={item.id}>
            {item.imageUrl ? (
              <CoverActivityCard
                activity={item}
                showPrice
                favoriteSlot={
                  <FavoriteButton activityId={item.id} initialFavorited={item.isFavorited} />
                }
              />
            ) : (
              <ImagelessActivityCard
                activity={item}
                favoriteSlot={
                  <FavoriteButton activityId={item.id} initialFavorited={item.isFavorited} />
                }
              />
            )}
          </div>
        ))}
      </div>
      <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />
      {loading ? <p className="feed-status">Chargement…</p> : null}
      {error ? <p className="feed-error">{error}</p> : null}
      {cursor === null && items.length > 0 ? (
        <p className="feed-status">Vous avez tout vu.</p>
      ) : null}
    </div>
  );
```

3. Change the empty-state default (line 23) to French: `emptyMessage = 'Aucune activité ne correspond à vos filtres.'`

- [ ] **Step 7: Verify the whole feed compiles + renders**

Run: `pnpm type-check && pnpm dep:check && pnpm lint && pnpm build`
Expected: PASS. Then Visual check: Home + `/sport` show eyebrow+title section heads, one Feature anchor per section alternating sides, a 3-col routed grid (photo → Tuile, no-photo → paper card), and a trailing "Toutes les activités" grid.

- [ ] **Step 8: Commit**

```bash
git add src/shared/presets/FEED_SECTIONS.ts src/modules/activities/web/cards/CoverActivityCard.tsx src/modules/activities/web/cards/MediaRowActivityCard.tsx src/modules/feed/web/SectionedFeed.tsx src/modules/feed/web/FeedGrid.tsx src/app/globals.css
git commit -m "feat(feed): consolidated Tuile/Feature/Imageless three-card system + eyebrow heads"
```

---

## Task 5: Delete legacy cards + design-showcase route

**Files:**
- Delete: `src/modules/activities/web/cards/HeroActivityCard.tsx`
- Delete: `src/modules/activities/web/cards/ClassActivityCard.tsx`
- Delete: `src/app/(with-sidebar)/design-showcase/page.tsx`

> Verified consumers: `HeroActivityCard` + `ClassActivityCard` are imported **only** by `design-showcase/page.tsx`; nothing else references them. `design-showcase` is the dev-only route already slated to retire in `tbd.md`.

- [ ] **Step 1: Delete the three files**

```bash
git rm src/modules/activities/web/cards/HeroActivityCard.tsx src/modules/activities/web/cards/ClassActivityCard.tsx "src/app/(with-sidebar)/design-showcase/page.tsx"
```

- [ ] **Step 2: Confirm no dangling references**

Run: `pnpm type-check`
Expected: PASS with no "cannot find module" errors. If any surface, grep for the symbol and remove the importing line (none expected).

- [ ] **Step 3: Verify**

Run: `pnpm dep:check && pnpm lint && pnpm build`
Expected: PASS. `/design-showcase` now 404s (intended).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete legacy Hero/Class cards + design-showcase route"
```

---

## Task 6: Premium band + modal (`shared/ui/Premium.tsx`)

**Files:**
- Create: `src/shared/ui/Premium.tsx`
- Modify: `src/app/globals.css` (append premium band + modal block)

> DTO-free client component → belongs in `shared/ui`. Must not import any `shared/contracts` DTO. Modal opens via local `useState` (no `window.*`).

- [ ] **Step 1: Add the premium CSS block**

Append to `src/app/globals.css` the full premium stylesheet (band + AI-companion preview + recap modal). Paste verbatim:

```css
/* ===========================================================
   WANDR PREMIUM — brushed band + recap modal
   =========================================================== */
.premium { position: relative; z-index: 1; }
.premium-band {
  position: relative; background: var(--panel);
  border: 1px solid var(--ink-700); border-radius: 26px; overflow: hidden;
  display: grid; grid-template-columns: 1.06fr 0.94fr; align-items: stretch;
  box-shadow: var(--shadow-md);
}
.premium-band::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(130% 90% at 0% 0%, rgba(255,255,255,0.07), transparent 58%),
    linear-gradient(104deg, transparent 32%, rgba(255,255,255,0.05) 50%, transparent 68%);
}
.premium-band::after {
  content: ''; position: absolute; left: 0; right: 0; top: 0; height: 1px; z-index: 1;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
}
.pb-main { position: relative; z-index: 2; padding: 50px 52px; display: flex; flex-direction: column; align-items: flex-start; }
.pb-badge {
  display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 14px;
  border-radius: 999px; background: var(--brushed); color: var(--ink-900);
  font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, var(--shadow-xs);
}
.pb-title { font-weight: 300; font-size: 38px; line-height: 1.04; letter-spacing: -0.035em; color: var(--white); margin: 24px 0 0; max-width: 17ch; text-wrap: balance; }
.pb-sub { color: var(--silver-400); font-size: 15.5px; line-height: 1.55; font-weight: 300; margin: 16px 0 0; max-width: 42ch; }
.pb-feats { display: flex; flex-direction: column; gap: 11px; margin: 28px 0 0; }
.pb-feat { display: flex; align-items: center; gap: 12px; color: var(--silver-200); font-size: 14px; }
.pb-feat .ico {
  width: 31px; height: 31px; border-radius: 8px; flex: none;
  background: rgba(255,255,255,0.06); border: 1px solid var(--line-dark-2);
  display: inline-flex; align-items: center; justify-content: center; color: var(--silver-200);
}
.pb-cta-row { display: flex; align-items: center; gap: 20px; margin-top: 36px; flex-wrap: wrap; }
.pb-price { color: var(--silver-400); font-size: 13.5px; line-height: 1.3; }
.pb-price b { display: block; color: var(--white); font-weight: 500; font-size: 16px; letter-spacing: -0.01em; }
.pb-aside { position: relative; z-index: 2; padding: 40px 52px 40px 6px; display: flex; align-items: center; }
.pb-chat {
  width: 100%;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid var(--line-dark-2); border-radius: 18px; padding: 16px 16px 18px;
  backdrop-filter: blur(8px); box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; gap: 11px;
}
.pb-chat-head { display: flex; align-items: center; gap: 11px; padding-bottom: 13px; margin-bottom: 2px; border-bottom: 1px solid var(--line-dark); }
.pb-chat-avatar {
  width: 36px; height: 36px; border-radius: 999px; flex: none;
  background: var(--brushed); color: var(--ink-900);
  display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset;
}
.pb-chat-id { display: flex; flex-direction: column; line-height: 1.3; gap: 1px; min-width: 0; }
.pb-chat-name { color: var(--silver-100); font-size: 13.5px; font-weight: 500; white-space: nowrap; }
.pb-chat-status { color: var(--smoke-3); font-size: 11.5px; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.pb-chat-status .live { width: 6px; height: 6px; border-radius: 999px; background: #7FBF9A; box-shadow: 0 0 0 3px rgba(127,191,154,0.18); }
.bubble { max-width: 86%; padding: 10px 13px; border-radius: 14px; font-size: 13px; line-height: 1.45; }
.bubble.ai { align-self: flex-start; background: rgba(255,255,255,0.07); color: var(--silver-100); border: 1px solid var(--line-dark); border-bottom-left-radius: 5px; }
.bubble.me { align-self: flex-end; background: var(--brushed); color: var(--ink-900); border-bottom-right-radius: 5px; font-weight: 500; }
.pb-pick { align-self: stretch; display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 13px; background: rgba(255,255,255,0.05); border: 1px solid var(--line-dark); }
.pb-pick-img { width: 46px; height: 46px; border-radius: 9px; flex: none; background-size: cover; background-position: center; }
.pb-pick-tx { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.pb-pick-tx b { color: var(--silver-100); font-size: 13px; font-weight: 500; }
.pb-pick-tx span { color: var(--smoke-3); font-size: 11.5px; }
.pb-pick-go { margin-left: auto; color: var(--silver-300); flex: none; }
.pb-track { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 3px; padding: 10px 13px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid var(--line-dark); }
.pb-track-l { display: flex; align-items: center; gap: 9px; color: var(--silver-200); font-size: 12.5px; }
.pb-track-l svg { color: var(--silver-300); }
.pb-track-dots { display: inline-flex; gap: 5px; }
.pb-track-dots i { width: 7px; height: 7px; border-radius: 999px; background: var(--silver-200); display: block; }
.pb-track-dots i.off { background: rgba(255,255,255,0.18); }

.prem-overlay {
  position: fixed; inset: 0; z-index: 200; background: rgba(8,8,8,0.6);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center; padding: 40px 24px;
  animation: act-fade .25s var(--ease) both;
}
.prem-modal {
  position: relative; width: 100%; max-width: 720px; max-height: calc(100vh - 80px);
  background: var(--paper); border-radius: 24px; overflow: hidden;
  box-shadow: var(--shadow-lg); display: flex; flex-direction: column;
  animation: act-pop .32s var(--ease) both;
}
.prem-scroll { overflow-y: auto; flex: 1; scrollbar-width: thin; scrollbar-color: var(--silver-400) transparent; }
.prem-scroll::-webkit-scrollbar { width: 8px; }
.prem-scroll::-webkit-scrollbar-thumb { background: var(--silver-400); border-radius: 999px; }
.prem-top { position: relative; overflow: hidden; background: var(--panel); padding: 40px 40px 36px; }
.prem-top::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.08), transparent 56%),
    linear-gradient(104deg, transparent 36%, rgba(255,255,255,0.05) 50%, transparent 64%);
}
.prem-top::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); }
.prem-close {
  position: absolute; top: 16px; right: 16px; z-index: 5; width: 38px; height: 38px; border-radius: 999px;
  background: rgba(255,255,255,0.08); color: var(--white);
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--line-dark-2); backdrop-filter: blur(8px);
  transition: background .18s, transform .18s;
}
.prem-close:hover { background: rgba(255,255,255,0.16); transform: scale(1.05); }
.prem-badge {
  position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px;
  height: 30px; padding: 0 14px; border-radius: 999px; background: var(--brushed); color: var(--ink-900);
  font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, var(--shadow-xs);
}
.prem-title { position: relative; z-index: 1; font-weight: 300; font-size: 32px; line-height: 1.06; letter-spacing: -0.035em; color: var(--white); margin: 22px 0 0; max-width: 22ch; text-wrap: balance; }
.prem-sub { position: relative; z-index: 1; color: var(--silver-400); font-size: 15px; line-height: 1.55; font-weight: 300; margin: 14px 0 0; max-width: 50ch; }
.prem-body { padding: 14px 40px 18px; }
.prem-feat { display: grid; grid-template-columns: 54px 1fr; gap: 18px; padding: 22px 0; border-bottom: 1px solid var(--line); }
.prem-feat:last-child { border-bottom: none; }
.prem-feat .ico {
  position: relative; width: 54px; height: 54px; border-radius: 15px; flex: none;
  background: var(--brushed); color: var(--ink-900);
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, var(--shadow-xs);
}
.prem-feat .ico .count {
  position: absolute; top: -7px; right: -7px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px;
  background: var(--ink-900); color: var(--white); font-size: 11px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center; border: 2px solid var(--paper);
}
.prem-feat h4 { font-size: 17px; font-weight: 500; letter-spacing: -0.02em; color: var(--ink-900); margin: 2px 0 6px; }
.prem-feat p { font-size: 14px; color: var(--smoke); line-height: 1.55; margin: 0; text-wrap: pretty; }
.prem-foot {
  position: sticky; bottom: 0; z-index: 5; background: rgba(250,250,250,0.92); backdrop-filter: blur(12px);
  border-top: 1px solid var(--line); padding: 18px 40px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.prem-price-blk { display: flex; align-items: baseline; gap: 8px; }
.prem-price-num { font-weight: 400; font-size: 28px; color: var(--ink-900); letter-spacing: -0.02em; }
.prem-price-unit { font-size: 13px; color: var(--smoke); }
.prem-cta-row { display: flex; align-items: center; gap: 10px; }
.prem-later { color: var(--smoke); font-size: 14px; font-weight: 500; padding: 12px 8px; transition: color .15s; }
.prem-later:hover { color: var(--ink-800); }
/* Shared brushed-silver primary button used by the band + modal CTAs. */
.btn-primary {
  display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 20px;
  border-radius: 11px; background: var(--brushed); color: var(--ink-900);
  font-size: 14px; font-weight: 600; border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 1px 0 rgba(255,255,255,0.7) inset, var(--shadow-sm);
  transition: background .25s var(--ease), transform .2s var(--ease), box-shadow .25s var(--ease);
}
.btn-primary:hover { background: var(--brushed-hover); transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset, var(--shadow-md); }
.btn-primary svg { transition: transform .25s var(--ease); }
.btn-primary:hover svg { transform: translateX(3px); }

@media (max-width: 980px) {
  .premium-band { grid-template-columns: 1fr; }
  .pb-aside { padding: 0 52px 48px; }
  .pb-main { padding-bottom: 32px; }
}
@media (max-width: 760px) {
  .pb-main { padding: 38px 28px 26px; }
  .pb-aside { padding: 0 28px 38px; }
  .pb-title { font-size: 30px; }
  .prem-top { padding: 34px 26px 30px; }
  .prem-body, .prem-foot { padding-left: 26px; padding-right: 26px; }
  .prem-title { font-size: 27px; }
  .prem-foot { flex-direction: column; align-items: stretch; }
  .prem-cta-row { justify-content: space-between; }
}
```

> Note: the modal reuses the existing `act-fade` / `act-pop` keyframes already defined for the activity modal in `globals.css`. If `pnpm build` warns they are missing, add them: `@keyframes act-fade { from { opacity: 0 } to { opacity: 1 } } @keyframes act-pop { from { opacity: 0; transform: translateY(12px) scale(.98) } to { opacity: 1; transform: none } }`.

- [ ] **Step 2: Implement `Premium.tsx`**

Create `src/shared/ui/Premium.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';

import { Icon } from './icons/Icon';

const PREMIUM_PICK_IMG =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=200&q=80';

const PREMIUM_FEATURES = [
  {
    icon: 'chat' as const,
    title: 'Compagnon de voyage IA',
    desc: "Discutez avec l'assistant pour bâtir un week-end ou un itinéraire complet à Montréal — étape par étape, à votre rythme.",
  },
  {
    icon: 'compass' as const,
    title: 'Recommandations sur mesure',
    desc: "Précisez vos critères au fil de la conversation — quartier, budget, ambiance, météo — et l'assistant trouve l'activité juste pour vous.",
  },
  {
    icon: 'calendar' as const,
    count: '3',
    title: "Suivez jusqu'à 3 activités",
    desc: 'Recevez chaque jour des mises à jour sur les événements et les activités liés aux sujets que vous suivez.',
  },
];

function PremiumModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="prem-overlay" onClick={onClose}>
      <div className="prem-modal" onClick={(e) => e.stopPropagation()}>
        <button className="prem-close" onClick={onClose} aria-label="Fermer">
          <Icon name="close" size={18} stroke={2.2} />
        </button>
        <div className="prem-scroll">
          <div className="prem-top">
            <span className="prem-badge">
              <Icon name="gem" size={14} /> Wandr Premium
            </span>
            <h2 className="prem-title">Le meilleur de Montréal, planifié pour vous.</h2>
            <p className="prem-sub">
              Un assistant qui apprend ce que vous aimez — pour planifier, découvrir et suivre vos
              sorties sans effort.
            </p>
          </div>
          <div className="prem-body">
            {PREMIUM_FEATURES.map((f) => (
              <div className="prem-feat" key={f.title}>
                <span className="ico">
                  <Icon name={f.icon} size={24} />
                  {'count' in f && f.count ? <span className="count">{f.count}</span> : null}
                </span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="prem-foot">
          <div className="prem-price-blk">
            <span className="prem-price-num">9,99 $</span>
            <span className="prem-price-unit">/ mois · annulez à tout moment</span>
          </div>
          <div className="prem-cta-row">
            <button className="prem-later" onClick={onClose}>
              Plus tard
            </button>
            <button className="btn-primary" onClick={onClose}>
              Passer à Premium <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Premium upsell band (with a static AI-companion preview) + recap modal.
 * DTO-free chrome → shared/ui. The modal is opened by the band CTA via local
 * state (no window globals).
 */
export function Premium() {
  const [open, setOpen] = useState(false);

  return (
    <section className="section premium">
      <div className="premium-band">
        <div className="pb-main">
          <span className="pb-badge">
            <Icon name="gem" size={14} /> Wandr Premium
          </span>
          <h2 className="pb-title">Votre compagnon d&apos;activité, propulsé par l&apos;IA.</h2>
          <p className="pb-sub">
            Planifiez vos sorties en discutant, trouvez l&apos;activité parfaite selon vos envies,
            et laissez Wandr veiller sur ce qui compte pour vous.
          </p>
          <div className="pb-feats">
            <div className="pb-feat">
              <span className="ico">
                <Icon name="chat" size={16} />
              </span>{' '}
              Planifiez un voyage en conversation
            </div>
            <div className="pb-feat">
              <span className="ico">
                <Icon name="compass" size={16} />
              </span>{' '}
              Des suggestions selon vos critères
            </div>
            <div className="pb-feat">
              <span className="ico">
                <Icon name="calendar" size={16} />
              </span>{' '}
              Suivi quotidien de 3 activités
            </div>
          </div>
          <div className="pb-cta-row">
            <button className="btn-primary" onClick={() => setOpen(true)}>
              Découvrir Premium <Icon name="arrow-right" size={16} />
            </button>
            <div className="pb-price">
              À partir de <b>9,99 $ / mois</b>
            </div>
          </div>
        </div>
        <div className="pb-aside">
          <div className="pb-chat">
            <div className="pb-chat-head">
              <span className="pb-chat-avatar">
                <Icon name="sparkle" size={17} />
              </span>
              <div className="pb-chat-id">
                <span className="pb-chat-name">Compagnon Wandr</span>
                <span className="pb-chat-status">
                  <span className="live" /> En ligne
                </span>
              </div>
            </div>
            <div className="bubble ai">Que cherchez-vous à faire ce week-end&nbsp;?</div>
            <div className="bubble me">Plein air, près du fleuve, moins de 40&nbsp;$</div>
            <div className="bubble ai">Voici une idée qui correspond — au coucher du soleil&nbsp;:</div>
            <div className="pb-pick">
              <span className="pb-pick-img" style={{ backgroundImage: `url(${PREMIUM_PICK_IMG})` }} />
              <span className="pb-pick-tx">
                <b>Belvédère du Mont-Royal</b>
                <span>Plateau · Gratuit</span>
              </span>
              <span className="pb-pick-go">
                <Icon name="arrow-right" size={16} />
              </span>
            </div>
            <div className="pb-track">
              <span className="pb-track-l">
                <Icon name="calendar" size={15} /> Suivi quotidien
              </span>
              <span className="pb-track-dots">
                <i />
                <i />
                <i className="off" />
              </span>
            </div>
          </div>
        </div>
      </div>
      {open && <PremiumModal onClose={() => setOpen(false)} />}
    </section>
  );
}
```

- [ ] **Step 3: Verify (not yet mounted — compiles standalone)**

Run: `pnpm type-check && pnpm dep:check && pnpm lint`
Expected: PASS. `dep:check` confirms `shared/ui/Premium` imports no DTO.

- [ ] **Step 4: Commit**

```bash
git add src/shared/ui/Premium.tsx src/app/globals.css
git commit -m "feat(premium): brushed upsell band + recap modal (shared/ui)"
```

---

## Task 7: SiteFooter + social glyphs

**Files:**
- Modify: `src/shared/ui/icons/Icon.tsx` (add `instagram`, `facebook`, `x`)
- Create: `src/shared/ui/SiteFooter.tsx`
- Modify: `src/app/globals.css` (append footer block)

- [ ] **Step 1: Add three social glyphs to `IconName` and the switch**

In `src/shared/ui/icons/Icon.tsx`, add to the `IconName` union (after `'close'`, before the `;`):

```ts
  | 'instagram'
  | 'facebook'
  | 'x'
```

Then add these three cases to the `switch` (just before `default:`):

```tsx
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M14 8.5h2.2V5.4h-2.4c-2 0-3.3 1.3-3.3 3.4v1.9H8.3v3h2.2V21h3.2v-7.3h2.3l.5-3h-2.8V9.1c0-.4.3-.6.7-.6Z" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4 4 20" />
        </svg>
      );
```

- [ ] **Step 2: Add the footer CSS block**

Append to `src/app/globals.css`:

```css
/* ===========================================================
   SITE FOOTER — multi-column dark footer
   =========================================================== */
.site-footer {
  background: var(--ink-950); color: var(--silver-400);
  border-top: 1px solid var(--line-dark); position: relative; z-index: 1;
}
.site-footer-inner {
  max-width: var(--content-max); margin: 0 auto; padding: 72px 48px 40px;
  display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 40px;
}
.footer-brand .footer-word { font-size: 22px; font-weight: 600; color: var(--silver-100); display: inline-block; margin-bottom: 18px; }
.footer-brand p { color: var(--smoke-2); font-size: 14px; line-height: 1.6; max-width: 240px; margin: 0; }
.footer-col h4 { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--smoke-2); margin: 0 0 18px; }
.footer-col a { display: block; font-size: 14px; color: var(--silver-400); padding: 7px 0; transition: color .2s; }
.footer-col a:hover { color: var(--white); }
.footer-social { display: flex; gap: 10px; }
.footer-social a {
  width: 40px; height: 40px; border-radius: 999px; border: 1px solid var(--line-dark-2);
  display: inline-flex; align-items: center; justify-content: center; color: var(--silver-400);
  transition: background .2s, color .2s;
}
.footer-social a:hover { background: rgba(255,255,255,0.08); color: var(--white); }
.footer-bar {
  max-width: var(--content-max); margin: 0 auto; padding: 22px 48px;
  border-top: 1px solid var(--line-dark);
  display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: var(--smoke);
}
.footer-bar .links { display: flex; gap: 26px; }
.footer-bar a:hover { color: var(--silver-300); }
@media (max-width: 900px) {
  .site-footer-inner { grid-template-columns: 1fr 1fr; }
  .site-footer-inner, .footer-bar { padding-left: 24px; padding-right: 24px; }
}
@media (max-width: 560px) {
  .site-footer-inner { grid-template-columns: 1fr; }
  .footer-bar { flex-direction: column; gap: 12px; }
}
```

- [ ] **Step 3: Implement `SiteFooter.tsx`**

Create `src/shared/ui/SiteFooter.tsx`:

```tsx
import Link from 'next/link';

import { Icon } from './icons/Icon';

const EXPLORE = [
  { label: 'Accueil', href: '/' },
  { label: 'Sport', href: '/sport' },
  { label: 'Gastronomie', href: '/dining' },
  { label: 'Culture', href: '/culture' },
  { label: 'Plein air', href: '/outdoor' },
];
const ABOUT = [
  { label: 'Notre mission', href: '/' },
  { label: 'Premium', href: '/' },
  { label: 'Calendrier', href: '/calendar' },
  { label: 'Assistant', href: '/chat' },
];

/**
 * Multi-column site footer. DTO-free chrome → shared/ui. Internal links use
 * next/link; the social links are inert placeholders for the POC.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <span className="footer-word">wandr</span>
          <p>
            Le meilleur de Montréal, choisi à la main — activités, sorties et découvertes au fil de
            vos envies.
          </p>
        </div>
        <div className="footer-col">
          <h4>Explorer</h4>
          {EXPLORE.map((l) => (
            <Link key={l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>À propos</h4>
          {ABOUT.map((l) => (
            <Link key={l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="footer-col">
          <h4>Suivez-nous</h4>
          <div className="footer-social">
            <a href="#" aria-label="Instagram">
              <Icon name="instagram" size={18} />
            </a>
            <a href="#" aria-label="Facebook">
              <Icon name="facebook" size={18} />
            </a>
            <a href="#" aria-label="X">
              <Icon name="x" size={18} />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bar">
        <span>© {new Date().getFullYear()} Wandr · Montréal</span>
        <div className="links">
          <a href="#">Confidentialité</a>
          <a href="#">Conditions</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Verify**

Run: `pnpm type-check && pnpm dep:check && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/icons/Icon.tsx src/shared/ui/SiteFooter.tsx src/app/globals.css
git commit -m "feat(footer): multi-column SiteFooter + instagram/facebook/x glyphs"
```

---

## Task 8: Mount Premium + SiteFooter in the layout; remove FooterBanner

**Files:**
- Modify: `src/app/(with-sidebar)/layout.tsx`
- Modify: `src/app/(with-sidebar)/page.tsx` (drop `FooterBanner`)
- Delete: `src/shared/ui/FooterBanner.tsx`
- Delete: `src/shared/ui/decor/FooterSkyline.tsx`

> Decision D1: Premium + Footer render once for the whole `(with-sidebar)` group (Home, all 6 categories, Favorites, Calendar). `FooterSkyline` is imported only by `FooterBanner`.

- [ ] **Step 1: Mount Premium + SiteFooter in the shared layout**

Replace `src/app/(with-sidebar)/layout.tsx` with:

```tsx
import type { ReactNode } from 'react';

import { listNeighborhoods } from '../../modules/activities/web/listNeighborhoods';
import { TopFilters } from '../../modules/filters/web/TopFilters';
import { OnboardingGate } from '../../modules/profile/web/OnboardingGate';
import { requireSession } from '../../shared/auth/require-session';
import { prisma } from '../../shared/db/prisma';
import { Premium } from '../../shared/ui/Premium';
import { SiteFooter } from '../../shared/ui/SiteFooter';
import { SmoothScroll } from '../../shared/ui/SmoothScroll';

export default async function WithSidebarLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const [user, neighborhoods] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { onboardedAt: true, cityId: true },
    }),
    listNeighborhoods(),
  ]);

  return (
    <SmoothScroll>
      <TopFilters neighborhoods={neighborhoods} />
      <div className="shell">
        <main className="main">{children}</main>
        <Premium />
      </div>
      <SiteFooter />
      <OnboardingGate onboardedAt={user.onboardedAt} cityId={user.cityId} />
    </SmoothScroll>
  );
}
```

> `Premium` sits inside `.shell` (so it shares the centered content column + rail offset); `SiteFooter` is full-bleed outside `.shell`.

- [ ] **Step 2: Drop `FooterBanner` from the Home page**

In `src/app/(with-sidebar)/page.tsx`:
- Remove the import line `import { FooterBanner } from '../../shared/ui/FooterBanner';`
- Remove the `<FooterBanner />` element from the returned JSX (last child).

- [ ] **Step 3: Delete `FooterBanner` + `FooterSkyline`**

```bash
git rm src/shared/ui/FooterBanner.tsx src/shared/ui/decor/FooterSkyline.tsx
```

- [ ] **Step 4: Verify**

Run: `pnpm type-check && pnpm dep:check && pnpm lint && pnpm build`
Expected: PASS, no dangling `FooterBanner`/`FooterSkyline` references. Visual check: every `(with-sidebar)` page now ends with the Premium band then the dark multi-column footer; the old "Make every day an adventure" banner is gone.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(layout): mount Premium + SiteFooter group-wide; drop FooterBanner"
```

---

## Task 9: Nav dropdown color fix + brand polish (D9)

**Files:**
- Modify: `src/shared/ui/Nav.tsx`

> Keep the existing structure (primary links inline + overflow behind the burger, both derived from `CATEGORY_PRESETS`). The only functional bug is the overflow dropdown background = `--offwhite` (light), which hides the light `.nav-link` text. Swap it to the charcoal `--panel` surface.

- [ ] **Step 1: Recolor the overflow dropdown to the charcoal panel**

In `src/shared/ui/Nav.tsx`, in the overflow dropdown `style={{…}}` object (currently lines 83-96), replace the `background` and `border` lines:

```tsx
                  background: 'var(--panel)',
                  border: '1px solid var(--line-dark)',
```

(Leave the rest of the style object — `borderRadius`, `boxShadow`, `padding`, layout — unchanged. The dropdown `.nav-link` items already use the bar's light link color, so they now read against charcoal.)

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm dep:check && pnpm lint`
Expected: PASS. Visual check: open the "More" (burger) menu — the romantic/overflow links are now legible light text on a charcoal panel, matching the bar.

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/Nav.tsx
git commit -m "fix(nav): charcoal overflow dropdown so light links read (D9)"
```

---

## Task 10: MapView extensions — scrollZoom, active highlight, recenter

**Files:**
- Modify: `src/modules/activities/web/Map/MapView.tsx`
- Modify: `src/app/globals.css` (active-pin style)

> Additive: existing callers (`ActivityModal`, current `MapSection`) keep working with no changes. New props are all optional.

- [ ] **Step 1: Add the active-pin CSS**

Append to `src/app/globals.css`:

```css
/* Active (selected) map pin — distinct from idle pins. */
.map-pin.active .pin-bubble { background: var(--ink-900); border-color: var(--white); transform: rotate(-45deg) scale(1.18); }
.map-pin.active { z-index: 4; }
```

- [ ] **Step 2: Extend `MapView` with `scrollZoom`, `activeId`, and an imperative `flyTo` handle**

Replace `src/modules/activities/web/Map/MapView.tsx` with:

```tsx
'use client';

import 'maplibre-gl/dist/maplibre-gl.css';

import { forwardRef, useImperativeHandle, useRef, type ReactElement } from 'react';
import { Map, type MapRef, Marker, NavigationControl } from 'react-map-gl/maplibre';

import { Icon } from '../../../../shared/ui/icons/Icon';

export type MapMarkerColor = 'orange' | 'blue' | 'me';

export type MapMarkerData = {
  id: string;
  lng: number;
  lat: number;
  label?: string;
  color?: MapMarkerColor;
  onClick?: () => void;
};

export type MapViewHandle = {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
};

type MapViewProps = {
  center: { lng: number; lat: number };
  zoom?: number;
  markers?: MapMarkerData[];
  height?: number | string;
  showControls?: boolean;
  interactive?: boolean;
  /** When false, the mouse wheel does not zoom the map (page scrolls instead). */
  scrollZoom?: boolean;
  /** Marker id to render in the highlighted/active state. */
  activeId?: string;
  className?: string;
};

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    center,
    zoom = 12,
    markers = [],
    height = '100%',
    showControls = true,
    interactive = true,
    scrollZoom,
    activeId,
    className,
  },
  ref,
): ReactElement {
  const mapRef = useRef<MapRef | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (lng, lat, z) => {
        const map = mapRef.current;
        if (!map) return;
        map.flyTo({ center: [lng, lat], zoom: z ?? map.getZoom(), duration: 800 });
      },
    }),
    [],
  );

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{ compact: true }}
        interactive={interactive}
        scrollZoom={scrollZoom}
      >
        {showControls ? <NavigationControl position="bottom-right" showCompass={false} /> : null}
        {markers.map((m) => (
          <Marker
            key={m.id}
            longitude={m.lng}
            latitude={m.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              m.onClick?.();
            }}
          >
            <MarkerVisual
              color={m.color ?? 'orange'}
              clickable={Boolean(m.onClick)}
              active={m.id === activeId}
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
});

function MarkerVisual({
  color,
  clickable,
  active,
}: {
  color: MapMarkerColor;
  clickable: boolean;
  active: boolean;
}): ReactElement {
  if (color === 'me') {
    return <span className="map-dot-me" style={{ position: 'relative', transform: 'none' }} />;
  }
  return (
    <span
      className={'map-pin ' + color + (active ? ' active' : '')}
      style={{ position: 'relative', transform: 'none', cursor: clickable ? 'pointer' : 'default' }}
    >
      <span className="pin-bubble">
        {color === 'orange' ? <Icon name="fire" size={14} /> : <Icon name="pin" size={13} />}
      </span>
    </span>
  );
}
```

> If `scrollZoom` is `undefined`, react-map-gl uses its default (enabled) — preserving current behavior for `ActivityModal` (which passes `interactive={false}`, so wheel-zoom is moot) and any other caller. `MapRef` is the standard react-map-gl ref type; if the import name differs in the installed version, use `import type { MapRef } from 'react-map-gl/maplibre'` exactly as written here.

- [ ] **Step 3: Verify (existing callers still compile)**

Run: `pnpm type-check && pnpm dep:check && pnpm lint && pnpm build`
Expected: PASS. Visual check: the activity modal mini-map + the current home map still render unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/modules/activities/web/Map/MapView.tsx src/app/globals.css
git commit -m "feat(map): MapView scrollZoom + active-pin highlight + flyTo handle"
```

---

## Task 11: Stateful map-explorer rework (`MapSection`) — D6/D7/D8

**Files:**
- Modify: `src/modules/activities/web/MapSection.tsx` (full rework)
- Modify: `src/app/globals.css` (append map-explorer block)

State machine (spec §9): **Repos** = full-width map, wheel→page scroll, pins for ≤24 nearby activities. **Open** (click a pin) = map shrinks, an activity volet (a reused Tuile) slides in on the right, clicked pin highlights, map activates (wheel zooms) and `flyTo`s the activity. **Volet = carousel** (← →) cycling pinned activities, each change re-highlights + recenters. **Close** (Escape / ✕ / click map background / click outside the block) = volet closes, map back to full width + deactivates. **<900px** = volet stacks under the map.

- [ ] **Step 1: Add the map-explorer CSS**

Append to `src/app/globals.css`:

```css
/* ===========================================================
   MAP EXPLORER — full-width map that shrinks for a volet carousel
   =========================================================== */
.map-explorer { position: relative; z-index: 1; margin-bottom: 80px; }
.map-explorer-head {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px;
}
.map-explorer-head .feed-eyebrow { margin-bottom: 11px; }
.map-explorer-head h2 {
  font-family: var(--font); font-weight: 300; font-size: 32px;
  letter-spacing: -0.03em; line-height: 1; color: var(--ink-900); margin: 0;
}
.map-explorer-head p { margin: 6px 0 0; color: var(--smoke); font-size: 14px; }
.map-explorer-stage { display: flex; gap: 0; transition: gap .5s var(--ease); align-items: stretch; }
.map-explorer-stage.open { gap: 20px; }
.map-explorer-map {
  position: relative; flex: 1 1 auto; height: 480px;
  border-radius: 20px; overflow: hidden; border: 1px solid var(--line);
  background: var(--surface-3);
}
.map-volet {
  position: relative; flex: 0 0 0; width: 0; opacity: 0; overflow: hidden;
  transition: flex-basis .5s var(--ease), width .5s var(--ease), opacity .35s var(--ease);
  display: flex; flex-direction: column; gap: 14px;
}
.map-explorer-stage.open .map-volet { flex: 0 0 360px; width: 360px; opacity: 1; }
.map-volet-card { flex: 1; min-height: 0; }
.map-volet-card .tuile { height: 100%; aspect-ratio: auto; }
.map-volet-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.map-volet-count { font-size: 12.5px; color: var(--smoke); letter-spacing: 0.04em; }
.map-volet-btns { display: flex; gap: 8px; }
.map-volet-btn {
  width: 40px; height: 40px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--white); border: 1px solid var(--line-2); color: var(--ink-800);
  transition: background .15s, transform .15s;
}
.map-volet-btn:hover { background: var(--silver-100); transform: translateY(-1px); }
.map-volet-close {
  position: absolute; top: 10px; right: 10px; z-index: 5;
  width: 34px; height: 34px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(8,8,8,0.42); color: var(--white);
  border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(8px);
}
.map-volet-close:hover { background: rgba(8,8,8,0.62); }
@media (max-width: 900px) {
  .map-explorer-stage, .map-explorer-stage.open { flex-direction: column; gap: 16px; }
  .map-explorer-map { height: 340px; }
  .map-explorer-stage.open .map-volet { flex: 0 0 auto; width: 100%; }
  .map-volet-card .tuile { aspect-ratio: 4 / 3.15; height: auto; }
}
```

- [ ] **Step 2: Rework `MapSection` into the stateful explorer**

Replace `src/modules/activities/web/MapSection.tsx` with:

```tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import { Icon } from '../../../shared/ui/icons/Icon';
import { CoverActivityCard } from './cards/CoverActivityCard';
import { MapView, type MapMarkerData, type MapViewHandle } from './Map/MapView';

type MapSectionProps = {
  nearbyActivities: ActivityDTO[];
};

const MONTREAL_CENTER = { lng: -73.5674, lat: 45.5019 };
const MARKER_CAP = 24;

export function MapSection({ nearbyActivities }: MapSectionProps) {
  const mapRef = useRef<MapViewHandle | null>(null);
  const blockRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const pins = useMemo(
    () =>
      nearbyActivities
        .filter((a) => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
        .slice(0, MARKER_CAP),
    [nearbyActivities],
  );

  const open = activeIndex !== null;
  const activeActivity = open ? pins[activeIndex] : null;

  const close = useCallback(() => setActiveIndex(null), []);

  const goTo = useCallback(
    (index: number) => {
      const next = (index + pins.length) % pins.length;
      setActiveIndex(next);
      const a = pins[next];
      mapRef.current?.flyTo(a.longitude, a.latitude, 14);
    },
    [pins],
  );

  // Escape closes; click outside the block closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onDown = (e: MouseEvent) => {
      if (blockRef.current && !blockRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, close]);

  const markers: MapMarkerData[] = pins.map((a, i) => ({
    id: a.id,
    lng: a.longitude,
    lat: a.latitude,
    label: a.title,
    color: a.kind === 'EVENT' ? 'orange' : 'blue',
    onClick: () => goTo(i),
  }));

  if (markers.length === 0) return null;

  return (
    <section className="map-explorer" ref={blockRef}>
      <div className="map-explorer-head">
        <div>
          <div className="feed-eyebrow">Sur la carte</div>
          <h2>Explorez autour de vous</h2>
          <p>Des activités triées sur le volet à Montréal — cliquez sur un point pour l&apos;ouvrir.</p>
        </div>
      </div>

      <div className={'map-explorer-stage' + (open ? ' open' : '')}>
        <div
          className="map-explorer-map"
          data-lenis-prevent-wheel={open ? '' : undefined}
          onClick={(e) => {
            // Click on the map background (not a pin) closes the volet.
            if (open && e.target === e.currentTarget) close();
          }}
        >
          <MapView
            ref={mapRef}
            center={MONTREAL_CENTER}
            zoom={12}
            markers={markers}
            scrollZoom={open}
            activeId={activeActivity?.id}
          />
        </div>

        <aside className="map-volet" aria-hidden={!open}>
          {activeActivity && (
            <>
              <button className="map-volet-close" onClick={close} aria-label="Fermer">
                <Icon name="close" size={16} stroke={2.2} />
              </button>
              <div className="map-volet-card">
                <CoverActivityCard activity={activeActivity} showPrice />
              </div>
              <div className="map-volet-nav">
                <span className="map-volet-count">
                  {activeIndex! + 1} / {pins.length}
                </span>
                <div className="map-volet-btns">
                  <button
                    className="map-volet-btn"
                    onClick={() => goTo(activeIndex! - 1)}
                    aria-label="Précédent"
                  >
                    <Icon name="chev-left" size={18} />
                  </button>
                  <button
                    className="map-volet-btn"
                    onClick={() => goTo(activeIndex! + 1)}
                    aria-label="Suivant"
                  >
                    <Icon name="chev-right" size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
```

> Behaviour notes: clicking a pin calls `goTo(i)` → sets the active index, highlights that pin (`activeId`), and `flyTo`s it. `scrollZoom={open}` activates wheel-zoom only while the volet is open; `data-lenis-prevent-wheel` is set only while open so Lenis stops hijacking the wheel into page scroll. Clicking the volet's Tuile opens the `ActivityModal` (via `CoverActivityCard`'s built-in `useOpenActivity`). Close paths: Escape, the ✕, the map background, or a click outside the whole block.

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm dep:check && pnpm lint && pnpm build`
Expected: PASS. Visual check on Home + `/sport`:
- Repos: full-width map, wheel scrolls the page.
- Click a pin → map shrinks left, volet slides in, pin highlights, map recenters, wheel now zooms the map.
- ← → cycles activities (pin + center follow); clicking another pin jumps the volet.
- Click the volet card → activity modal opens.
- Escape / ✕ / map background / outside click → volet closes, map back to full width, wheel scrolls the page again.
- Narrow the window < 900px → volet stacks under the map.

- [ ] **Step 4: Commit**

```bash
git add src/modules/activities/web/MapSection.tsx src/app/globals.css
git commit -m "feat(map): stateful map-explorer with carousel volet (D6/D7/D8)"
```

---

## Task 12: French pass on the ActivityModal

**Files:**
- Modify: `src/modules/activities/web/ActivityModal/ActivityModal.tsx`

- [ ] **Step 1: Translate the modal strings + price/date helpers**

In `src/modules/activities/web/ActivityModal/ActivityModal.tsx`:

1. `formatPrice` (lines 16-24): change `unit: 'Free entry'` → `unit: 'Entrée gratuite'`; change the paid returns to `\`${min} $+\`` and `\`${min}–${max} $\``.
2. `formatWhen` (lines 26-37): change `'Open daily'` → `'Ouvert tous les jours'`; change `toLocaleString('en-US', …)` → `toLocaleString('fr-CA', …)`.
3. Badge/labels in the JSX:
   - `Featured` → `À la une`
   - `Trending` (flames pill) → `Tendance`
   - `About this activity` → `À propos de cette activité`
   - `Good to know` → `Bon à savoir`
   - `When` → `Quand`, `Neighborhood` → `Quartier`, `Setting` → `Cadre`, `Type` → `Type`
   - Setting values: `Indoor & outdoor` → `Intérieur et extérieur`, `Indoor` → `Intérieur`, `Outdoor` → `Extérieur`
   - Type values: `Event` → `Événement`, `Place` → `Lieu`
   - `Location` → `Emplacement`
   - `Get directions` → `Itinéraire`
   - `See site` → `Voir le site`
   - `Book this` → `Réserver`

(Apply the matching string replacements; structure and props are unchanged.)

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm dep:check && pnpm lint`
Expected: PASS. Visual check: open any activity → modal copy is fully French; price renders e.g. `45 $+`.

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/web/ActivityModal/ActivityModal.tsx
git commit -m "feat(modal): French copy + price/date locale in ActivityModal"
```

---

## Task 13: Hero CSS reconcile + final gate + cleanup

**Files:**
- Modify: `src/app/globals.css` (hero values, if drift found)
- Modify: `tbd.md`
- Delete: `.design-tmp/`

- [ ] **Step 1: Reconcile drifting hero CSS values**

Read the prototype hero block at `.design-tmp/wandr-silverblackmode/project/styles.css` (the `/* ---------- HERO ---------- */` section, ~lines 225-295) and compare the dot/pill values against the live `.featured-hero-*` rules in `globals.css` (search `featured-hero-dot`). The known drift is the active indicator width: prototype `.hero-dot.active { width: 26px; background: var(--silver-200); }` vs the current `.featured-hero-dot.active { width: 28px; background: var(--offwhite); }`. Only adjust **indicator/pill** values to match the prototype if they visibly differ; do **not** restructure the hero (no data/markup change per spec §7). If no visible drift remains, make no change and note it.

- [ ] **Step 2: Run the full verification gate**

Run: `pnpm type-check && pnpm dep:check && pnpm test && pnpm lint && pnpm build`
Expected: ALL PASS. Then a final visual pass of Home + each of the 6 category pages + Favorites + Calendar: nav, hero, map-explorer, three-card feed, premium band/modal, footer all render in the SilverBlackMode language, fully French.

- [ ] **Step 3: Update `tbd.md`**

In `src/`… actually `tbd.md` at repo root. Update the deferral that no longer applies and record the new decisions:
- In `## Future changes`, edit the "Retire the `design-showcase` palette" bullet: the route + legacy cards are now **deleted** (Task 5); keep only the still-deferred "per-category section overrides" part.
- Add to `## Hardcoded`: a bullet noting the SilverBlackMode reskin token additions live in `globals.css :root` (Task 1) and that `--smoke`/`--line*`/`--shadow-*` intentionally kept their pre-existing values rather than the prototype's near-identical ones. Reference `src/app/globals.css`.
- Add to `## Hardcoded`: the Premium copy/price (`9,99 $/mois`), the AI-companion preview content, and the inert social links in `SiteFooter` are static placeholders for the POC. Reference `src/shared/ui/Premium.tsx`, `src/shared/ui/SiteFooter.tsx`.
- Add to `## Hardcoded`: the Imageless-card French category labels live in `cards/categoryMeta.ts` (not `CATEGORY_OPTIONS`, which is English); reconcile if a shared i18n category label source ever exists.

- [ ] **Step 4: Delete the prototype reference bundle**

```bash
git rm -r .design-tmp
```

(Also remove the `wandr-design` temp-handoff folder reference only if it is the same `.design-tmp/` — per the memory, that prototype is throwaway and never imported. Confirm nothing in `src/` resolves into `.design-tmp/`: `grep -rn "design-tmp" src/` must return nothing.)

- [ ] **Step 5: Final verification after cleanup**

Run: `grep -rn "design-tmp" src/ ; pnpm build`
Expected: grep returns nothing; build PASSES.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: hero reconcile, tbd updates, drop .design-tmp prototype bundle"
```

---

## Self-review (spec coverage)

- §3 D1 Premium+Footer+Modal in shared layout → Tasks 6, 7, 8 ✓
- §3 D2 Imageless = paper light → Task 3 ✓
- §3 D3 French + coherence → Tasks 2 (helpers), 12 (modal), 11 (map copy), 6/7 (new copy) ✓
- §3 D4 feed-card actions (fav on Tuile+Imageless; Feature=price+Découvrir; calendar in modal) → Task 4 ✓
- §3 D5 eyebrow+title, no "Voir tout", optional `eyebrow` on spec → Task 4 ✓
- §3 D6/D7/D8 map rework → Tasks 10, 11 ✓
- §3 D9 nav dropdown charcoal → Task 9 ✓
- §3 D10 delete design-showcase → Task 5 ✓
- §3 D11 modal kept (feed + volet open it) → Tasks 4, 11 ✓
- §5 three cards (Tuile/Feature/Imageless) → Tasks 3, 4 ✓
- §5.4 delete Hero/Class cards → Task 5 ✓
- §6 feed composition (Feature anchor + routed grid; trailing grid; stanza removed) → Task 4 ✓
- §7 hero reconcile → Task 13 ✓
- §8 Premium band/modal + SiteFooter + 3 social glyphs → Tasks 6, 7 ✓
- §9 map block rework + §9.1 MapView extensions → Tasks 10, 11 ✓
- §10 nav → Task 9 ✓
- §11 all added/changed/deleted files accounted for (+ Task 1 tokens, the spec-omitted prerequisite) ✓
- §12 layer-DAG → `pnpm dep:check` gate every task ✓
- §13 verification commands → per-task gate + Task 13 full gate ✓
- §14 incremental order → Tasks ordered 1(tokens)→2→3→4→5→6/7/8→9→10/11→12→13, matching the spec sequence with tokens prepended ✓

**Placeholder scan:** no "TBD/TODO/handle edge cases" steps; every code/CSS step contains full content.
**Type consistency:** `MapViewHandle.flyTo(lng,lat,zoom?)` defined in Task 10 and called in Task 11; `categoryIconFor`/`categoryLabelFor` defined in Task 2 and consumed in Task 3; `flip`/`eyebrow` MediaRow props defined in Task 4 and used in Task 4's SectionedFeed; `favoriteSlot`-only Tuile signature consistent across Tasks 4 (SectionedFeed, FeedGrid) and 11 (map volet, no slot).
