# TODO — Wandr Implementation Roadmap

Execute in order. Each step references relevant documentation.

---

## Phase 0: Foundation

### ✅ Complete
- [x] ARCHITECTURE.md — Clean architecture design
- [x] CLAUDE.md — Guardrails for enforcement
- [x] PRD.md, PRD_Phase1/2/3.md — Requirements
- [x] design.md, spec.md — Design brief & functional spec

---

## Phase 1: Discovery Core (MVP)

**Timeline:** Q2 2026  
**Reference:** `PRD_Phase1.md` (105 user stories) | `ARCHITECTURE.md` | `CLAUDE.md`

### STEP_ZERO: Initialize Monorepo (2 hours)
**Reference:** `STEP_ZERO.md` (steps 0.1–0.12)

- [ ] 0.1 — Root package.json, tsconfig.json, turbo.json
- [ ] 0.2 — Create directory structure (apps/, packages/)
- [ ] 0.3 — Initialize @wandr/database (Prisma + schema)
- [ ] 0.4 — Initialize domain packages (activities, feed, favorites)
- [ ] 0.5 — Initialize application packages (feed, activities, search)
- [ ] 0.6 — Initialize @wandr/contracts (DTOs)
- [ ] 0.7 — Initialize @wandr/presets (HOME_PRESET)
- [ ] 0.8 — Initialize apps/web (Next.js)
- [ ] 0.9 — Environment & Docker Compose setup
- [ ] 0.10 — `pnpm install` & verify
- [ ] 0.11 — Type check & lint pass
- [ ] 0.12 — Commit skeleton

**Result:** `pnpm dev` works. Web app runs on localhost:3000. No runtime errors.

---

### STEP_ONE: Implement Feed Engine (4 days)
**Reference:** `PRD_Phase1.md` stories 1–15 | `ARCHITECTURE.md` (Application layer)

**1.1 — Catalog Service**
- [ ] Implement `domain/activities/activity.entity.ts` (Activity class)
- [ ] Implement `domain/activities/activity.repository.ts` (IActivityRepository port)
- [ ] Implement `infrastructure/database/activity.repository.ts` (PrismaActivityRepository adapter)
- [ ] Implement `application/activities/get-activity.usecase.ts` (GetActivityUseCase)
- [ ] Tests: unit (domain) + integration (application with mocked repo)
- [ ] Reference: CLAUDE.md rule #2, #4, #8

**1.2 — Feed Engine**
- [ ] Implement `domain/feed/feed.entity.ts` (FeedQuery, FeedResult)
- [ ] Implement `application/feed/get-feed.usecase.ts` (GetFeedUseCase: filter → rank → paginate)
- [ ] Implement `packages/contracts/feed.contract.ts` (FeedQueryDTO, FeedResultDTO)
- [ ] Tests: integration (application with mocked activities repo)
- [ ] Reference: CLAUDE.md rule #9, ARCHITECTURE.md (Application layer)

**1.3 — API Routes**
- [ ] Implement `apps/web/app/api/activities/route.ts` (GET /api/activities)
- [ ] Implement `apps/web/app/api/activities/[id]/route.ts` (GET /api/activities/:id)
- [ ] Error handling middleware
- [ ] Tests: E2E (real API, real DB)
- [ ] Reference: CLAUDE.md rule #7 (error mapping), ARCHITECTURE.md (Web layer)

**Result:** `GET /api/activities?limit=10` returns paginated ActivityDTO[]. Tests pass.

---

### STEP_TWO: Implement Filters (2 days)
**Reference:** `PRD_Phase1.md` stories 16–29 | `ARCHITECTURE.md` (Application layer)

- [ ] Implement `application/filters/filter.service.ts` (FilterService)
- [ ] Implement filter serialization (to URL, from URL)
- [ ] Implement filter application in GetFeedUseCase
- [ ] Update `packages/presets/home.preset.ts` with filter config
- [ ] Tests: unit (filter composition) + integration (filters + catalog)
- [ ] API: `GET /api/activities?filters[0].type=price&filters[0].min=0&filters[0].max=50`
- [ ] Reference: CLAUDE.md rule #10 (presets), ARCHITECTURE.md

**Result:** Filters apply instantly. URL is shareable. Tests pass.

---

### STEP_THREE: Implement Search (2 days)
**Reference:** `PRD_Phase1.md` stories 105–115 | `ARCHITECTURE.md` (Infrastructure layer)

- [ ] Implement `domain/search/intent.entity.ts` (Intent value object)
- [ ] Implement `domain/search/search.port.ts` (ISearchProvider port)
- [ ] Implement `infrastructure/search/naive.adapter.ts` (NaiveSearchAdapter: regex-based fallback)
- [ ] Implement `application/search/search-activities.usecase.ts` (SearchActivitiesUseCase)
- [ ] Update `packages/contracts/search.contract.ts`
- [ ] Tests: unit (intent parsing) + integration (search + catalog)
- [ ] API: `GET /api/search?q=jazz+tonight`
- [ ] Reference: CLAUDE.md rule #7 (selective hexagonal), ARCHITECTURE.md

