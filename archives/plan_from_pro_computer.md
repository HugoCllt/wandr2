# Plan — Wandr v0.1 (Home + Calendar foundation)

## Context

Repo `wandr2/` started as docs-only, then Stage 0 and Stage 1 established the app foundation plus the seeded catalogue. The PRD already resolved 16 design branches via grilling and is the authoritative spec. This plan is the execution roadmap on top of it: it does not redesign anything — it sequences the work, confirms the approach, and lists what to verify at each step.

The first cut delivers a Next.js modular monolith with a Home feed (mixed EVENT/PLACE, 7 filters, hero carousel, cursor pagination), Activity Detail page, Favorites, and a Calendar planner/journal — all backed by a local Postgres (system service, no Docker), seeded with ~30 curated Montréal activities for one dev user.

Current state as of 2026-05-06: Stage 0 (Foundation) and Stage 1 (Catalogue & seed) are done. Stage 2 (Activity Detail page) is the next implementation slice.

## Approach

Follow the PRD's 9 stages **in order, one PR per stage**. Each stage is a vertical slice (schema → module → API → UI → tests → verify) and depends only on prior stages. No parallel stages — the dependency chain (schema → activities → detail → filters → feed → home → hero → favorites → calendar) is real and tight.

**Repo layout.** Single-app flat layout under `wandr2/` — no pnpm workspace, no `apps/web/` prefix. The PRD's "Critical files" paths (`apps/web/src/...`) collapse to `src/...` at the repo root. `package.json`, `tsconfig.json`, `next.config.mjs`, `.dependency-cruiser.cjs`, `prisma/`, and `.env.example` all live at `wandr2/` root. (User confirmed: workspace ceremony skipped for the POC; promote later if a second app appears.)

**Database.** Postgres `wandr` database already exists locally but is empty. Connection string: `postgresql://postgres:Garros41@localhost:5432/wandr` — goes in `.env` (gitignored), templated in `.env.example`. Stage 0 includes a `db_setup.md` at the repo root with the setup steps so a future-you (or fresh clone) can re-bootstrap.

**Stack confirmed by PRD.**
- Next.js 14+ App Router, TypeScript strict
- Prisma + Postgres (system-installed, `createdb wandr_dev`)
- pnpm workspaces, ESLint flat, Prettier
- Vitest + fast-check (property tests on URL codec & cursor codec)
- pino → stdout, zod env loader
- `dependency-cruiser` enforcing the layer DAG from `CLAUDE.md §5`
- Single seeded dev user resolved via `getCurrentUser()` reading `env.SEED_USER_EMAIL` — only file to swap when real auth ships

**Modules** (folders, not packages — `ARCHITECTURE.md §1.1`):
`activities`, `affinity`, `filters`, `feed`, `favorites`, `calendar`. Each has `domain/` (entities + ports + errors), `application/` (use cases), and where applicable `infra/` (Prisma adapters). Tests colocated.

**Cross-cutting** (`shared/`):
`auth/current-user.ts`, `contracts/*DTO.ts`, `presets/HOME_PRESET.ts`, `ui/*` (primitives + composed), `db/prisma.ts`, `config/env.ts`, `obs/logger.ts`, `ui/format/formatInTZ.ts` (sole `UTC → America/Toronto` site).

## Execution stages

Each stage = one PR. Verify before merging into the next.

