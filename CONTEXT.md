# CONTEXT.md — Domain & composition vocabulary

Shared language for the codebase. Architecture rules live in `CLAUDE.md`; this file names the
concepts those rules operate on, so a reader (human or agent) can navigate without reverse-engineering
intent from the code. Keep entries short. Add a term the first time a module is named after it.

---

## Page

A navigable route. Per `CLAUDE.md` §4, a Page is a **thin composition of shared modules parameterized
by a preset** — never a place to copy a feature into. Pages live under `src/app/`.

## Preset

A per-page configuration object (`shared/presets/`). Holds data, no logic: base filters, which filters
are visible, hero copy, grid variant. A page differs from another page by its preset, not its code.

## Category page

The **uniform page shape** shared by every activity category (sport, dining, culture, outdoor,
nightlife, …): a hero followed by a single feed grid. It is rendered by **one** generic component
(`modules/feed/web/CategoryFeedPage`) served by **one** dynamic route
(`app/(with-sidebar)/[category]/page.tsx`), driven by **one** registry (`shared/presets/CATEGORY_PRESETS`).

> **Adding a category = adding one entry to `CATEGORY_PRESETS`. No new file.**

`isCategoryKey` is the guard the dynamic route uses; unknown segments `notFound()`.

## Documented page exceptions

One product route is intentionally **not** a category page:

- **Home** (`app/(with-sidebar)/page.tsx`) — bespoke: hero + map + recommendations + footer. Genuinely
  a different shape; stays hand-written.

## Design showcase (dev-only, not a product route)

`app/(with-sidebar)/design-showcase/page.tsx` displays every activity-card variant as a design palette.
It is **not a product page** — it is a living reference for picking which card styles to use when the
richer Category page design lands (see "Deferred" below). Do not treat it as the template for real
categories. `romantic` is a normal category served by the generic `[category]` route.

## Deferred: declarative section system

Today a Category page is hero + one grid. Richer multi-section layouts (see the Romantic showcase for the
card-variant palette) are **deferred** until the target design is decided — tracked in `tbd.md`. Do not
build a section-config DSL speculatively (`CLAUDE.md` §2).
