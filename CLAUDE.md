# CLAUDE.md — Engineering Guardrails

Single source of truth for what is allowed, what is forbidden, and which tool enforces it. Read this before opening a PR. If a rule is not enforceable by a tool, it does not belong here.

> **Stage:** personal POC. Single locale, single user, single deployment. Anything that does not serve "make Phase 1 work end-to-end" is out of scope until it does.

---

## 1. Architecture stance

- **Modular monolith.** One Next.js app at `apps/web`. Capabilities live under `apps/web/src/modules/<capability>/{domain,application,infra,web}`.
- **Capabilities are shared across pages.** A page (Home, Sport, Romantic, Food, Chat) is a thin composition of shared modules parameterized by a **preset**. If you find yourself copying a feature into a page-specific file, you are violating this rule.
- **Selective hexagonal.** Ports + adapters only for genuine external dependencies: DB, search, map, LLM, cache. Filters, sorting, ranking, presets, UI are not ports.
- **Modules are folders, not packages.** Promote a folder to a workspace package only when a second consumer (`apps/api`, `apps/mobile`) actually exists.

## 2. Layer DAG (enforced by `dependency-cruiser`)

```
web → application → domain
                 ↘
infra → domain     (infra implements ports declared in domain)
shared/* → domain | shared/*   (no upward edges)
```

**Forbidden edges** — CI fails if any of these appear:

- `domain → application | infra | web`
- `application → infra | web`
- `infra → web | application`
- `web → infra` (web only goes through application)
- Any cycle, anywhere.

**Cross-module edges** — also enforced:

- `chat/* → feed/*` allowed. The reverse is forbidden. *Chat consumes the feed; never the inverse.*
- `<page>/* → modules/*` allowed. `modules/* → app/*` forbidden.

## 3. Layer responsibilities

| Layer | Owns | Forbidden |
|---|---|---|
| `domain` | Entities, value objects, ports (interfaces), domain errors, pure business rules | Frameworks, HTTP, Prisma, React, env, time-of-day |
| `application` | Use cases, orchestration, error mapping, dependency wiring | Direct DB calls, HTTP routes, JSX |
| `infra` | Port adapters (Prisma, Mapbox, OpenAI, Redis, …) | Business rules, orchestration |
| `shared/contracts` | Pure types crossing the API/UI boundary (DTOs, view models) | Logic, methods, domain entities |
| `shared/presets` | Per-page configuration objects | Logic, data fetching, UI |
| `shared/ui` | Presentational React components consuming DTOs | Data fetching, business rules |
| `web` (Next.js `app/`) | Route handlers, page composition, hooks | Business rules, infrastructure details |

## 4. Naming

```
Entities       PascalCase nouns       Activity, Favorite, FeedQuery
Ports          IPascalCase            IActivityRepository, ILLMProvider
Adapters       <Tech>PascalCase       PrismaActivityRepository, MapboxAdapter
Use cases      <Verb><Noun>UseCase    GetFeedUseCase, AddFavoriteUseCase
DTOs           PascalCaseDTO          ActivityDTO, FeedQueryDTO
View models    PascalCaseVM           ActivityCardVM
Presets        SCREAMING_SNAKE_CASE   HOME_PRESET, SPORT_PRESET
Errors         PascalCaseError        ActivityNotFoundError
Modules        kebab-case folders     activities, feed, favorites
```

## 5. Contracts vs. entities

- A **DTO** describes a wire-shape. No methods, no defaults beyond literal values.
- An **entity** carries invariants and may have methods. Never serialize an entity directly. Map to a DTO at the boundary.
- A **view model** is the UI's shape. It may be a DTO with formatting applied.

## 6. Errors

- Domain throws `XxxError` (extends a small `DomainError` base).
- Application catches and maps to a typed result or rethrows.
- Web maps `DomainError` → HTTP status in one place (`app/api/_lib/error-handler.ts`).
- Never leak Prisma/OpenAI errors to the client.

## 7. Testing

- `domain/`: pure unit tests, no mocks. Target 90% line coverage.
- `application/`: integration tests with mocked ports. Target 80%.
- `infra/`: real or testcontainers-backed services. Critical paths only.
- `web/`: Playwright happy paths. No ambition for full coverage.

## 8. Tooling that enforces these rules (CI-blocking)

| Rule | Tool | Command |
|---|---|---|
| Layer DAG | `dependency-cruiser` | `pnpm dep:check` |
| Type safety | `tsc` | `pnpm type-check` |
| Lint | `eslint` (flat config) | `pnpm lint` |
| Format | `prettier` | `pnpm format:check` |
| Schema | `prisma` | `pnpm prisma validate` |
| Tests | `vitest` + `playwright` | `pnpm test` / `pnpm test:e2e` |
| Commits | `commitlint` + `husky` | pre-commit + commit-msg hooks |

A PR is mergeable only when all of the above pass.

## 9. Out of scope (POC)

These appear in no Phase 1 doc and require no scaffolding:

- i18n / dual locale routing / translation tables
- Quebec Loi 25 / Bill 96 compliance work
- Managed auth provider (Auth.js, Clerk). P1 ships with one seeded dev user.
- Sentry / Datadog / OpenTelemetry. `pino → stdout` is enough.
- Multi-tenant, SSO, SAML.
- Native mobile.

A future doc may reintroduce any of these. Until then, do not add scaffolding for them.

---

**Authority order:** CLAUDE.md > ARCHITECTURE.md > PRDs > everything else. If two docs disagree, the one earlier in this list wins; open a PR to fix the lower one.

**See also:** ARCHITECTURE.md (target shape), STEP_ZERO.md (bootstrap), spec.md (functional contract index).