**Result:** Search parses intent. Returns filtered activities. Tests pass.

---

### STEP_FOUR: Implement Map Integration (3 days)
**Reference:** `PRD_Phase1.md` stories 62–70 | `ARCHITECTURE.md` (Infrastructure layer)

- [ ] Implement `domain/map/map.port.ts` (IMapProvider port)
- [ ] Implement `infrastructure/map/mapbox.adapter.ts` (MapboxAdapter)
- [ ] Implement `packages/ui/map-section/MapSection.tsx` (React component)
- [ ] Integrate with GetFeedUseCase (fetch pins, sync with cards)
- [ ] Tests: integration (map adapter) + component (visual regression)
- [ ] Reference: CLAUDE.md rule #7 (selective hexagonal), ARCHITECTURE.md

**Result:** Map renders with pins. Pin/card sync works. Tests pass.

---

### STEP_FIVE: Implement Activity Cards & Detail (3 days)
**Reference:** `PRD_Phase1.md` stories 42–56, 80–94 | `ARCHITECTURE.md` (UI + Web)

- [ ] Implement `packages/ui/activity-card/ActivityCard.tsx` (3 variants)
- [ ] Implement `packages/ui/activity-card/ActivityCard.stories.tsx` (Storybook)
- [ ] Implement `application/detail/get-activity-detail.usecase.ts` (GetActivityDetailUseCase)
- [ ] Implement `apps/web/components/ActivityDetailOverlay.tsx`
- [ ] Update `packages/contracts/activity.contract.ts` (ActivityDTO, ActivityCardVM)
- [ ] Tests: component (visual) + E2E (click card → detail opens)
- [ ] Reference: CLAUDE.md rule #5 (contracts), ARCHITECTURE.md (UI layer)

**Result:** Cards render correctly. Detail overlay opens. Tests pass.

---

### STEP_SIX: Implement Favorites (2 days)
**Reference:** `PRD_Phase1.md` stories 95–104 | `ARCHITECTURE.md` (Application + Infrastructure)

- [ ] Implement `domain/favorites/favorite.entity.ts` (Favorite class)
- [ ] Implement `domain/favorites/favorite.repository.ts` (IFavoriteRepository port)
- [ ] Implement `infrastructure/database/favorite.repository.ts` (PrismaFavoriteRepository)
- [ ] Implement `application/favorites/add-favorite.usecase.ts`, `list-favorites.usecase.ts`
- [ ] Implement `apps/web/app/api/favorites/route.ts` (POST, DELETE, GET)
- [ ] Update `packages/contracts/favorites.contract.ts`
- [ ] Tests: unit (domain) + integration (application) + E2E (save → list → remove)
- [ ] Reference: CLAUDE.md rule #4, ARCHITECTURE.md

**Result:** Save/remove works. Favorites persist. Tests pass.

---

### STEP_SEVEN: Home Page UI (3 days)
**Reference:** `PRD_Phase1.md` (entire), `ARCHITECTURE.md` (Web layer)

- [ ] Implement `apps/web/app/(home)/page.tsx` (Home page)
- [ ] Implement `apps/web/hooks/use-home-feed.ts` (useHomeFeed hook)
- [ ] Integrate carousel (STEP_CAROUSEL, if not done)
- [ ] Integrate filters, feed, map, favorites
- [ ] Responsive design (1200px → 800px)
- [ ] Tests: E2E (full discovery flow < 60s)
- [ ] Reference: `PRD_Phase1.md`, `HOME_PRESET` in `packages/presets`

**Result:** Home page loads. All features work together. Discovery < 60s. Tests pass.

---

### STEP_CAROUSEL: Implement Carousel (1 day)
**Reference:** `PRD_Phase1.md` stories 8–15 | `ARCHITECTURE.md` (UI)

- [ ] Implement `packages/ui/carousel/Carousel.tsx` (generic carousel component)
- [ ] Implement `apps/web/components/FeaturedCarousel.tsx` (featured activities)
- [ ] Tests: component (rotation, nav, pause on hover)
- [ ] Reference: CLAUDE.md rule #10 (presets), ARCHITECTURE.md

**Result:** Carousel rotates, manual nav works, animations smooth. Tests pass.

---

### STEP_TESTING: Testing Infrastructure (1 day)
**Reference:** `CLAUDE.md` rule #11, `ARCHITECTURE_RECOMMENDATIONS.md` (removed, but covers: TESTING.md needed)

- [ ] Set up Vitest across packages
- [ ] Configure test databases (testcontainers for Postgres)
- [ ] E2E test framework (Playwright or similar)
- [ ] Coverage thresholds (domain 90%, application 80%)
- [ ] CI/CD matrix (test all layers in parallel)

**Result:** All tests runnable. `pnpm test` works. CI passes.

---

