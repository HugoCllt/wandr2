# spec.md — Functional Contract

This is the deduplicated, canonical feature list for Wandr v1. Every feature here maps to:

- the **owning module** under `apps/web/src/modules/` (or `shared/`),
- the **phase** in which it ships (P1 / P2 / P3),
- the **primary acceptance test** that gates the feature.

PRDs (`PRD_Phase1.md`, `PRD_Phase2.md`, `PRD_Phase3.md`) reference this index by feature ID. The PRDs add user-facing detail and acceptance criteria; this file owns the wiring.

> **Stage:** personal POC. Single locale. Single seeded user. No public launch implied.

---

## Product thesis (one sentence)

A discovery surface for Montréal activities where the entire navigable surface — Home, Sport, Romantic, Food, Chat — is one shared feed engine parameterized by a preset.

## Non-goals (explicit)

- A booking system. Wandr links out for booking; it does not transact.
- An events calendar. Wandr is curated, not exhaustive.
- A social network. No comments, no follows.
- A mobile app. Web only.
- i18n at launch. POC ships in one locale.

---

## Feature index

### F1 — Catalog

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F1.1 | Activity entity with invariants (price ≥ 0, dateEnd ≥ dateStart, status state machine) | `modules/activities/domain` | P1 | Vitest unit tests for invariants |
| F1.2 | Prisma persistence with provenance (`sourceId`, `externalId` unique) | `modules/activities/infra` | P1 | Integration test against testcontainers Postgres |
| F1.3 | Manual seed (30 activities) | `prisma/seed.ts` | P1 | `pnpm db:seed` upserts and is idempotent |
| F1.4 | Admin API `POST /api/admin/activities` (header-gated) | `app/api/admin` | P1 | Playwright happy path |
| F1.5 | External-source ingestion (Eventbrite/Ticketmaster connectors) | `modules/ingestion` (new) | post-P3 | Out of scope for POC |

### F2 — Feed engine

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F2.1 | `FeedQuery` / `FeedResult` domain types | `modules/feed/domain` | P1 | Type-only — `tsc --noEmit` |
| F2.2 | `GetFeedUseCase`: filter → rank → paginate (cursor-based) | `modules/feed/application` | P1 | Integration tests with mocked `IActivityRepository` |
| F2.3 | P1 ranker: `featured DESC, dateStart ASC, recencyDecayedSaveCount DESC` | `modules/feed/application/ranking` | P1 | Unit test |
| F2.4 | P2 ranker: trend flame | `modules/feed/application/ranking` | P2 | Unit test + nightly job |
| F2.5 | P3 ranker: affinity-aware | `modules/feed/application/ranking` | P3 | Unit test |

### F3 — Filters

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F3.1 | Filter taxonomy (price, distance, date, category, indoor/outdoor, free/paid) | `modules/filters/domain` | P1 | Type-only |
| F3.2 | URL ↔ filter serialization (zod-validated) | `modules/filters/application` | P1 | Round-trip unit test |
| F3.3 | Filter composition with preset `baseFilters` | `modules/feed/application` | P1 | Integration test |
| F3.4 | Save filter presets per-user | `modules/filters` | post-P3 | Out of scope for POC |

### F4 — Search

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F4.1 | Trigram search adapter (`pg_trgm`) | `modules/search/infra` | P1 | Integration test |
| F4.2 | Naive intent parser (regex for date phrases, neighborhood, category) | `modules/search/application` | P1 | Unit tests over a fixture set |
| F4.3 | LLM intent parser (`OpenAIIntentParser`, structured output) | `modules/search/infra` | P3 | Eval set with ≥ 85% intent accuracy |
| F4.4 | Search API `GET /api/search?q=…` returns same `FeedResultDTO` shape as feed | `app/api/search` | P1 | Playwright happy path |

### F5 — Map

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F5.1 | Mapbox adapter implementing `IMapProvider` | `modules/map/infra` | P1 | Smoke test, mocked tiles in CI |
| F5.2 | Pin/card sync (selecting either highlights the other) | `modules/map/web` + `shared/ui/feed-grid` | P1 | Playwright happy path |
| F5.3 | Density clustering | `modules/map/web` | P1 | Visual regression |
| F5.4 | Mini overlay map on activity card location button | `shared/ui/activity-card` | P1 | Playwright happy path |

### F6 — Activity detail

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F6.1 | Full-page route `/activity/[slug]` (not a modal) | `app/activity/[slug]` | P1 | Playwright happy path |
| F6.2 | Hero, description, schedule, pricing, location, booking link | `shared/ui/activity-detail` | P1 | Visual regression |
| F6.3 | Reviews & average rating | `modules/activities/web` | P2 | Integration test |
| F6.4 | Similar activities | `modules/feed/application` (reuse) | P2 | Unit test |

### F7 — Favorites

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F7.1 | Toggle favorite (`POST/DELETE /api/favorites`) | `modules/favorites` | P1 | Integration test |
| F7.2 | List user favorites with same `FeedResultDTO` shape | `modules/favorites/application` | P1 | Integration test |
| F7.3 | Search/filter within favorites (reuses filter module) | `modules/favorites/application` | P1 | Integration test |
| F7.4 | Heart state persisted across sessions | `modules/favorites` | P1 | Playwright happy path |

