# TBD ledger

Deferrals captured per `CLAUDE.md` §3.1. Nothing speculative ships in code; everything parked here gets picked up when its consumer exists. One bullet each.

## Assumptions

- **Single city / single user POC.** `User.cityId` and `Activity.cityId` are required; the feed is scoped to the connected user's city. Multi-city is out of scope. — spec `2026-05-23-activities-db-ingestion-design.md` §1.
- **Montréal bbox is approximate** (`lat 45.40–45.71`, `lng -73.98 to -73.47`). Tighten with real bounds before relying on it to reject Tavily results. — `prisma/seed.ts`, `City` model.
- **`dedupeKey` uses UTC day + 3-decimal coord rounding (~100 m).** Fuzzy/spelling-variant matching deferred. — `computeDedupeKey.ts`, spec §5/§9.
- **Event expiry compares in UTC.** `City.timezone` is stored but unused until tz-aware "is it past?" logic is needed. — spec §4.1.

## Future changes

- **Wire the profile page to the DB.** `User.gender`/`User.birthDate` are now persisted (initial user: Hugo Coeuillet, Montréal, MALE, 2000-06-28) **but nothing reads them yet** — `ProfilePage`/`GetProfileViewUseCase` still use `MockProfileRepository` (hardcoded "Étienne Lavoie"). Build a `PrismaProfileRepository` that reads the real user (name, city, gender, computed age) and surface those fields in `UserProfile`/`ProfileViewDTO`. Also do **not** add `gender`/`birthDate` to `CurrentUser`/`getCurrentUser` until a reader exists. — `src/modules/profile/infra/MockProfileRepository.ts`, `UserProfile.ts`, `src/shared/auth/current-user.ts`.
- **Expose city in `ActivityDTO`** (`{ slug, name }`, not the opaque `cityId`) once a multi-city UI / city switcher exists. Today the city flows server-side from the connected user; the DTO carries only `tags`.
- **Ingestion MCP server** (agent-facing tools wrapping the use cases). — plan: `docs/superpowers/specs/2026-05-23-ingestion-mcp-server-design.md`.
- **Extract `modules/ingestion/`** from `modules/activities/` if the staging/promotion surface grows a second consumer. — CLAUDE.md §4.
- **Recheck orchestration** is agent-driven (judgment in the agent, not in code); only `findDueForRecheck`/`confirmActivity`/`archive` live here.

## Hardcoded

- **`RECHECK_INTERVAL_DAYS = 90`** for PLACE re-verification cadence. — `src/modules/activities/domain/freshness.ts`, spec §6.
- **Default city slug `'montreal'`** in the admin create route when `citySlug` is omitted. — `adminActivityRoute.ts`.
- **`tags: []`** on every seeded activity (no theme tagging yet; agents will populate later). — `prisma/seed.ts`.
- **`MockProfileRepository`** returns fully hardcoded profile data. — see Future changes.
