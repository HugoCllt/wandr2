# CLAUDE.md — Engineering guardrails

Architecture rules and working principles. Read this + [`CONTEXT.md`](./CONTEXT.md) (domain & composition vocabulary) before opening a PR.

> **Stage:** personal POC. Single locale, single user, single deployment. Anything that doesn't serve "make Phase 1 work end-to-end" is out of scope.

---

## Working principles

**1. Think before coding.** State assumptions, surface tradeoffs, don't pick silently. If multiple interpretations exist, ask.

**2. Simplicity first.** Minimum code that solves the problem. No abstractions for single-use code. No flexibility that wasn't requested. If a senior would call it overcomplicated, simplify.

**3. Surgical changes.** Touch only what the task requires. Match existing style. Don't refactor adjacent code. Every changed line traces directly to the user's request.

**3.1 Deferrals go in `tbd.md`.** Every assumption, planned future change, or hardcoded value gets one bullet under `## Assumptions`, `## Future changes`, or `## Hardcoded`. Reference `file:line`. Review before each new plan so deferrals get picked up when their consumer finally exists.

---

## Architecture

**Modular monolith** under `src/`. Two entry points:

- `src/app/` — Next.js App Router (web product)
- `src/mcp/` — MCP server (ingestion + recheck tools)

Capabilities live in `src/modules/<cap>/{domain,application,infra,web}`. Cross-cutting helpers live in `src/shared/{api,auth,config,contracts,db,obs,presets,ui}`.

### The two architectural seams to know

**1. Pages are config, not code.** Every category page (sport, dining, culture, outdoor, nightlife, romantic) is served by **one** dynamic route `app/(with-sidebar)/[category]/page.tsx` driven by **one** registry `shared/presets/CATEGORY_PRESETS`. The Nav also derives from it. **Adding a category = one registry entry.** Home is the only product exception (`app/(with-sidebar)/page.tsx`). `design-showcase` is dev-only. See `CONTEXT.md`.

**2. HTTP edge is one seam.** Every `app/api/**/route.ts` collapses to `export const VERB = withRoute(handler)` (`src/app/api/_lib/withRoute.ts`). Handlers throw — `handleApiError` is the single error→status policy. Input validation lives in Zod schemas via `parseBody` / `parseQuery` (`src/shared/api/parse.ts`); no manual `safeParse + 400` in handlers, no `instanceof` chains.

## Layer DAG (enforced by `dependency-cruiser`)

```
web → application → domain
                 ↘
infra → domain     (infra implements ports declared in domain)
shared/* → domain | shared/*   (no upward edges)
```

**Forbidden edges** — `pnpm dep:check` fails on any of these:

- `domain → application | infra | web | app`
- `application → infra | web | app`
- `infra → application | web | app`
- `src/app → src/modules/*/infra` (app goes through application)
- `src/modules → src/app` (modules never import app)
- `src/shared → application | infra | web | app`
- `src/shared/ui → src/shared/contracts` (shared/ui is DTO-free)
- Any cycle, anywhere.

**Cross-module edges:**

- `chat → feed` allowed; reverse forbidden. Chat consumes the feed, never the inverse.
- A capability's `web/` may import another capability's `web/` (e.g. a card embedding `FavoriteButton`), **but `activities` is the core noun** — feed/calendar/favorites/chat/profile depend on it; it must not depend back. Inject sibling UI as props from the consumer.

## Layer responsibilities

| Layer | Owns | Forbidden |
|---|---|---|
| `modules/<cap>/domain` | Entities, value objects, ports, domain errors, pure rules | Frameworks, HTTP, Prisma, React, env, time-of-day |
| `modules/<cap>/application` | Use cases, orchestration | Direct DB calls, HTTP routes, JSX |
| `modules/<cap>/infra` | Port adapters (Prisma, Mapbox, OpenAI, …) | Business rules, orchestration |
| `modules/<cap>/web` | A capability's UI + route handlers (consumes its DTO) | Business rules, infrastructure details |
| `shared/contracts` | DTOs / view models crossing API↔UI | Logic, methods, domain entities |
| `shared/presets` | Per-page config (`CATEGORY_PRESETS`, `HOME_PRESET`, `FAVORITES_PRESET`) | Logic, data fetching, UI |
| `shared/ui` | DTO-free primitives (icons, decor, layout chrome, Nav) used by ≥2 capabilities | Data fetching, business rules, DTO-aware components |
| `shared/api` | Cross-layer HTTP helpers (`parseBody`, `parseQuery`) | Capability logic |
| `app/api/_lib` | Edge wrapper + error policy (`withRoute`, `handleApiError`) | Capability logic |
| `src/app` | Next route files + page composition | Business rules, direct infra access |

**Component placement** — does a `.tsx` consume a capability's DTO (`ActivityDTO`, `CalendarEntryDTO`, …)?

- **Yes** → it lives in that capability's `modules/<cap>/web/`.
- **No, and ≥2 capabilities use it** → `shared/ui`.
- **No, and only one capability uses it** → that capability's `web/`; promote when a second consumer appears.

DTO ownership is the placement signal — not "is it presentational". A component reading a capability's DTO from `shared/ui` is misplaced; move it.

## Naming

```
Entities       PascalCase nouns       Activity, Favorite, FeedQuery
Ports          IPascalCase            IActivityRepository, ILLMProvider
Adapters       <Tech>PascalCase       PrismaActivityRepository
Use cases      <Verb><Noun>UseCase    GetFeedUseCase, AddFavoriteUseCase
DTOs           PascalCaseDTO          ActivityDTO, FeedQueryDTO
Presets        SCREAMING_SNAKE_CASE   HOME_PRESET, CATEGORY_PRESETS
Errors         PascalCaseError        ActivityNotFoundError
Modules        kebab-case folders     activities, feed, favorites
```

## Verification commands

```
pnpm type-check   # tsc --noEmit
pnpm dep:check    # dependency-cruiser (layer DAG)
pnpm test         # vitest unit tests
pnpm lint         # eslint
pnpm build        # next build (catches Next-specific issues)
```

Run `type-check + dep:check + test` after every increment; add `build` before a finishing commit.

## graphify

Knowledge graph of the codebase at `graphify-out/`.

- For codebase questions, prefer `graphify query "<question>"` over raw grep when `graph.json` exists.
- `graphify path "<A>" "<B>"` for relationships, `graphify explain "<concept>"` for focused concepts.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review.
- After modifying code: `graphify update .` (AST-only, no API cost).
