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

## Code Exploration Policy

Always use jCodemunch-MCP tools for code navigation. Never fall back to Read, Grep, Glob, or Bash for code exploration.
**Exception:** Use `Read` when you need to edit a file — the agent harness requires a `Read` before `Edit`/`Write` will succeed. Use jCodemunch tools to *find and understand* code, then `Read` only the specific file you're about to modify.

**Start any session:**
1. `resolve_repo { "path": "." }` — confirm the project is indexed. If not: `index_folder { "path": "." }`
2. `suggest_queries` — when the repo is unfamiliar

**Finding code:**
- symbol by name → `search_symbols` (add `kind=`, `language=`, `file_pattern=`, `decorator=` to narrow)
- decorator-aware queries → `search_symbols(decorator="X")` to find symbols with a specific decorator (e.g. `@property`, `@route`); combine with set-difference to find symbols *lacking* a decorator (e.g. "which endpoints lack CSRF protection?")
- string, comment, config value → `search_text` (supports regex, `context_lines`)
- database columns (dbt/SQLMesh) → `search_columns`

**Reading code:**
- before opening any file → `get_file_outline` first
- one or more symbols → `get_symbol_source` (single ID → flat object; array → batch)
- symbol + its imports → `get_context_bundle`
- specific line range only → `get_file_content` (last resort)

**Repo structure:**
- `get_repo_outline` → dirs, languages, symbol counts
- `get_file_tree` → file layout, filter with `path_prefix`

**Relationships & impact:**
- what imports this file → `find_importers`
- where is this name used → `find_references`
- is this identifier used anywhere → `check_references`
- file dependency graph → `get_dependency_graph`
- what breaks if I change X → `get_blast_radius`
- what symbols actually changed since last commit → `get_changed_symbols`
- find unreachable/dead code → `find_dead_code`
- class hierarchy → `get_class_hierarchy`

## Session-Aware Routing

**Opening move for any task:**
1. `plan_turn { "repo": "...", "query": "your task description", "model": "<your-model-id>" }` — get confidence + recommended files; the `model` parameter narrows the exposed tool list to match your capabilities at zero extra requests.
2. Obey the confidence level:
   - `high` → go directly to recommended symbols, max 2 supplementary reads
   - `medium` → explore recommended files, max 5 supplementary reads
   - `low` → the feature likely doesn't exist. Report the gap to the user. Do NOT search further hoping to find it.

**Interpreting search results:**
- If `search_symbols` returns `negative_evidence` with `verdict: "no_implementation_found"`:
  - Do NOT re-search with different terms hoping to find it
  - Do NOT assume a related file (e.g. auth middleware) implements the missing feature (e.g. CSRF)
  - DO report: "No existing implementation found for X. This would need to be created."
  - DO check `related_existing` files — they show what's nearby, not what exists
- If `verdict: "low_confidence_matches"`: examine the matches critically before assuming they implement the feature

**After editing files:**
- If PostToolUse hooks are installed (Claude Code only), edited files are auto-reindexed
- Otherwise, call `register_edit` with edited file paths to invalidate caches and keep the index fresh
- For bulk edits (5+ files), always use `register_edit` with all paths to batch-invalidate

**Token efficiency:**
- If `_meta` contains `budget_warning`: stop exploring and work with what you have
- If `auto_compacted: true` appears: results were automatically compressed due to turn budget
- Use `get_session_context` to check what you've already read — avoid re-reading the same files

## Model-Driven Tool Tiering

Your jcodemunch-mcp server narrows the exposed tool list based on the model you are running as. To avoid wasting requests on primitives when a composite would do, always include `model="<your-model-id>"` in your opening `plan_turn` call.

Replace `<your-model-id>` with your active model:
- Claude Opus variants → `claude-opus-4-7` (or any `claude-opus-*`)
- Claude Sonnet variants → `claude-sonnet-4-6`
- Claude Haiku variants → `claude-haiku-4-5`
- GPT-4o / GPT-5 / o1 / Llama → use the model id as printed by your runner

The `model=` parameter rides on the existing `plan_turn` call — it does **not** add a separate tool invocation. If `plan_turn` is not appropriate for a non-code task, call `announce_model(model="...")` once instead.