| # | Stage | Schema delta | Verify gate |
|---|---|---|---|
| 0 | **Foundation** — Next.js skeleton at repo root, Prisma init pointing at `wandr` DB, `dep:check`, env loader, logger, prisma client singleton, `db_setup.md`, `.env.example` | none | `pnpm dev` serves `/`, `pnpm dep:check` & `prisma validate` green, `prisma.user.findFirst()` returns `null` against live `wandr` DB |
| 1 | **Catalogue & seed** — `User`, `Source`, `Activity`, `UserCategoryAffinity` + enums; `IActivityRepository` + Prisma adapter; `IAffinityRepository` + Prisma adapter; idempotent seed (1 user, 1 source, 30 activities = 15 EVENT + 15 PLACE with 5 featured each, 6 affinities); admin POST endpoint header-gated | + 4 models | `pnpm db:seed && pnpm db:seed` → identical counts; domain invariant tests pass |
| 2 | **Activity Detail page** — `GetActivityUseCase`, `GET /api/activities/[slug]`, `app/activity/[slug]/page.tsx`, `ActivityDetail` component | none | seeded slug renders full detail (hero/desc/schedule-or-Lieu-badge/pricing/address/externalUrl); 404 on unknown slug |
| 3 | **Filters** — `FilterValue` taxonomy + zod, `parseFilters`/`serializeFilters` URL codec (flat keys, CSV multi), `FilterBar` + 7 sub-components | none | round-trip property test green; isolated render shows correct active state for `?kind=EVENT&category=SPORT,FOOD` |
| 4 | **Feed engine** — `rank()` pure function (`featured DESC, matchScore DESC, dateStart ASC NULLS LAST, createdAt DESC, id ASC`), base64 cursor codec, `GetFeedUseCase`, `GetUserAffinityMapUseCase`, `GET /api/feed` | none | tie-break unit tests green; `curl /api/feed?kind=EVENT` returns only EVENT; `?date=weekend` returns weekend EVENT + all PLACE (Q7) |
| 5 | **Home composition (no hero, no heart yet)** — `ActivityCard` (standard/compact), `FeedGrid` w/ IntersectionObserver, `PageShell`, `HOME_PRESET`, `app/(home)/page.tsx` | none | `/` shows ≥12 cards; scroll triggers next page; toggling a filter rewrites URL; reload preserves filters |
| 6 | **Hero carousel** — `Carousel` primitive, `ActivityCard` `hero` variant, `HeroCarousel` (fetches 3 featured), preset toggle | none | `/` shows 3-up hero, 5s auto-rotate, pause-on-hover/focus, `prefers-reduced-motion` halts rotation |
| 7 | **Favorites** — `Favorite` model, repo + adapter, `ToggleFavoriteUseCase`, `ListFavoritesUseCase` (returns `FeedResultDTO`), heart on cards & detail (optimistic), `/favorites` page reusing `PageShell` | + 1 model | heart persists across reload; `/favorites` filters work; double-click idempotent |
| 8 | **Calendar** — `CalendarEntry` model, repo + adapter, `AddTo`/`RemoveFrom`/`ListCalendarEntriesUseCase`, `DuplicateCalendarEntryError` → 409, `AddToCalendarDialog` (date + 15-min select 06:00–23:45 + 200-char note), `CalendarMonthView`, `CalendarEntryList`, `app/calendar/page.tsx` | + 1 model | save 2026-06-15 19:30 → toast confirm → dot on `/calendar` 06/2026 → click day shows entry; re-add same slot → 409 toast; remove → dot vanishes; **past date works as journal** |

## Critical decisions already locked by the PRD (do not relitigate)

- `kind` discriminator on `Activity` (EVENT vs PLACE) — single table, not split.
- `matchScore = affinityMap.get(category) ?? 5` — neutral default, no row required.
- `featured` outranks `matchScore` (curatorial veto outranks taste).
- `(userId, activityId, scheduledAt)` unique on `CalendarEntry` — same activity can be re-scheduled at different times.
- Past `scheduledAt` allowed — Calendar is planner AND journal (US 20).
- Tests in v0.1: domain + application only with in-memory fakes implementing ports. No `vi.mock` of paths. No infra/Playwright tests yet. CI gates from `CLAUDE.md §11` cover structure.
- All `userId` columns exist now (single-user POC) for forward-compat — only `getCurrentUser()` changes when real auth ships.
- TZ: UTC in DB, `formatInTZ.ts` is the sole conversion site to `America/Toronto`. DST off-by-one accepted.
- `EngagementEvent`, search, map, preset pages, profile, reviews, similar, chat, auto-personalisation: **explicitly deferred** — do not introduce any scaffolding.

## Critical files / remaining surfaces

All paths relative to repo root `wandr2/`. Single-app flat layout — no `apps/web/` prefix.
- Done: setup files (`package.json`, `tsconfig.json`, `next.config.mjs`, `.dependency-cruiser.cjs`, `.env.example`, `.env` gitignored, `.gitignore`, `db_setup.md`)
- Done: Prisma catalogue foundation (`prisma/schema.prisma`, `prisma/seed.ts`)
- Done: Stage 1 modules for `activities` and `affinity` domain/infra, plus admin activity API foundation
- Done: `SCHEMA.md` mirrors the Stage 1 Prisma schema
- Remaining pages: `src/app/{activity/[slug]/page.tsx,favorites/page.tsx,calendar/page.tsx}` plus replacing the home placeholder in `src/app/(home)/page.tsx`
- Remaining API: `src/app/api/{feed,activities/[slug],favorites,calendar,calendar/[id]}/route.ts`
- Remaining modules: `src/modules/{feed,filters,favorites,calendar}/{domain,application,infra}/*` and later application use cases for activity detail
- Remaining shared: `src/shared/{auth,presets,ui}` plus additional DTOs/contracts and `ui/format/formatInTZ.ts`

## Global definition of done (PRD §Verification, mirrored)

