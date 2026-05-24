# CLAUDE.md — Engineering Guardrails

Single source of truth for working principles, architecture rules, and tooling. Read this before opening a PR.

> **Stage:** personal POC. Single locale, single user, single deployment. Anything that does not serve "make Phase 1 work end-to-end" is out of scope until it does.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

For multi-step tasks, state a brief plan before starting:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

## 3.1 Track deferrals in `tbd.md`

**Nothing speculative in the code (§2) — but nothing silently forgotten either.**

Every **assumption**, **planned future change**, or **hardcoded value** you introduce goes in `tbd.md` at the repo root, one bullet each, grouped under `## Assumptions`, `## Future changes`, `## Hardcoded`. Before adding a column, flag, default, or constant "for later," write the bullet instead of the code. Reference the `file:line` when it exists, and link the spec/plan that motivated it. Review `tbd.md` before each plan so deferrals get picked up when their consumer finally exists.

---

## 4. Architecture stance

- **Modular monolith.** One Next.js app at `apps/web`. Capabilities live under `apps/web/src/modules/<capability>/{domain,application,infra,web}`.
- **Capabilities are shared across pages.** A page (Home, Sport, Romantic, Food, Chat) is a thin composition of shared modules parameterized by a **preset**. If you find yourself copying a feature into a page-specific file, you are violating this rule.
- **Selective hexagonal.** Ports + adapters only for genuine external dependencies: DB, search, map, LLM, cache. Filters, sorting, ranking, presets, UI are not ports.
- **Modules are folders, not packages.** Promote a folder to a workspace package only when a second consumer (`apps/api`, `apps/mobile`) actually exists.

## 5. Layer DAG (enforced by `dependency-cruiser`)

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
- `shared/ui → shared/contracts` — **`shared/ui` is DTO-free.** A component that reads a DTO belongs to its capability's `web/`, not the shared bin. This is the teeth behind the §6 placement rule; it stops the shared grab-bag from reforming.
- Any cycle, anywhere.

**Cross-module edges** — also enforced:

- `chat/* → feed/*` allowed. The reverse is forbidden. *Chat consumes the feed; never the inverse.*
- `<page>/* → modules/*` allowed. `modules/* → app/*` forbidden.
- A capability's `web/` may import another capability's `web/` (e.g. an activity card embedding a `FavoriteButton`), **but the capability graph must stay acyclic.** `activities` is the core noun — `feed`, `calendar`, `favorites` depend on it; it must not depend back on them. *Known debt: `activities → calendar` / `activities → favorites` exist because cards embed action buttons. Resolve by passing actions in as props (see card deepening), then this becomes enforceable.*

## 6. Layer responsibilities

| Layer | Owns | Forbidden |
|---|---|---|
| `domain` | Entities, value objects, ports (interfaces), domain errors, pure business rules | Frameworks, HTTP, Prisma, React, env, time-of-day |
| `application` | Use cases, orchestration, error mapping, dependency wiring | Direct DB calls, HTTP routes, JSX |
| `infra` | Port adapters (Prisma, Mapbox, OpenAI, Redis, …) | Business rules, orchestration |
| `shared/contracts` | Pure types crossing the API/UI boundary (DTOs, view models) | Logic, methods, domain entities |
| `shared/presets` | Per-page configuration objects | Logic, data fetching, UI |
| `shared/ui` | Presentational React **primitives** — DTO-free, used by ≥2 capabilities (icons, decor, formatters, layout chrome like `Nav`) | Data fetching, business rules, **capability-specific UI** |
| `modules/<cap>/web` | A capability's own UI + route handlers — components that consume that capability's DTO | Business rules, infrastructure details |
| `web` (Next.js `app/`) | Route handlers, page composition, hooks | Business rules, infrastructure details |

**Component placement rule** — where does a `.tsx` go? One question decides it:

> *Does the component consume a capability's DTO (e.g. `ActivityDTO`, `FilterValueDTO`, `CalendarEntryDTO`)?*
> **Yes** → it lives in that capability's `modules/<cap>/web/`.
> **No, and ≥2 capabilities use it** → `shared/ui`.
> **No, and only one capability uses it** → that capability's `web/` anyway; promote to `shared/ui` when a second consumer appears.

"Presentational" is not a placement signal — almost every component is presentational. **DTO ownership is the signal.** A component marooned in `shared/ui` while it reads one capability's DTO is misplaced; move it.

## 7. Naming

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