### STEP_ZERO-FINAL: Phase 1 Complete
- [ ] All 105 user stories (PRD_Phase1.md) completable
- [ ] Zero CLAUDE.md violations (linter enforces)
- [ ] E2E test: discovery < 60 seconds passes
- [ ] Visual regression tests pass
- [ ] FCP < 2s, LCP < 4s (measured)
- [ ] WCAG AA compliance verified
- [ ] Code coverage: domain 90%+, application 80%+
- [ ] Monorepo builds cleanly
- [ ] Ready for beta testing

---

## Phase 2: Specialization (Q3 2026)

**Reference:** `PRD_Phase2.md` (24 user stories) | `ARCHITECTURE.md`

### STEP_ONE-P2: Sport Page (3 days)
- [ ] Implement `packages/presets/sport.preset.ts`
- [ ] Extend filters for sports-specific (sport type, classes, deals)
- [ ] Implement `apps/web/app/sport/page.tsx`
- [ ] Add sport category tags, deal badges
- [ ] Tests: E2E (sport discovery flow)

### STEP_TWO-P2: Trend Flame System (2 days)
- [ ] Implement `domain/flame/flame.scorer.ts` (IFlameScorer)
- [ ] Compute from views, saves, bookings, recency
- [ ] Add nightly batch job (compute flame scores)
- [ ] Cache in Redis
- [ ] Update ActivityDTO with flameLevel
- [ ] Tests: unit (flame scoring logic)

### STEP_THREE-P2: User Profile (3 days)
- [ ] Implement `domain/personalization/affinity.entity.ts`
- [ ] Implement `application/profile/get-profile.usecase.ts`
- [ ] Implement `apps/web/app/profile/page.tsx`
- [ ] Add stats aggregation (viewed, saved, favorite category, monthly outings)
- [ ] Tests: E2E (profile page loads, stats accurate)

### STEP-COMPLETE-P2: Phase 2 Complete
- [ ] All 24 user stories completable
- [ ] Sport page engagement: 20%+ weekly users
- [ ] Performance maintained (FCP < 2s, LCP < 4s)
- [ ] Ready for rollout

---

## Phase 3: Intelligence (Q4 2026)

**Reference:** `PRD_Phase3.md` (21 user stories) | `ARCHITECTURE.md`

### STEP_ONE-P3: Chat Infrastructure (3 days)
- [ ] Implement `domain/chatbot/conversation.entity.ts`
- [ ] Implement `domain/chatbot/intent.parser.ts` (IIntentParser port)
- [ ] Implement `infrastructure/llm/openai.adapter.ts` (OpenAIAdapter)
- [ ] Set up intent caching (Redis, 5-min TTL)
- [ ] Tests: unit (intent parsing) + integration (LLM adapter)

### STEP_TWO-P3: Chat Page (2 days)
- [ ] Implement `application/chat/chat-with-activities.usecase.ts`
- [ ] Implement `apps/web/app/chat/page.tsx` (Chat UI)
- [ ] Add suggested prompts carousel
- [ ] Add SSE streaming for LLM responses
- [ ] Tests: E2E (chat → activity cards)

### STEP_THREE-P3: Personalized Recommendations (3 days)
- [ ] Implement `domain/personalization/affinity.calculator.ts`
- [ ] Implement `application/recommendations/get-recommendations.usecase.ts`
- [ ] Nightly batch job (compute user affinities)
- [ ] Display on Home, Sport pages, Chat
- [ ] Tests: unit (affinity scoring) + E2E (recommendations appear)

### STEP-COMPLETE-P3: Phase 3 Complete
- [ ] All 21 user stories completable
- [ ] Chat adoption: 30%+ weekly users
- [ ] Intent accuracy: 85%+
- [ ] Recommendation CTR: 15%+
- [ ] Ready for public launch

---

## Post-Launch

- [ ] Create DEVELOPMENT.md (local setup, debugging)
- [ ] Create TESTING.md (test structure, fixtures)
- [ ] Create API.md (contract design, pagination)
- [ ] Create LOGGING.md (structured logging, observability)
- [ ] Create AUTH.md (JWT, session, middleware)
- [ ] Architecture Decision Records (ADRs)
- [ ] Database migration strategy
- [ ] Monitoring & alerting setup (Sentry, Datadog)
- [ ] Performance profiling & optimization
- [ ] Mobile app architecture (if pursuing native)

---

## Key References

- **CLAUDE.md** — Rules to enforce during coding
- **ARCHITECTURE.md** — Layer design, examples, DAG
- **STEP_ZERO.md** — Initial monorepo setup
- **PRD_Phase1/2/3.md** — User stories per phase
- **design.md** — Visual identity, motion, emotional goals
- **spec.md** — Original functional requirements

---

**Start with:** STEP_ZERO.md (2 hours) → Then STEP_ONE (4 days) → Continue in order.

Each STEP references the PRD for requirements and ARCHITECTURE.md for design patterns.

Execute in order. Commit after each STEP. Keep CLAUDE.md enforced throughout.
