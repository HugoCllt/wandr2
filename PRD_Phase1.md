# PRD — Phase 1: Discovery Core

**Owner:** Hugo
**Stage:** personal POC, single locale, single seeded user
**Reference index:** `spec.md` (feature IDs F1–F13)
**Authority:** CLAUDE.md > ARCHITECTURE.md > this file

> Goal of P1: a developer logged in as the seeded user can land on `/`, scan a curated list of Montréal activities, filter and search, open a detail page, save favorites, see activities on a map. Everything else is deferred.

---

## In scope

- Catalog: `Activity`, `Location`, `Source`, `IngestionJob`, `Review`, `Tag`, `EngagementEvent` (capture only).
- Feed engine with cursor pagination and the P1 ranker (`featured DESC, dateStart ASC, recencyDecayedSaveCount DESC`).
- Filters: price, distance, date, category, indoor/outdoor, free/paid. URL-serialized, instant.
- Search: trigram + naive intent parser (regex over date phrases, neighborhood, category).
- Map: Mapbox embed with pin/card sync, density clustering, mini overlay map on card.
- Activity detail at `/activity/[slug]` (full page, not a modal).
- Favorites: toggle, list, remove, persist.
- Home page `/` composing the shared `<PageShell>` with `HOME_PRESET`.
- Engagement event capture on view, click, save, search, filter (no consumer yet — read in P2).
- Cross-cutting: layer enforcement, schema validation, env validation, logger, axe-core a11y on critical routes.

## Out of scope (deferred)

| Item | Why | When |
|---|---|---|
| Trend Flame display & filter | No engagement signal yet | P2 |
| Sport / Romantic / Food / Profile pages | Phase 1 ships one page; the shared-modules thesis is proven by P2 adding three more without new modules | P2 |
| Chat | Requires LLM provider + cost caps + intent eval set | P3 |
| Real auth | Single seeded user is sufficient for POC | post-P3 |
| i18n | Single locale is sufficient for POC | post-P3 |
| Save filter presets | Polish, not core | post-P3 |
| Sharable favorites list | Polish | post-P3 |
| Similar activities on detail page | Reuses the feed engine but is detail-page polish | P2 |
| Reviews submission UI | Schema is ready, UI is P2 | P2 |
| Keyboard nav beyond focus traps and visible focus rings | Polish | P2 |
| Accessibility on every route | P1 enforces AA only on Home, Detail, Favorites | P2 expands |

---

## User stories

Numbered contiguously. Every story has an actor, an action, an acceptance criterion, and the engagement event it emits (if any).

### Discovery

1. **Browse the home feed.** As a visitor on `/`, I see up to 24 activities sorted by `featured DESC, dateStart ASC, recencyDecayedSaveCount DESC`. AC: page returns within p95 LCP < 2.5s on seeded data; no horizontal scroll at 1280px and 1024px. *Emits:* `VIEWED` per card that intersects the viewport for ≥ 500ms.

2. **Infinite scroll.** As a visitor, I scroll past the initial page and the next batch loads automatically using `nextCursor`. AC: no duplicate cards across batches; scroll position preserved on back-navigation.

3. **Sort the feed.** As a visitor, I choose between `featured`, `date`, `price`. AC: URL contains `?sort=`; reload preserves the sort.

4. **See an empty state.** As a visitor whose filters return zero results, I see a clear empty state with a "clear filters" affordance. AC: zero `flickering` between loading and empty states.

### Filtering

5. **Filter by price.** Free / <$20 / $20–$50 / $50+. Multi-select. AC: filter applies without a submit button; URL contains the filter; refresh preserves.

6. **Filter by distance.** Walking / 1km / 5km / 10km+. Requires browser geolocation; falls back to a manual neighborhood selector if the user denies. AC: distance is computed via PostGIS `ST_DWithin`.

7. **Filter by date.** Today / This week / This month / Upcoming. AC: respects the activity's `timezone` (Montréal) regardless of the visitor's timezone.

8. **Filter by category.** Multi-select over the `ActivityCategory` enum.

9. **Filter indoor / outdoor.** Single toggle.

10. **Filter free / paid.** Single toggle.

11. **Clear all filters.** Single click resets to the preset's `baseFilters`.

12. **Active filter count badge.** The filter button displays how many user filters are active (excluding `baseFilters`).

13. **Composable filters.** All filters compose with AND semantics across types, OR within a type.

14. **URL is shareable.** Pasting any filtered URL into a fresh tab restores the same view. AC: round-trip serialization unit tests cover every filter type.

### Search

15. **Search by free text.** As a visitor, I type into the navbar search and see ranked results. AC: server route `GET /api/search?q=…` returns the same `FeedResultDTO` shape as `/api/feed`.

16. **Search recognizes date phrases.** "tonight", "this weekend", "next friday" map to the same date filter the UI exposes. AC: a fixture set of 20 phrases passes; failures fall through to literal text search.

17. **Search recognizes neighborhoods.** "old montreal", "plateau", "mile end" are pulled out as a neighborhood filter, the rest as text. AC: case-insensitive; missing neighborhood falls through.

