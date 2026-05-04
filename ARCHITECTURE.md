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

```ts
// shared/presets/preset.ts
export type PagePreset = {
  name: 'home' | 'sport' | 'romantic' | 'food' | 'chat'
  feed: {
    baseFilters: FilterValue[]      // e.g. [{ type: 'category', in: ['Sport'] }]
    visibleFilters: FilterId[]
    defaultSort: 'featured' | 'date' | 'price' | 'distance'
    pageSize: number
  }
  sections: {
    hero?:  { kind: 'carousel'; count: number }
    map?:   { kind: 'map'; maxPins: number }
    grid?:  { kind: 'grid' }
  }
  copy: { title: string; subtitle?: string }
}
```

```ts
// shared/presets/sport.preset.ts
export const SPORT_PRESET: PagePreset = {
  name: 'sport',
  feed: {
    baseFilters: [{ type: 'category', in: ['Sport'] }],
    visibleFilters: ['price', 'distance', 'date', 'sportType', 'free'],
    defaultSort: 'featured',
    pageSize: 24,
  },
  sections: {
    hero: { kind: 'carousel', count: 5 },
    map:  { kind: 'map', maxPins: 50 },
    grid: { kind: 'grid' },
  },
  copy: { title: 'Sport in Montreal' },
}
```

```tsx
// app/sport/page.tsx
import { SPORT_PRESET } from '@/shared/presets/sport.preset'
import { PageShell } from '@/shared/ui/page-shell'

export default function SportPage() {
  return <PageShell preset={SPORT_PRESET} />
}
```

`PageShell` reads the preset and renders `<Hero />`, `<MapSection />`, `<FilterBar />`, `<FeedGrid />` accordingly. The same `PageShell`, `FeedGrid`, `ActivityCard`, `FilterBar` power Home, Sport, Romantic, Food. **Duplication of any of these into a page-specific file is a CLAUDE.md violation.**

A new vertical (e.g. *Nightlife*) ships as: one preset file + one route file. No new module, no new UI.

---

## 4. Selective hexagonal — when to draw a port

Draw a port when **the same capability could be served by an interchangeable external system**. Otherwise it is a method.

| Capability | Port? | Adapters |
|---|---|---|
| Activity persistence | `IActivityRepository` | `PrismaActivityRepository` |
| Favorite persistence | `IFavoriteRepository` | `PrismaFavoriteRepository` |
| Map (geocode, cluster, tiles) | `IMapProvider` | `MapboxAdapter` (fallback: Leaflet+OSM) |
| Search query → activities | `ISearchProvider` | `TrigramSearchAdapter` (P1), Meilisearch (P2 if needed) |
| LLM intent parsing | `IIntentParser` | `OpenAIIntentParser` (fallback: `AnthropicIntentParser`) |
| LLM explanation writing | `IExplanationWriter` | `OpenAIExplanationWriter` |
| Cache | `ICache` | `LruCacheAdapter` (P1), `RedisAdapter` (P2+) |

**No port** for: filtering, sorting, ranking, pagination, presets, favorites business logic, feed orchestration, UI.

Ports live in the module's `domain/` folder. Adapters live in `infra/`. Wiring is manual constructor injection at the route handler level (no DI container).

---

## 5. Feed engine

`feed/application/get-feed.usecase.ts` is the orchestration spine. It does four things in order:

1. **Compose filters** — `[...preset.baseFilters, ...userFilters]` after parsing/validating.
2. **Fetch** — `IActivityRepository.findMany(filters, sort, cursor, limit)`.
3. **Rank** — apply the preset's ranker (P1: `featured DESC, dateStart ASC, recencyDecayedSaveCount DESC`; P2: trend flame; P3: personalization-aware).
4. **Paginate** — cursor-based, `nextCursor` returned.

The use case signature:

```ts
class GetFeedUseCase {
  constructor(private repo: IActivityRepository) {}
  execute(query: FeedQuery): Promise<FeedResult> { … }
}
```

`FeedQuery` and `FeedResult` are domain types. Routes map them to `FeedQueryDTO`/`FeedResultDTO` at the HTTP boundary.

The feed engine is **the only place** filter+rank+paginate logic lives. Search, chat, recommendations, and every page route through it.

---

## 6. Chat follows the feed

The chatbot is one more consumer of the feed engine. It does not own a parallel activity model.

```
user text
   │
   ▼
IIntentParser.parse(text) ──► IntentDTO          // OpenAI, structured output (zod schema)
   │
   ▼
intentToFeedQuery(intent, basePreset) ──► FeedQuery
   │
   ▼
GetFeedUseCase.execute(query) ──► FeedResult     // SAME engine that powers Home/Sport
   │
   ▼
IExplanationWriter.write(result, intent) ──► string  // grounded in returned IDs only
   │
   ▼
{ activities: ActivityDTO[], explanation: string }
```

