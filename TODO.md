# TODO.md — Wandr Roadmap

Milestones, not checklists-of-checklists. Each milestone has a single goal, an explicit dependency, and a gate that decides "done." Stories inside a milestone come from `PRD_Phase{1,2,3}.md` by ID; this file does not duplicate them.

> Cadence: ship M0–M5 (Phase 1) before touching anything in Phase 2. The temptation to skip ahead is the temptation to ship a worse Phase 1.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done.

---

## Phase 1 — Discovery Core

### M0 — Bootstrap

**Goal:** `pnpm install && pnpm db:up && pnpm db:migrate && pnpm db:seed && pnpm dev` opens a working Next.js app at `localhost:3000` with seed data visible.
**Dep:** none.
**Gate:** STEP_ZERO §5 verification table — all 8 checks pass.

- [ ] Root scaffolding (`pnpm-workspace.yaml`, `tsconfig.base.json`, `turbo.json`, `.env.example`, `.gitignore`, `.nvmrc`, `.npmrc`, `.editorconfig`, `docker-compose.yml`, husky + commitlint + lint-staged + Prettier).
- [ ] `apps/web` scaffolding (Next 14, `tsconfig.json`, `eslint.config.mjs`, `next.config.mjs`).
- [ ] `dependency-cruiser` config with the layer DAG (CLAUDE.md §2 + ARCHITECTURE.md §2).
- [ ] Module folders stubbed: `activities`, `feed`, `filters`, `favorites`, `search`, `map`.
- [ ] `shared/{db,config,obs,contracts,presets,ui}` stubbed.
- [ ] Prisma schema (SCHEMA.md §3) authored and validated.
- [ ] PostGIS bootstrap migration (`CREATE EXTENSION` + GIST index for `Location.geom`).
- [ ] `prisma/seed.ts` with 30 hand-curated Montréal activities + 1 dev user + 1 manual `Source`.
- [ ] Trivial `app/page.tsx` listing seeded activities.

### M1 — Catalog + Feed engine

**Goal:** `GET /api/feed` returns paginated `FeedResultDTO` from real Prisma data, ranked by `featured DESC, dateStart ASC, recencyDecayedSaveCount DESC`.
**Dep:** M0.
**Gate:** spec.md F1.1, F1.2, F2.1, F2.2, F2.3 acceptance tests green; PRD_Phase1 stories 1, 2 pass Playwright.

- [ ] `Activity` entity with invariants + unit tests (target: 90% domain coverage).
- [ ] `IActivityRepository` port; `PrismaActivityRepository` adapter; testcontainers integration test.
- [ ] `FeedQuery`/`FeedResult` domain types.
- [ ] `GetFeedUseCase` (filter → rank → paginate). Cursor-based.
- [ ] P1 ranker (`featured`, `dateStart`, `recencyDecayedSaveCount`) — unit tested.
- [ ] `app/api/feed/route.ts` — DTO mapping, error handler.
- [ ] `app/api/_lib/error-handler.ts` mapping `DomainError` → HTTP.
- [ ] `app/api/_lib/track.ts` writing `EngagementEvent`.

### M2 — Filters + Search

**Goal:** Filters apply instantly, URL is shareable, naive intent parser handles 20 fixture phrases. Search and feed share one response shape.
**Dep:** M1.
**Gate:** PRD_Phase1 stories 5–18 pass; round-trip filter URL test green; trigram + naive parser fixture suite ≥ 90% pass.

- [ ] `FilterDef`/`FilterValue` domain types in `modules/filters/domain`.
- [ ] zod-validated URL ↔ filter serializer in `modules/filters/application`.
- [ ] Filter composition wired into `GetFeedUseCase`.
- [ ] `pg_trgm` extension migration.
- [ ] `TrigramSearchAdapter` in `modules/search/infra`.
- [ ] Naive intent parser (regex over date phrases, neighborhood, category) in `modules/search/application`.
- [ ] `SearchActivitiesUseCase`.
- [ ] `app/api/search/route.ts` returning `FeedResultDTO`.
- [ ] Distance filter via PostGIS `ST_DWithin`.