18. **Search recognizes categories.** "jazz", "padel", "yoga" map to category/sport filters when unambiguous.

### Activity card

19. **Card shape.** Each card shows: cover image (lazy, `next/image`), title, distance from user, price (or "Free"), date+time in Montréal local, save button, location button.

20. **Hover state.** Subtle lift + shadow per the design tokens. *Emits:* nothing; hover is not a tracked event.

21. **Click opens detail.** Card click navigates to `/activity/[slug]`. AC: scroll position on the feed preserved on back-navigation.

22. **Save toggles favorite.** Heart icon fills/empties; debounced API call; optimistic UI; rolls back on failure. *Emits:* `SAVED` or `UNSAVED`.

23. **Location button opens mini map.** Mini overlay shows the pin without leaving the page. AC: closable by Esc, X, or click outside.

24. **Card variants.** Three layouts (`hero`, `standard`, `compact`) selected by the preset section. All consume the same `ActivityCardVM`.

### Map

25. **Map renders.** `<MapSection>` renders activities currently in the visible feed slice as pins.

26. **Pin selects card.** Clicking a pin scrolls the feed to and highlights the matching card. The reverse is also true.

27. **Clusters on density.** Pins cluster at low zoom; clusters resolve as you zoom in. AC: cluster count visible.

28. **Geolocation prompt.** First visit prompts; denial falls back to a default Montréal centroid.

### Activity detail

29. **Detail page route.** `/activity/[slug]` is a real route, not a modal. AC: deep-linkable.

30. **Hero image, title, save button.** Above the fold.

31. **Body content.** Description, schedule (`dateStart` / `dateEnd` / `recurrence`), pricing breakdown, location with embedded map, external booking link.

32. **Reviews section.** Reads existing reviews; submission UI is P2.

33. **Similar activities placeholder.** Section is rendered with a "coming soon" state in P1; populated in P2.

### Favorites

34. **Favorites page.** `/favorites` lists saved activities using the same `<FeedGrid>`.

35. **Search within favorites.** Reuses the search module, scoped to the user's favorites.

36. **Filter favorites.** Reuses the filter module.

37. **Remove a favorite.** Heart toggle works on the favorites page; row disappears with a smooth transition.

38. **Persistence.** Favorites survive page reload (DB-backed, not local storage).

### Cross-cutting

39. **Logger.** Every API request carries a `requestId` propagated to the response header `x-request-id`. AC: log lines include `{ requestId, userId, module, event }`.

40. **Env validation.** Boot fails fast if `DATABASE_URL` is missing or malformed.

41. **Layer enforcement.** A deliberately-introduced `domain → infra` import fails `pnpm dep:check` in CI.

42. **Schema validation.** `pnpm prisma validate` is part of the lint stage.

43. **Accessibility.** Home, detail, favorites pass `axe-core` AA in Playwright. Focus is trapped inside open dialogs (mini map). Visible focus ring on every interactive element.

---

## Acceptance gates (CI must pass)

- `pnpm type-check` — clean.
- `pnpm lint` — clean.
- `pnpm format:check` — clean.
- `pnpm dep:check` — clean (and a deliberately-bad import fails).
- `pnpm prisma validate` — clean.
- `pnpm test` (vitest) — domain ≥ 90% line, application ≥ 80% line on changed modules.
- `pnpm test:e2e` (playwright) — happy paths for Home, Detail, Favorites, Search.
- `axe-core` — zero serious or critical violations on Home, Detail, Favorites.

## Performance gates (dev targets, M2 macbook, throttled "Fast 4G")

- p95 LCP on `/` < 2.5s.
- Initial JS on `/` < 200 KB.
- p95 latency on `/api/feed` and `/api/search` < 200ms against seeded data.

## Telemetry contract

P1 captures, does not consume. The following events are written to `EngagementEvent` so P2 can rank from real signal:

| Event | When | Payload |
|---|---|---|
| `VIEWED` | Card intersects viewport ≥ 500ms | `{ activityId, position, source: 'feed' \| 'search' \| 'favorites' }` |
| `CLICKED` | Card click | `{ activityId, source }` |
| `SAVED` / `UNSAVED` | Toggle | `{ activityId }` |
| `SHARED` | Native share sheet invoked | `{ activityId }` (P1.5) |
| `SEARCHED` | Search submit | `{ query, parsedFilters }` |
| `FILTERED` | Any filter change | `{ filters }` |

The schema (`EngagementEvent.payload: Json`) admits new event types without migration.

## Definition of done

P1 is done when:

1. A fresh clone running STEP_ZERO §4 yields a Home page at `/` with seeded activities.
2. Every gate above is green in CI for at least one PR.
3. The deliberately-bad-import test in STEP_ZERO §5 step 8 still fails as expected.
4. `EngagementEvent` rows accumulate as a developer browses for 5 minutes — proven by a SQL query against the dev DB.

That is the line. Anything richer waits for P2.