Hard rules (enforced by `dependency-cruiser`):

- `chat/* → feed/*` allowed. `feed/* → chat/*` forbidden.
- `chat/* → activities/*` allowed (same direction).
- Chat never instantiates an `IActivityRepository` directly. It calls `GetFeedUseCase`.
- The LLM never returns activities — it returns an intent (P3.0) or an explanation grounded in IDs the retrieval already produced (P3.1). Output is validated against a zod schema; out-of-vocabulary fields are rejected.

---

## 7. Auth (POC)

P1 ships with **one seeded dev user**. Identity comes from a `x-user-id` request header for API routes; the seeded ID is hard-coded in dev. No login UI, no sessions, no provider.

When real auth becomes necessary, drop in Auth.js with the `Account`/`Session`/`VerificationToken` tables already declared in `SCHEMA.md`. The seam is `getCurrentUser(req)` in `app/api/_lib/auth.ts` — that one function changes; every use case keeps its signature.

---

## 8. Catalog ingestion

`Source` and `IngestionJob` tables exist in the schema from day one. P1 ingestion is two paths:

1. **Seed file** — `prisma/seed.ts` upserts 30 hand-curated Montreal activities. Source `manual`. Re-runnable.
2. **Admin API** — `POST /api/admin/activities` (header-gated) for ad-hoc additions during the POC.

Connectors (Eventbrite, Ticketmaster, scrapers) are deferred. When they arrive, each becomes one `IngestionJob` writer; `(sourceId, externalId)` is unique to dedupe.

---

## 9. Observability (POC)

- **Logger:** `pino` to stdout. Request-scoped child logger with `requestId`. JSON in prod, pretty in dev.
- **Errors:** mapped in `app/api/_lib/error-handler.ts`. No Sentry until there is real traffic.
- **Metrics:** none yet. When needed, OpenTelemetry → whatever Vercel exposes.

Field convention: `{ level, time, requestId, userId?, module, event, ...payload }`.

---

## 10. Operations (POC)

- **Target:** Vercel + Neon (Postgres + PostGIS). Local: Docker Compose (Postgres+PostGIS, optional Redis).
- **Migrations:** `prisma migrate dev` locally, `prisma migrate deploy` on Vercel. Expand/contract pattern noted but not enforced for POC; assume short windows of incompatibility are tolerable.
- **Backups:** Neon's automatic PITR is sufficient for a POC.
- **SLOs (dev targets, not commitments):** p95 LCP < 2.5s on `/`, p95 DB query < 100ms on `findMany` for the home feed.

---

## 11. LLM safety (P3, mandatory from day one)

Even at POC scale, an LLM-facing endpoint must:

1. **Structured output** — OpenAI `response_format: { type: 'json_schema', json_schema: <zod-derived> }`. Output validated again on receipt; failures retry once then 422.
2. **No input concatenation into instructions** — user text goes into the user message slot only; the system prompt is constant and version-pinned.
3. **Per-user daily cost cap** — 50¢/user/day, hard kill at 80%. Tracked in Redis (`cost:user:{id}:{yyyymmdd}`).
4. **PII redaction in logs** — emails, phone numbers, full names redacted before logging the prompt.
5. **Output scope** — `IExplanationWriter` receives only the `Activity` IDs already retrieved; the model can write an explanation but cannot invent IDs. Validation rejects any ID not in the retrieval set.

---

## 12. Phasing — modules per phase

| Module | P1 | P2 | P3 |
|---|---|---|---|
| `activities` | ✓ | ✓ | ✓ |
| `feed`       | ✓ | ✓ (flame ranker) | ✓ (affinity ranker) |
| `filters`    | ✓ | ✓ | ✓ |
| `favorites`  | ✓ | ✓ | ✓ |
| `search`     | ✓ (trigram) | ✓ | ✓ (LLM intent) |
| `map`        | ✓ | ✓ | ✓ |
| `chat`       | — | — | ✓ |
| `personalization` (sub-module of `feed/application/ranking`) | — | — | ✓ |

P2 adds: profile page (composition only, no new module), trend flame ranker, sport/romantic/food presets exercising the shared-modules model.
P3 adds: chat module, LLM intent parser, LLM explanation writer, affinity-aware ranking.

---

## 13. Out of scope (POC)

Reproduced from CLAUDE.md so it cannot be missed:

- i18n / dual locale routing / translation tables
- Quebec Loi 25 / Bill 96
- Managed auth, multi-user identity
- Sentry / OTEL / dashboards
- Mobile, SSO, multi-tenant

When any of these is reintroduced, it ships with its own ADR-style entry in this file.

---

**Last updated:** 2026-05-04
