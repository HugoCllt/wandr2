# TBD ledger

Deferrals captured per `CLAUDE.md` §3.1. Nothing speculative ships in code; everything parked here gets picked up when its consumer exists. One bullet each.

## Assumptions

- **Single city / single user POC.** `User.cityId` and `Activity.cityId` are required; the feed is scoped to the connected user's city. Multi-city is out of scope. — spec `2026-05-23-activities-db-ingestion-design.md` §1.
- **Montréal bbox is approximate** (`lat 45.40–45.71`, `lng -73.98 to -73.47`). Tighten with real bounds before relying on it to reject Tavily results. — `prisma/seed.ts`, `City` model.
- **`dedupeKey` uses UTC day + 3-decimal coord rounding (~100 m).** Fuzzy/spelling-variant matching deferred. — `computeDedupeKey.ts`, spec §5/§9.
- **Event expiry compares in UTC.** `City.timezone` is stored but unused until tz-aware "is it past?" logic is needed. — spec §4.1.
- **No authorization on the ingestion MCP server.** stdio = OS-process isolation, no network surface to protect (spec plan-2 Q4). Revisit (bearer token) only if the server is ever exposed over HTTP/remote. — `src/mcp/server.ts`.
- **Dedicated Prisma client in `src/mcp/db.ts`.** The MCP process does not reuse the shared `src/shared/db/prisma.ts` singleton because its string-form `log` writes to stdout (corrupts JSON-RPC). Reconcile the two clients if/when the `apps/web` + `apps/mcp` split happens. — `src/mcp/db.ts`, spec plan-2 §3.

## Future changes

- **Wire the profile page to the DB.** `User.gender`/`User.birthDate` are now persisted (initial user: Hugo Coeuillet, Montréal, MALE, 2000-06-28) **but nothing reads them yet** — `ProfilePage`/`GetProfileViewUseCase` still use `MockProfileRepository` (hardcoded "Étienne Lavoie"). Build a `PrismaProfileRepository` that reads the real user (name, city, gender, computed age) and surface those fields in `UserProfile`/`ProfileViewDTO`. Also do **not** add `gender`/`birthDate` to `CurrentUser`/`getCurrentUser` until a reader exists. — `src/modules/profile/infra/MockProfileRepository.ts`, `UserProfile.ts`, `src/shared/auth/current-user.ts`.
- **Expose city in `ActivityDTO`** (`{ slug, name }`, not the opaque `cityId`) once a multi-city UI / city switcher exists. Today the city flows server-side from the connected user; the DTO carries only `tags`.
- **Split monorepo `apps/web` + `apps/mcp`.** The ingestion MCP server ships in `src/mcp/` for now (spec plan-2 Q2); reconcile with `CLAUDE.md` §4's `apps/web` naming when a real second deploy target exists. — `src/mcp/`.
- **Rename `listActivitiesDueForRecheck` → `listPlacesDueForRecheck`.** Today it only ever returns PLACEs (EVENTs have no `recheckAfter`); keep the generic name unless EVENT re-verification is ever added, then rename for clarity. — `src/mcp/tools/listActivitiesDueForRecheck.ts`.
- **Return `structuredContent` from the MCP tools.** Currently tools return JSON in a text content block (uniform across tools; the array-returning `listActivitiesDueForRecheck` would otherwise need an `{items:[]}` wrapper). Add `structuredContent` + `outputSchema` if a client benefits from typed structured output. — `src/mcp/runTool.ts`.
- **Extract `modules/ingestion/`** from `modules/activities/` if the staging/promotion surface grows a second consumer. — CLAUDE.md §4.
- **Recheck orchestration** is agent-driven (judgment in the agent, not in code); only `findDueForRecheck`/`confirmActivity`/`archive` live here.

## Hardcoded

- **`RECHECK_INTERVAL_DAYS = 90`** for PLACE re-verification cadence. — `src/modules/activities/domain/freshness.ts`, spec §6.
- **Default city slug `'montreal'`** in the admin create route when `citySlug` is omitted. — `adminActivityRoute.ts`.
- **`tags: []`** on every seeded activity (no theme tagging yet; agents will populate later). — `prisma/seed.ts`.
- **`MockProfileRepository`** returns fully hardcoded profile data. — see Future changes.
- **`STAGED_DEDUPE_KEY = 'pending-promotion'`** written by `ingestActivity` as the candidate's staging dedupeKey; the authoritative key is recomputed inside `PromoteCandidateUseCase` (cannot be computed at staging — `computeDedupeKey` throws for an EVENT without dateStart). — `src/mcp/tools/ingestActivity.ts`, spec plan-2 §8.
- **`.mcp.json` uses a Windows `cmd /c pnpm` launcher.** On POSIX, drop `"cmd", "/c"` and set `"command": "pnpm"`. — `.mcp.json`.
- **`PLACEHOLDER_IMAGE_URL = '/placeholder-activity.svg'`** rendered by every card + the modal when an activity has no image. `imageUrl` is now nullable end-to-end (MCP schema, `ExtractedActivityPayload`, `Activity`, Prisma `String?`, `ActivityDTO`, admin route). The fallback lives in the web layer (`coverImageUrl` in `cards/helpers.ts`), so the DTO stays truthfully nullable. Swap the static SVG for a real placeholder asset / per-category treatment if richer "no image" UX is ever wanted. — `src/modules/activities/web/cards/helpers.ts`, `public/placeholder-activity.svg`.
