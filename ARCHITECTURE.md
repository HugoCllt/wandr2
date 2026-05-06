# ARCHITECTURE.md — Wandr v1

**Pattern:** Modular monolith with selective hexagonal. Single Next.js app. Capabilities are folders, not packages. Pages are compositions of shared modules parameterized by a preset.

**Stage:** personal POC. Optimize for "ship Phase 1 end-to-end on a laptop." Re-evaluate when there is a second consumer or a second engineer.

---

## 1. Topology

```
apps/web/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
└── src/
    ├── app/                          # Next.js App Router (thin)
    │   ├── (home)/page.tsx
    │   ├── sport/page.tsx
    │   ├── romantic/page.tsx
    │   ├── food/page.tsx
    │   ├── activity/[slug]/page.tsx
    │   ├── chat/page.tsx             # P3
    │   ├── api/
    │   │   ├── feed/route.ts
    │   │   ├── activities/[id]/route.ts
    │   │   ├── search/route.ts
    │   │   ├── favorites/route.ts
    │   │   ├── chat/route.ts         # P3
    │   │   └── _lib/error-handler.ts
    │   └── layout.tsx
    │
    ├── modules/                      # Capabilities (shared across pages)
    │   ├── activities/
    │   │   ├── domain/               # Activity entity, value objects, IActivityRepository, errors
    │   │   ├── application/          # GetActivityUseCase
    │   │   └── infra/                # PrismaActivityRepository
    │   ├── feed/
    │   │   ├── domain/               # FeedQuery, FeedResult, FeedFilter union
    │   │   └── application/          # GetFeedUseCase: filter → rank → paginate
    │   ├── filters/
    │   │   ├── domain/               # FilterDef, FilterValue, parsers
    │   │   └── application/          # filter ↔ URL serialization
    │   ├── favorites/
    │   │   ├── domain/               # Favorite entity, IFavoriteRepository
    │   │   ├── application/          # AddFavoriteUseCase, ListFavoritesUseCase
    │   │   └── infra/                # PrismaFavoriteRepository
    │   ├── search/
    │   │   ├── domain/               # IntentDTO, ISearchProvider port, IIntentParser port
    │   │   ├── application/          # SearchActivitiesUseCase
    │   │   └── infra/
    │   │       ├── trigram-search.adapter.ts     # P1: pg_trgm + filter parser
    │   │       └── llm-intent-parser.adapter.ts  # P3: OpenAI structured output
    │   ├── map/
    │   │   ├── domain/               # IMapProvider port (geocoding, clustering)
    │   │   ├── infra/                # MapboxAdapter
    │   │   └── web/                  # MapSection.tsx
    │   └── chat/                     # P3 (consumer of feed module)
    │       ├── domain/               # Conversation entity, IExplanationWriter port
    │       ├── application/          # ChatUseCase: NL → IntentDTO → FeedQuery → FeedResult + explanation
    │       └── infra/                # OpenAIIntentParser, OpenAIExplanationWriter
    │
    └── shared/
        ├── contracts/                # DTOs at HTTP/UI boundary
        ├── presets/                  # HOME_PRESET, SPORT_PRESET, …
        ├── ui/                       # ActivityCard, FilterBar, FeedGrid, Carousel, MapSection composition root
        ├── db/                       # Prisma client singleton
        ├── config/                   # zod-validated env loader
        └── obs/                      # pino logger
```

### Why folders, not packages

A separate workspace package buys you: independent versioning, separate `node_modules`, parallel CI builds. None of those apply to a one-engineer POC. They cost you: `tsconfig` references, per-package `exports` maps, `tsup` builds, Next `transpilePackages`, longer cold starts. We pay zero ceremony tax until a second consumer (`apps/api`, `apps/mobile`) makes the seam real.

---

## 2. Layer DAG

```
        web (app/, page.tsx, route.ts)
           │
           ▼
      application (use cases)
           │
           ▼
        domain (entities, ports)
           ▲
           │   (infra implements ports)
        infra (adapters)
```

Strictly no upward edges. No cycles. Cross-module edges are explicit (see §4).

`shared/contracts` is reachable from any layer. `shared/ui` is reachable only from `web` and from a module's own `web/` folder.

Enforcement: `dependency-cruiser` config lives at `apps/web/.dependency-cruiser.cjs`. CI runs `pnpm dep:check`.

---

## 3. Capability modules vs. presets vs. pages

This is the rule that prevents the codebase from forking per page.

- A **capability module** owns a vertical concern (`activities`, `feed`, `filters`, `favorites`, `search`, `map`, `chat`). It exposes use cases and DTOs. It does not know which page is calling it.
- A **preset** is a typed config object — pure data, no logic — that parameterizes capabilities for a given page.
- A **page** is a Next.js route that composes shared UI components and feeds them a preset.