### M3 — Map + Detail + UI shell

**Goal:** Home `/` renders the shared `<PageShell preset={HOME_PRESET} />`. `<FeedGrid>`, `<FilterBar>`, `<MapSection>`, `<ActivityCard>` exist as shared primitives. `/activity/[slug]` renders a real page.
**Dep:** M2.
**Gate:** PRD_Phase1 stories 19–33; visual-regression baseline captured; axe-core AA on Home and Detail.

- [ ] Design tokens shipped in `shared/ui/tokens.ts` with the contrast snapshot test.
- [ ] Primitives (Button, IconButton, Input, Select, Toggle, Chip, Card, Sheet, Dialog, Skeleton, Carousel, MapPin, FlameIcon, DealBadge, Rating).
- [ ] `<ActivityCard>` (3 variants).
- [ ] `<FilterBar>` driven by `preset.feed.visibleFilters`.
- [ ] `<FeedGrid>` with cursor pagination and `IntersectionObserver`-driven `VIEWED` tracking.
- [ ] `<MapSection>` with Mapbox adapter, density clustering, pin/card sync.
- [ ] `<PageShell>` composition root.
- [ ] `app/(home)/page.tsx` using `HOME_PRESET`.
- [ ] `app/activity/[slug]/page.tsx` (full-page, not a modal).
- [ ] Mini overlay map on card location button.

### M4 — Favorites

**Goal:** Heart toggle persists, `/favorites` lists saved activities reusing `<FeedGrid>`.
**Dep:** M3.
**Gate:** PRD_Phase1 stories 22, 34–38 pass.

- [ ] `Favorite` entity + `IFavoriteRepository` port.
- [ ] `PrismaFavoriteRepository` adapter.
- [ ] `AddFavoriteUseCase`, `RemoveFavoriteUseCase`, `ListFavoritesUseCase`.
- [ ] `app/api/favorites/route.ts` (POST, DELETE, GET).
- [ ] `app/favorites/page.tsx` reusing `<FeedGrid>`.
- [ ] Heart toggle on cards: optimistic UI + rollback on failure.

### M5 — Phase 1 done

**Goal:** P1 acceptance gates green in CI; performance budgets met on dev box.
**Dep:** M4.
**Gate:** PRD_Phase1 §"Definition of done" — all four conditions hold.

- [ ] Playwright happy paths: Home, Detail, Favorites, Search.
- [ ] Lighthouse CI: p95 LCP < 2.5s on `/`, JS < 200 KB.
- [ ] axe-core AA on Home, Detail, Favorites.
- [ ] `pnpm dep:check` enforces every rule in `.dependency-cruiser.cjs` (deliberate-bad-import test still fails).
- [ ] 5-minute browse session writes `EngagementEvent` rows; verified by SQL.

---

## Phase 2 — Verticals + Trend Flame + Profile

Prereq: P1 in production-equivalent for ≥ 14 days, real engagement events accumulating.

### M6 — Sport / Romantic / Food presets

**Goal:** Three new vertical pages exist; **no new modules, no new components**. Each route file is < 20 LOC.
**Gate:** PRD_Phase2 stories 44–49.

- [ ] `SPORT_PRESET`, `ROMANTIC_PRESET`, `FOOD_PRESET`.
- [ ] `app/sport/page.tsx`, `app/romantic/page.tsx`, `app/food/page.tsx`.
- [ ] PR template with the "no new module/component" checkbox.

### M7 — Trend Flame

**Goal:** Flame computed nightly from real engagement; cards render flame; filter "Trending+" works.
**Gate:** PRD_Phase2 stories 50–55.

