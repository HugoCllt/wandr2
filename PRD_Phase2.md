# PRD — Phase 2: Verticals, Engagement, Profile

**Owner:** Hugo
**Prerequisite:** P1 shipped, `EngagementEvent` accumulating real data for ≥ 14 days
**Reference index:** `spec.md` (feature IDs F1–F13)
**Authority:** CLAUDE.md > ARCHITECTURE.md > this file

> Goal of P2: prove the shared-modules thesis by adding three new pages (Sport, Romantic, Food) with **zero new modules** — only presets and route files. Light up the trend flame using real engagement data captured in P1. Add a profile page summarizing what the user has done.

---

## In scope

- Three new pages: `/sport`, `/romantic`, `/food`. Each is a preset + a route file. Nothing else.
- Trend Flame computation (nightly), display on cards, filter by flame level.
- Profile page `/profile` with stats, category breakdown, quick actions to Favorites and Preferences.
- Reviews submission UI on the activity detail page. (Schema already exists from P1.)
- Similar activities section on the activity detail page (uses the existing feed engine).
- Engagement event retention job (90-day TTL, runs nightly).

## Out of scope (deferred)

| Item | Why | When |
|---|---|---|
| Chat | Distinct phase | P3 |
| Personalized recommendations | Needs the affinity model | P3 |
| Real auth | Still POC | post-P3 |
| i18n | Still POC | post-P3 |
| Eventbrite/Ticketmaster connectors | Still on the manual seed | post-P3 |
| Background-job framework (Inngest, Trigger.dev) | A `node-cron` invocation triggered by Vercel Cron is enough at POC scale | P3+ |

---

## Numbering

P1 ended at story 43. P2 continues at 44.

## User stories

### Sport / Romantic / Food verticals (no new modules)

44. **Sport route.** `/sport` renders `<PageShell preset={SPORT_PRESET} />`. The preset's `baseFilters` constrain to `category IN (SPORT)`. AC: route file is < 20 LOC; no new component imports.

45. **Romantic route.** `/romantic` with `ROMANTIC_PRESET`. AC: same as 44.

46. **Food route.** `/food` with `FOOD_PRESET`. AC: same as 44.

47. **Preset deliverable check.** Each preset specifies `feed.baseFilters`, `feed.visibleFilters`, `feed.defaultSort`, `sections`, `copy`. Adding a vertical introduces no new use case, no new repository, no new UI primitive. AC: a code-review checklist enforces this.

48. **Sport-specific filters surface via preset.** Sport type (`hockey`, `padel`, `yoga`, …) and sport level. Same filter primitives in `modules/filters` — the preset declares which are visible.

49. **Deal badges.** When `Activity.dealKind` is set, the card renders the corresponding badge (`-20%`, `2-for-1`, `Limited`, `Early bird`, `Free`). One badge component, used everywhere.

### Trend Flame

50. **Flame domain model.** A flame level is `LOW | MEDIUM | FULL | SUPER`. Inputs: views, saves, recency. Implementation lives in `modules/feed/application/ranking/flame.ts`.

51. **Score formula (transparent).** `flameScore = 0.4·zViews + 0.4·zSaves + 0.2·zRecency`, where `z…` are activity-percentile-normalized over the last 30 days. Cold-start prior: source-category median. Stored in `Activity.flameScore`; bucketed to `flameLevel` by quartile.

52. **Nightly computation.** A `node-cron` job at 03:00 America/Toronto recomputes `flameScore`/`flameLevel` for all `PUBLISHED` activities. AC: runtime < 60s on a 10k-activity table; logs `{ scanned, updated, durationMs }`.

53. **Flame display.** Cards and detail pages show the flame as a partially-filled icon. AC: visual regression covers each level.

54. **Filter by flame.** Filter UI exposes a single toggle "Trending+" that maps to `flameLevel IN (FULL, SUPER)`. AC: the filter URL-serializes like any other.

55. **Cold-start safety.** A new activity with zero engagement defaults to its source-category median flame, never `LOW` purely from absence of signal.

### Reviews

56. **Submit a review.** From the activity detail page, the seeded user can submit a 1–5 star rating with an optional body. AC: enforces `Review.@@unique([userId, activityId])`; idempotent updates.

57. **Aggregate rating.** The detail page shows average rating and count. AC: aggregation uses `Review` index `(activityId, rating)`.

58. **Edit/delete own review.** The seeded user can amend or delete their own review. AC: cascade rules from `SCHEMA.md` apply.

### Profile

59. **Profile route.** `/profile` shows: avatar placeholder, display name, "vibe line" (free text 80 chars), stats block, category breakdown chart, quick actions.

60. **Stats block.** Counts of `viewed`, `saved`, `monthly outings` (defined as: distinct activities with `dateStart` within the trailing 30 days that the user `SAVED` or `BOOKED_OUT`'d), top category. AC: queries are computed on the fly from `EngagementEvent` + `Favorite`; no new aggregates table yet.

61. **Category breakdown chart.** Donut over the user's 90-day engagement events grouped by `Activity.category`. AC: chart is a `<CategoryDonut>` in `shared/ui/charts`, used here and only here for now.

62. **Quick actions.** Buttons opening `/favorites`, `/profile/preferences` (P3), `/profile/history` (P3). AC: P2 scope is the Favorites action; the others render a stub.

### Similar activities

63. **Detail page "Similar" section.** Calls `GetFeedUseCase` with a query derived from the current activity (same category, within 5km, dateStart in the next 30 days, exclude the current ID), limited to 6. AC: uses the existing engine — no new use case.

### Cross-cutting

64. **Engagement event retention.** A `node-cron` job at 04:00 deletes `EngagementEvent` rows older than 90 days. AC: the job logs the row count; runs in < 30s on a 100k-row table on Neon free.

65. **Engagement counter reconciliation.** The same nightly job recomputes `Activity.viewCount` / `saveCount` from `EngagementEvent` to correct drift. AC: idempotent.

---

## Acceptance gates (CI must pass)

All P1 gates remain. New gates:

- Adding a new vertical (`/<name>`) requires touching at most: `shared/presets/<name>.preset.ts`, `app/<name>/page.tsx`. PR template enforces.
- Flame computation has unit tests over a fixture set covering: zero-engagement, uniform engagement, hot activity, cold spike, decay over time.
- `node-cron` jobs have idempotency tests (run twice → same result).

## Performance gates

- Flame nightly job: < 60s on 10k activities (measured on Neon dev).
- Retention job: < 30s on 100k engagement events.
- Profile page p95 LCP < 2.5s.

## Definition of done

1. `/sport`, `/romantic`, `/food` exist; each route file is < 20 LOC; no new components introduced.
2. Cards across the site display a flame; the score reflects 14+ days of real engagement.
3. `/profile` shows stats and a category donut populated from real engagement.
4. Reviews can be created, edited, deleted; aggregates render on the detail page.
5. Retention job has run at least once in production-equivalent (Neon dev) and reduced the table size.

If any of these requires a new module, stop and revisit the architecture rule. The premise of P2 is that none of them should.