1. `pnpm install && pnpm db:migrate && pnpm db:seed` produces: 1 User, 1 Source, 30 Activities (15 EVENT + 15 PLACE), 6 affinities, 0 favorites, 0 calendar entries.
2. `pnpm type-check && pnpm lint && pnpm format:check && pnpm dep:check && pnpm prisma validate` all green.
3. `pnpm test` passes domain + application suites listed in PRD §Testing Decisions.
4. Manual flows green: home (mixed feed, filters URL-driven), detail by slug (kind-aware), heart persistence, `/favorites` filterable, calendar add → toast → dot → list → duplicate-409 → remove → past-date works.

## Resolved by user before plan approval

- **Layout:** single-app flat under `wandr2/` (no workspace, no `apps/web/`).
- **DB:** `wandr` exists empty at `postgresql://postgres:Garros41@localhost:5432/wandr` — Stage 0 wires the schema, writes `db_setup.md`.
- **Cadence:** one PR per stage (9 stages, 9 PRs).
- **Images:** Unsplash URLs OK for the POC; will swap before any public publish.

## Progress

| # | Stage | Status | Date |
|---|---|---|---|
| 0 | Foundation | ✅ Done | 2026-05-06 |
| 1 | Catalogue & seed | ✅ Done | 2026-05-06 |
| 2 | Activity Detail page | ⬜ Pending | — |
| 3 | Filters | ⬜ Pending | — |
| 4 | Feed engine | ⬜ Pending | — |
| 5 | Home composition | ⬜ Pending | — |
| 6 | Hero carousel | ⬜ Pending | — |
| 7 | Favorites | ⬜ Pending | — |
| 8 | Calendar | ⬜ Pending | — |

### Stage 0 — Foundation (2026-05-06)

Verified gates:
- `pnpm prisma validate` — schema valid
- `pnpm type-check` — clean
- `pnpm lint` — clean (ESLint 8.57 + flat config via `FlatCompat`)
- `pnpm dep:check` — 0 violations
- `pnpm db:push` — synced to live `wandr` Postgres
- `prisma.user.findFirst()` — returns `null` against live DB (smoke test in `scripts/smoke-db.ts`)
- `pnpm dev` — Next 14.2.35 boots, `GET /` → 200 with placeholder

Deviations from plan:
- ESLint pinned to 8.57 (not 9) — `eslint-config-next@14` peers to v8. Flat config preserved via `@eslint/eslintrc`.
- Added `.npmrc` (`public-hoist-pattern[]=*eslint*`) so pnpm 10 hoists ESLint plugins for `eslint-config-next`.
- Added `pnpm-workspace.yaml` with `onlyBuiltDependencies` so Prisma's postinstall runs under pnpm 10's stricter sandbox.

### Stage 1 — Catalogue & seed (2026-05-06)

Implemented:
- Prisma schema expanded with `User`, `Source`, `Activity`, `UserCategoryAffinity`, `ActivityStatus`, `ActivityKind`, and `ActivityCategory`.
- `activities` module now has domain entity/invariants, `ActivityNotFoundError`, repository port, `CreateActivityUseCase`, Prisma adapter, and admin activity route handler.
- `affinity` module now has domain entity/invariants, repository port, and Prisma adapter.
- `POST /api/admin/activities` added, gated by `X-Admin-Token`, with zod body validation and slug collision handling.
- `prisma/seed.ts` added with idempotent upserts for 1 user, 1 source, 30 Montréal activities (15 EVENT + 15 PLACE), 5 featured of each kind, and 6 category affinities.
- `SCHEMA.md` updated for Stage 1.
- `vitest` added and domain invariant tests added for Activity and UserCategoryAffinity.

Verified gates:
- `pnpm prisma validate` — schema valid
- `pnpm type-check` — clean
- `pnpm lint` — clean
- `pnpm test` — 10 tests passing
- `pnpm dep:check` — 0 errors; 5 orphan warnings for Stage 1 ports/contracts/adapters intentionally waiting for later consumers
- `pnpm db:push` — synced Stage 1 schema to live `wandr` Postgres
- `pnpm db:seed && pnpm db:seed` — identical counts both runs:
  - users: 1
  - sources: 1
  - activities: 30
  - events: 15
  - places: 15
  - featuredEvents: 5
  - featuredPlaces: 5
  - affinities: 6
- Targeted Prettier check passed for Stage 1 touched files.

Remaining after Stage 1:
- Stage 2: Activity detail use case, `GET /api/activities/[slug]`, detail page, and `ActivityDetail` UI.
- Stage 3: filters taxonomy, URL codec, and FilterBar.
- Stage 4: feed ranker, cursor codec, feed use case, affinity map use case, and `GET /api/feed`.
- Stage 5: home grid composition and infinite pagination.
- Stage 6: hero carousel.
- Stage 7: favorites schema/use cases/API/UI.
- Stage 8: calendar schema/use cases/API/UI.

Known notes:
- Full `pnpm format:check` still reports pre-existing docs/skill formatting outside Stage 1. Stage 1 touched files pass targeted Prettier check.
