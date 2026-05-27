# TBD ledger

Deferrals captured per `CLAUDE.md` §3.1. Nothing speculative ships in code; everything parked here gets picked up when its consumer exists. One bullet each.

## Assumptions

- **Single city / single user POC.** `User.cityId` and `Activity.cityId` are required; the feed is scoped to the connected user's city. Multi-city is out of scope. — spec `2026-05-23-activities-db-ingestion-design.md` §1.
- **Montréal bbox is approximate** (`lat 45.40–45.71`, `lng -73.98 to -73.47`). Tighten with real bounds before relying on it to reject Tavily results. — `prisma/seed.ts`, `City` model.
- **`dedupeKey` uses UTC day + 3-decimal coord rounding (~100 m).** Fuzzy/spelling-variant matching deferred. — `computeDedupeKey.ts`, spec §5/§9.
- **Event expiry compares in UTC.** `City.timezone` is stored but unused until tz-aware "is it past?" logic is needed. — spec §4.1.
- **No authorization on the ingestion MCP server.** stdio = OS-process isolation, no network surface to protect (spec plan-2 Q4). Revisit (bearer token) only if the server is ever exposed over HTTP/remote. — `src/mcp/server.ts`.
- **Dedicated Prisma client in `src/mcp/db.ts`.** The MCP process does not reuse the shared `src/shared/db/prisma.ts` singleton because its string-form `log` writes to stdout (corrupts JSON-RPC). Reconcile the two clients if/when the `apps/web` + `apps/mcp` split happens. — `src/mcp/db.ts`, spec plan-2 §3.
- **Feed ranking is a weighted average of affinity over the category set** (primary ×1, each secondary ×0.5, normalized by `1 + 0.5·|secondary|`). Anonymous users (empty affinity) score `DEFAULT_MATCH_SCORE` regardless of set size. — `src/modules/feed/application/ranking/p1.ts`, spec `2026-05-25-multi-category-activities-design.md` §2.
- **Cross-scout `DUPLICATE` keeps the first ingester's category set** (no merge); `computeDedupeKey` ignores category, so a duplicate only refreshes freshness. Cross-scout consistency is steered by the scout prompt's classification rule, not by code. — `PromoteCandidateUseCase.ts`, `.claude/agents/wandr-theme-scout.md`, spec §6 decision #6.
- **`cursor-codec` `matchScore` is a bounded float** (`z.number().min(0).max(10)`, was `.int()`) to carry the weighted score; the same computed float is the sort key and the cursor key. — `src/modules/feed/application/cursor-codec.ts`, spec §2.
- **Seed upserts on `cityId_dedupeKey`** (since `externalId` was dropped); `dedupeKey` is computed in the loop. — `prisma/seed.ts`, spec §5.

## Future changes