- [ ] `flame.ts` ranker module with the published score formula.
- [ ] `node-cron` job + Vercel Cron trigger.
- [ ] `<FlameIcon>` integration on card and detail.
- [ ] "Trending+" filter wired into `modules/filters`.
- [ ] Cold-start prior tested.

### M8 — Reviews

**Gate:** PRD_Phase2 stories 56–58.

- [ ] `Review` repository + use cases (create / update / delete).
- [ ] `app/api/reviews/route.ts`.
- [ ] Review section on `/activity/[slug]`.
- [ ] Detail-page rating aggregation.

### M9 — Profile

**Gate:** PRD_Phase2 stories 59–62.

- [ ] `app/profile/page.tsx`.
- [ ] On-the-fly stats queries (no aggregates table yet).
- [ ] `<CategoryDonut>` chart.
- [ ] Quick-action stubs for Preferences and History.

### M10 — Engagement retention + counter reconciliation

**Gate:** PRD_Phase2 stories 64–65.

- [ ] Nightly retention job (90-day TTL on `EngagementEvent`).
- [ ] Counter reconciliation pass updating `Activity.viewCount` / `saveCount`.

---

## Phase 3 — Intelligence

Prereq: P2 shipped, ≥ 30 days of engagement data.

### M11 — NL search (P3.0)

**Gate:** PRD_Phase3 stories 66–70; eval set ≥ 85%.

- [ ] `IIntentParser` port + `OpenAIIntentParser` adapter (structured output, pinned model).
- [ ] `intentToFeedQuery` translator.
- [ ] Cost-cap middleware (`cost:user:{id}:{yyyymmdd}`).
- [ ] 5-min cache by query hash.
- [ ] 50-phrase eval suite; CI gate.

### M12 — Grounded chat (P3.1)

**Gate:** PRD_Phase3 stories 71–77; LLM safety checklist all green.

- [ ] `chat` module: domain (`Conversation`, `IExplanationWriter`), application (`ChatUseCase`), infra (`OpenAIExplanationWriter`).
- [ ] `dep:check` rule `feed-must-not-depend-on-chat` active and tested.
- [ ] `app/chat/page.tsx` reusing `<PageShell>` + `<FeedGrid>`.
- [ ] `POST /api/chat` SSE response.
- [ ] Out-of-vocabulary ID validator + retry + templated fallback.
- [ ] PII redaction in prompt logs.
- [ ] 30-scenario grounded-chat eval suite.

### M13 — Personalization (P3.2)

**Gate:** PRD_Phase3 stories 78–84.

- [ ] `UserCategoryAffinity` nightly compute job.
- [ ] `AffinityAwareRanker` plugged into `GetFeedUseCase`.
- [ ] Cold-start fallback to flame ranker.
- [ ] Explainability copy from rank deltas.
- [ ] Anti-bias guard: `dealKind = PERCENT_OFF` capped at 30% of first 24.
- [ ] Profile preference toggle for personalization.

---

## Cross-cutting backlog (do when needed, not on a schedule)

- [ ] Replace `node-cron` with Inngest or Trigger.dev when there are > 3 jobs.
- [ ] Replace in-process LRU cache with Redis when intent caching grows.
- [ ] Promote `shared/contracts` and/or `shared/ui` to a workspace package when `apps/api` or `apps/mobile` actually exists.
- [ ] Replace seeded user with Auth.js when the product has a second user.
- [ ] Sentry / OTEL when production traffic exists.
- [ ] Eventbrite / Ticketmaster ingestion connectors when manual seeding is no longer enough.
- [ ] i18n + Quebec Loi 25 when public launch is on the table.

Each item lands with its own ADR-style note appended to `ARCHITECTURE.md` so the rationale is recorded in-tree.

---

**Authority:** `CLAUDE.md` > `ARCHITECTURE.md` > PRDs > this file. If a milestone here disagrees with a PRD, fix the PRD or fix the milestone — never both at once.