### F8 — Pages (compositions)

| ID | Page | Preset | Phase | Acceptance |
|---|---|---|---|---|
| F8.1 | Home `/` | `HOME_PRESET` | P1 | Playwright happy path |
| F8.2 | Sport `/sport` | `SPORT_PRESET` | P2 | Playwright happy path |
| F8.3 | Romantic `/romantic` | `ROMANTIC_PRESET` | P2 | Playwright happy path |
| F8.4 | Food `/food` | `FOOD_PRESET` | P2 | Playwright happy path |
| F8.5 | Profile `/profile` | n/a (composition only) | P2 | Playwright happy path |
| F8.6 | Chat `/chat` | `CHAT_PRESET` | P3 | Playwright happy path |

> **Critical invariant:** every page in F8 reuses the same `<PageShell>`, `<FeedGrid>`, `<ActivityCard>`, `<FilterBar>`, `<MapSection>`. Adding a page that introduces a new component there is a CLAUDE.md violation.

### F9 — Engagement & Trend Flame

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F9.1 | `EngagementEvent` writes on view/save/share/search | `app/api/_lib/track.ts` | P1 (capture only) | Integration test |
| F9.2 | Trend flame computation (nightly) | `modules/feed/application/ranking/flame` | P2 | Unit test + smoke against seeded data |
| F9.3 | Flame display on cards & detail | `shared/ui/activity-card` | P2 | Visual regression |
| F9.4 | Filter by flame level | `modules/filters` | P2 | Integration test |

### F10 — Profile

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F10.1 | Stats: viewed, saved, monthly outings, top category | `app/profile/page.tsx` | P2 | Integration test |
| F10.2 | Category breakdown chart | `shared/ui/charts` | P2 | Visual regression |
| F10.3 | Quick actions: Favorites, Preferences, History | `app/profile/page.tsx` | P2 | Playwright happy path |

### F11 — Chat

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F11.1 | NL search: `IIntentParser` extracts typed `IntentDTO` | `modules/search/infra` | P3.0 | Eval set |
| F11.2 | Routes through `GetFeedUseCase` (chat-follows-feed) | `modules/chat/application` | P3.0 | `dep:check` rule active |
| F11.3 | Grounded explanation via `IExplanationWriter` | `modules/chat/infra` | P3.1 | Schema validation rejects out-of-vocab IDs |
| F11.4 | Per-user daily cost cap | `modules/chat/application` | P3.0 | Integration test |
| F11.5 | Suggested prompts carousel | `shared/ui/prompt-carousel` | P3.0 | Visual regression |

### F12 — Personalization

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F12.1 | `UserCategoryAffinity` computed nightly | `modules/feed/application/personalization` | P3 | Unit test |
| F12.2 | Affinity-aware ranker | `modules/feed/application/ranking` | P3 | Unit test |
| F12.3 | Cold-start fallback (global trending) | `modules/feed/application/ranking` | P3 | Unit test |

### F13 — Cross-cutting

| ID | Feature | Module | Phase | Acceptance |
|---|---|---|---|---|
| F13.1 | Layer DAG enforcement | `dependency-cruiser` | P1 | `pnpm dep:check` in CI |
| F13.2 | Schema validation | `prisma validate` | P1 | CI gate |
| F13.3 | Logging via `pino` to stdout | `shared/obs/logger` | P1 | Field convention documented in ARCHITECTURE.md §9 |
| F13.4 | Env validation via zod | `shared/config/env` | P1 | App fails fast on boot if invalid |
| F13.5 | Accessibility AA on Home, Detail, Favorites routes | `app/...` | P1 | `axe-core` Playwright check |

---

## Performance budgets (dev targets)

These are not production SLOs. They are gates we want green on the dev box before declaring P1 done.

| Surface | Metric | Target |
|---|---|---|
| `/` | p95 LCP (M2 macbook, throttled "Fast 4G") | < 2.5s |
| `/` | bundle size (initial JS) | < 200 KB |
| `/api/feed` | p95 latency on seeded DB | < 100ms |
| `/api/search?q=…` | p95 latency on seeded DB | < 200ms |

Measurement: Lighthouse CI for the page metrics, `pino`-logged DB timings with `pg_stat_statements` for the API metrics.

---

## What changes in each phase (one paragraph)

**P1.** Catalog + feed + filters + naive search + map + activity detail + favorites + Home page composition. One seeded user, no auth UI, no flame, no chat. Goal: a logged-in-as-dev developer can browse and favorite activities on `/` and `/activity/[slug]`.

**P2.** Sport + Romantic + Food preset routes (no new modules — they exist by composition). Trend flame computed nightly. Profile stats. Reviews. Engagement events drive the rankers. Goal: the shared-modules thesis is demonstrated by three new pages built without copy-paste.

**P3.** Chat route. NL search via LLM intent parser feeding the same `GetFeedUseCase`. Grounded explanations. Affinity-based personalization. Cost caps. Goal: chat is one more consumer of the feed engine, not a parallel system.