- **Wire the profile page to the DB.** `User.gender`/`User.birthDate` are now persisted (initial user: Hugo Coeuillet, Montréal, MALE, 2000-06-28) **but nothing reads them yet** — `ProfilePage`/`GetProfileViewUseCase` still use `MockProfileRepository` (hardcoded "Étienne Lavoie"). Build a `PrismaProfileRepository` that reads the real user (name, city, gender, computed age) and surface those fields in `UserProfile`/`ProfileViewDTO`. Also do **not** add `gender`/`birthDate` to `CurrentUser`/`getCurrentUser` until a reader exists. — `src/modules/profile/infra/MockProfileRepository.ts`, `UserProfile.ts`, `src/shared/auth/current-user.ts`.
- **Expose city in `ActivityDTO`** (`{ slug, name }`, not the opaque `cityId`) once a multi-city UI / city switcher exists. Today the city flows server-side from the connected user; the DTO does not carry city at all.
- **Attribute `UserCategoryAffinity` to the primary category** when user actions (favorite/calendar) start writing affinity. No code writes affinity today (only `seed.ts`), so this is parked until a writer exists. — spec `2026-05-25-multi-category-activities-design.md` §6.
- **Split monorepo `apps/web` + `apps/mcp`.** The ingestion MCP server ships in `src/mcp/` for now (spec plan-2 Q2); reconcile with `CLAUDE.md` §4's `apps/web` naming when a real second deploy target exists. — `src/mcp/`.
- **Rename `listActivitiesDueForRecheck` → `listPlacesDueForRecheck`.** Today it only ever returns PLACEs (EVENTs have no `recheckAfter`); keep the generic name unless EVENT re-verification is ever added, then rename for clarity. — `src/mcp/tools/listActivitiesDueForRecheck.ts`.
- **Return `structuredContent` from the MCP tools.** Currently tools return JSON in a text content block (uniform across tools; the array-returning `listActivitiesDueForRecheck` would otherwise need an `{items:[]}` wrapper). Add `structuredContent` + `outputSchema` if a client benefits from typed structured output. — `src/mcp/runTool.ts`.
- **Extract `modules/ingestion/`** from `modules/activities/` if the staging/promotion surface grows a second consumer. — CLAUDE.md §4.
- **Recheck orchestration** is agent-driven (judgment in the agent, not in code); only `findDueForRecheck`/`confirmActivity`/`archive` live here.
- **Tavily MCP for ingestion search.** MVP uses native WebSearch/WebFetch in `wandr-theme-scout`; revisit Tavily only if native extraction recall/precision plateaus. — `.claude/agents/wandr-theme-scout.md`, spec `2026-05-23-ingestion-agents-mvp-spec.md` §11.
- **Scheduling (cron) of ingestion/recheck runs.** MVP is user-launched slash commands only; no automatic trigger. — spec §11.
- **`getCity(slug)` MCP tool / real multi-city.** Scouts derive the search term by de-slugifying and rely on the MCP `REJECTED`/bbox loop for coord validity; a `getCity` tool would give better search terms + first-try coords once multi-city exists. — spec §9.1.
- **Persist "dropped" findings for audit.** A drop lacks the required fields of an `ExtractedActivityPayload`, so persisting it needs a partial-candidate schema — speculative, out of MVP. — spec §11.
- **`lead-*` orchestrator agent.** If an orchestrator ever becomes an *agent* (not a slash command) that spawns sub-agents, it must be named `lead-*`; blocked until Claude Code lets a sub-agent spawn its own sub-agents. — spec §2 (Nommage `lead-*`) / §11.
- **Prompt optimization (recall/precision, few-shot, tuning)** for scouts/verifiers — explicitly the non-MVP. — spec §11.

## Hardcoded

- **`RECHECK_INTERVAL_DAYS = 90`** for PLACE re-verification cadence. — `src/modules/activities/domain/freshness.ts`, spec §6.
- **Default city slug `'montreal'`** in the admin create route when `citySlug` is omitted. — `adminActivityRoute.ts`.
- **No GIN index on `Activity.categories Json`.** The feed query ORs JSON-path filters (`primary equals` / `secondary array_contains`); fine at POC scale. Add a GIN index (and revisit the where-clause) if data grows. — `PrismaActivityRepository.findCandidates`, `prisma/schema.prisma`, spec §4.
- **`SPORT` is absent from `CATEGORY_PRESETS`** (5 keys, no `sport`); SPORT lives in a separate `SPORT_PRESET` + `/sport` page. Flagged, not actioned — surfaced for the user. — spec §0 field audit.
- **`MockProfileRepository`** returns fully hardcoded profile data. — see Future changes.
- **`STAGED_DEDUPE_KEY = 'pending-promotion'`** written by `ingestActivity` as the candidate's staging dedupeKey; the authoritative key is recomputed inside `PromoteCandidateUseCase` (cannot be computed at staging — `computeDedupeKey` throws for an EVENT without dateStart). — `src/mcp/tools/ingestActivity.ts`, spec plan-2 §8.
- **`.mcp.json` uses a Windows `cmd /c pnpm` launcher.** On POSIX, drop `"cmd", "/c"` and set `"command": "pnpm"`. — `.mcp.json`.
- **`PLACEHOLDER_IMAGE_URL = '/placeholder-activity.svg'`** rendered by every card + the modal when an activity has no image. `imageUrl` is now nullable end-to-end (MCP schema, `ExtractedActivityPayload`, `Activity`, Prisma `String?`, `ActivityDTO`, admin route). The fallback lives in the web layer (`coverImageUrl` in `cards/helpers.ts`), so the DTO stays truthfully nullable. Swap the static SVG for a real placeholder asset / per-category treatment if richer "no image" UX is ever wanted. — `src/modules/activities/web/cards/helpers.ts`, `public/placeholder-activity.svg`.
