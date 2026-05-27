# Multi-category activities + Activity-schema slim-down — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `Activity`'s single `category` enum with a JSONB **category set** `{ primary, secondary[] }` (1 primary + 0–2 distinct secondary), drop four unused fields (`imageCredit`, `tags`, `externalId`, and `sourceId` *from the DTO only*), and propagate the new shape across DB → domain → application → infra → contracts → web → MCP → agents → seed/tests — so one activity surfaces in **every** feed matching any of its categories, ranked by a weighted average of affinity over the set.

**Architecture:** A cross-cutting type migration through the layer DAG (`web → application → domain`, `infra → domain`). The breaking change is the domain rename `Activity.category → Activity.categories`; once it lands, project-wide `type-check` is RED until every consumer is migrated. Tasks are ordered domain-first (foundation) → infra → application/contracts/web/mcp → agents → seed → test fixtures, matching the dependency graph bottom-up. The invariant (`primary ∉ secondary`, secondary 0–2 distinct) lives in **one** place — the domain `validateCategorySet`; Zod schemas at the MCP/admin boundaries do **structural shape only**.

**Source spec:** `docs/superpowers/specs/2026-05-25-multi-category-activities-design.md` (decisions locked there; this plan transcribes them into ordered, verifiable tasks). Read the spec's "Locked decisions" and "Field audit" before starting.

---

## Verification model (read first)

This is a breaking type rename, so the usual "type-check green after every task" rule does **not** hold mid-migration:

- **Project-wide `type-check` (`tsc --noEmit`) is RED from Task 3 until Task 13.** That is expected and correct — do not "fix" it by half-measures or by reverting the domain change.
- **Vitest transpiles only a test file's import graph**, so per-file unit/integration tests pass before the whole project compiles. This is what makes the spec's *test-first* sequencing real: the BOTH-feeds integration test (Task 1) and the invariant test (Task 2) go green long before `type-check` does.
- Run targeted tests by file during the migration (e.g. `pnpm vitest run <file>`, `pnpm vitest run --config vitest.integration.config.ts <file>`). The **full suite** (`test`, `test:integration`, `type-check`, `dep:check`, `prisma:validate`, `db:push`, `db:seed`) is the **final checkpoint** (spec §7).

**Scripts** (from `package.json`): `type-check`, `test`, `test:integration`, `dep:check`, `prisma:validate`, `db:push`, `db:seed`.

---

## File map

| Layer | File | Change |
|---|---|---|
| test (first) | `src/modules/activities/infra/PrismaActivityRepository.findCandidatesByCategorySet.integration.test.ts` | **NEW** — BOTH-feeds proof |
| domain | `src/modules/activities/domain/ActivityCategorySet.ts` (+ `.test.ts`) | **NEW** — VO + invariant |
| domain | `src/modules/activities/domain/Activity.ts` | `category → categories`; delegate validation; drop 3 fields |
| domain | `src/modules/activities/domain/RawActivityCandidate.ts` | payload `category → categories`; drop `imageCredit`/`tags` |
| schema | `prisma/schema.prisma` | `categories Json`; drop fields/index/unique |
| infra | `src/modules/activities/infra/PrismaActivityRepository.ts` | JSON where-clause; `create`/`toActivity` |
| infra | `src/modules/activities/infra/PrismaCandidateRepository.ts` | payload mapping |
| application | `src/modules/feed/application/ranking/p1.ts` (+ `.test.ts`) | weighted average |
| application | `src/modules/feed/application/cursor-codec.ts` (+ `.test.ts`) | `matchScore` int → float |
| application | `src/modules/activities/application/PromoteCandidateUseCase.ts` | `categories`; drop 3 fields |
| application | `src/modules/activities/application/CreateActivityUseCase.ts` | verify flows via `ActivityCreateInput` |
| contracts | `src/shared/contracts/ActivityDTO.ts` | `categories` (reuse domain type); drop 3 DTO fields |
| contracts | `src/shared/contracts/toActivityDTO.ts` | map `categories`; drop 3 fields |
| web | `src/modules/activities/web/adminActivityRoute.ts` | Zod `categories` object; drop 3 fields |
| web | `src/modules/chat/web/chatMessagesRoute.ts` | reshape 2 mock DTOs |
| mcp | `src/mcp/tools/ingestActivity.ts` | `payloadSchema.categories`; French description |
| agents | `.claude/agents/wandr-theme-scout.md` | classification rule (French) |
| seed | `prisma/seed.ts` | `categories`; upsert key; 3 real secondaries |
| tests | 8 use-case/MCP test files | mechanical fixture updates |
| docs | `tbd.md` | 7 deferral bullets |

**Unchanged (verified):** `FilterValue.category` and `ActivityCandidateCriteria.categories` are already `ActivityCategory[]`; `RawActivityCandidate.category` (search theme) stays single; `UserCategoryAffinity`; `wandr-ingest.md`/`wandr-recheck.md`/`wandr-recheck-verifier.md` (no payload/category contract). PromoteCandidate already does first-write-wins **refresh** via `findByCityAndDedupeKey`/`refreshFreshness` — **no merge logic is added** (decision #6).

---

## Task 1: RED — author the BOTH-feeds integration test

*Written first per the spec's sequencing: real proof of the JSON where-clause + the BOTH-feeds success criterion, before any propagation.*

**Files:**
- Create: `src/modules/activities/infra/PrismaActivityRepository.findCandidatesByCategorySet.integration.test.ts`

Model it on the sibling `PrismaActivityRepository.findDueForRecheck.integration.test.ts` (same harness, real Postgres, serial).

- [ ] **Step 1 (RED):** Write a test that seeds one activity `{ primary: 'FOOD', secondary: ['ROMANTIC'] }` and asserts it is returned by **both** `findCandidates({ categories: ['FOOD'] })` **and** `findCandidates({ categories: ['ROMANTIC'] })` (and *not* by `findCandidates({ categories: ['SPORT'] })`).
- [ ] **Step 2:** Run `pnpm vitest run --config vitest.integration.config.ts <file>`. Expect **FAIL** — the `categories` column/where-clause does not exist yet (this is the correct RED).

**Acceptance criteria:**
- [ ] Test exists and fails for the right reason (missing `categories` shape / where-clause), not a harness/DB error.

**Verification:** `pnpm vitest run --config vitest.integration.config.ts src/modules/activities/infra/PrismaActivityRepository.findCandidatesByCategorySet.integration.test.ts` → red.
**Dependencies:** None. **Scope:** S.

---

## Task 2: Domain — `ActivityCategorySet` VO + invariant test

*Success-criterion test for the domain invariant.*

**Files:**
- Create: `src/modules/activities/domain/ActivityCategorySet.ts`
- Create: `src/modules/activities/domain/ActivityCategorySet.test.ts`

- [ ] **Step 1:** Define `ActivityCategorySet = { primary: ActivityCategory; secondary: ActivityCategory[] }`, plus:
  - `validateCategorySet(set)` — throws on violation: `primary ∈ ActivityCategories`; `secondary` is an array len **0–2**, each `∈ ActivityCategories`, entries **distinct**, and **`primary ∉ secondary`**. (⇒ total distinct = `1 + secondary.length`, 1–3.)
  - `categorySetToArray(set): ActivityCategory[]` → `[primary, ...secondary]`.
- [ ] **Step 2:** Test branches: valid `{FOOD,[ROMANTIC]}`; valid `{FOOD,[]}`; reject `primary ∈ secondary`; reject `secondary.length > 2`; reject duplicate secondary; reject invalid enum.
- [ ] **Step 3 (GREEN):** `pnpm vitest run src/modules/activities/domain/ActivityCategorySet.test.ts`.

**Acceptance criteria:**
- [ ] All invariant branches covered and passing. `ActivityCategory`/`ActivityCategories` reused from `Activity.ts` (not redefined).

**Verification:** targeted vitest GREEN.
**Dependencies:** None. **Scope:** S.

---

## Task 3: Domain — migrate the `Activity` entity + candidate payload

**Files:**
- Edit: `src/modules/activities/domain/Activity.ts`
- Edit: `src/modules/activities/domain/RawActivityCandidate.ts`

- [ ] **Step 1:** `Activity.ts`: `category: ActivityCategory → categories: ActivityCategorySet`; `validateActivity` delegates category checks to `validateCategorySet(activity.categories)`; **drop** `imageCredit`, `tags`, `externalId` from the entity type and validation. **Keep** `sourceId` (needed by `create`). `ActivityCreateInput = Omit<Activity, 'id'|'createdAt'|'updatedAt'>` carries the new shape automatically.
- [ ] **Step 2:** `RawActivityCandidate.ts`: `ExtractedActivityPayload.category → categories: ActivityCategorySet`; drop `imageCredit`/`tags` from the payload. `RawActivityCandidate.category` (the search **theme**) stays single.

**Acceptance criteria:**
- [ ] Domain types reflect the set; no `imageCredit`/`tags`/`externalId` on `Activity` or `ExtractedActivityPayload`.
- [ ] Tasks 2 tests still green; project-wide `type-check` now RED (expected — resolved by Tasks 5–13).

**Verification:** `pnpm vitest run src/modules/activities/domain/ActivityCategorySet.test.ts` green; note the expected app-wide type errors.
**Dependencies:** Task 2. **Scope:** M.

---

## Task 4: Schema + `db push`

**Files:**
- Edit: `prisma/schema.prisma`

- [ ] **Step 1:** On `Activity`: `category ActivityCategory → categories Json`; **drop** `imageCredit`, `tags`, `externalId`; **drop** `@@unique([sourceId, externalId])` and `@@index([category, dateStart])`. **Keep** `sourceId` + `Source` relation, `dedupeKey` + `@@unique([cityId, dedupeKey])`, and all freshness/status fields + indexes (`status`, `expiresAt`, `lastSeenAt`, `lastVerifiedAt`, `recheckAfter`).
- [ ] **Step 2:** Leave `RawActivityCandidate.category` (theme) and `UserCategoryAffinity` unchanged. No GIN index on `categories` (POC scale — see Task 14).
- [ ] **Step 3:** `pnpm prisma:validate` then `pnpm db:push` (no migrations dir — POC; data is reseeded in Task 12, not backfilled).

**Acceptance criteria:**
- [ ] `prisma:validate` passes; `db:push` applies cleanly; generated client exposes `categories: Json`.

**Verification:** `pnpm prisma:validate && pnpm db:push`.
**Dependencies:** Task 3. **Scope:** S.

---

## Task 5: Infra — repository JSON where-clause + mappers → integration test GREEN

*Foundation checkpoint: storage + query proven by Task 1.*

**Files:**
- Edit: `src/modules/activities/infra/PrismaActivityRepository.ts`
- Edit: `src/modules/activities/infra/PrismaCandidateRepository.ts`

- [ ] **Step 1:** `findCandidates`: replace `where.category = { in: criteria.categories }` with a push into the existing `and` array (so it ANDs with status/city/kind/etc.):
  ```ts
  if (criteria.categories && criteria.categories.length > 0) {
    const cats = criteria.categories;
    and.push({
      OR: [
        ...cats.map((c) => ({ categories: { path: ['primary'],   equals: c } })),
        ...cats.map((c) => ({ categories: { path: ['secondary'], array_contains: c } })),
      ],
    });
  }
  ```
- [ ] **Step 2:** `create`: write `categories` as JSON; drop `imageCredit`/`tags`/`externalId`. `toActivity`: cast `Prisma.JsonValue → ActivityCategorySet` **without re-validating** (validation happens on write only, as today); drop the 3 fields.
- [ ] **Step 3:** `PrismaCandidateRepository.ts`: map `extractedPayload` to the new payload shape; candidate `category` (theme) unchanged.
- [ ] **Step 4 (GREEN):** run the Task 1 integration test — it now passes for **both** feeds.

**Acceptance criteria:**
- [ ] Task 1 integration test green. An activity `{FOOD,[ROMANTIC]}` is returned for `['FOOD']` and `['ROMANTIC']`, excluded for `['SPORT']`.

**Verification:** `pnpm vitest run --config vitest.integration.config.ts src/modules/activities/infra/PrismaActivityRepository.findCandidatesByCategorySet.integration.test.ts` → green.

### ✅ Checkpoint: storage/query foundation proven
- [ ] The JSON category-set storage and the BOTH-feeds query both work end-to-end before any further propagation.

**Dependencies:** Task 4. **Scope:** M.

---

## Task 6: Application — weighted-average ranking + cursor float

**Files:**
- Edit: `src/modules/feed/application/ranking/p1.ts` · Edit: `src/modules/feed/application/ranking/p1.test.ts`
- Edit: `src/modules/feed/application/cursor-codec.ts` · Edit: `src/modules/feed/application/cursor-codec.test.ts`

- [ ] **Step 1:** `p1.ts` — replace `affinityMap.get(activity.category) ?? DEFAULT_MATCH_SCORE` with the weighted average:
  ```ts
  const aff = (c) => affinityMap.get(c) ?? DEFAULT_MATCH_SCORE;
  const { primary, secondary } = activity.categories;
  const matchScore =
    (aff(primary) + 0.5 * secondary.reduce((s, c) => s + aff(c), 0)) /
    (1 + 0.5 * secondary.length);
  ```
  Primary dominates ×1, each secondary ×0.5, normalized → stays on 0–9; anonymous (empty map) → `DEFAULT_MATCH_SCORE` for every activity regardless of set size. Tie-break order (featured → matchScore → dateStart → createdAt → id) unchanged.
- [ ] **Step 2:** `cursor-codec.ts` — relax `matchScore: z.number().int().min(0).max(10)` → `z.number().min(0).max(10)` (drop `.int()`), else float scores silently reset pagination.
- [ ] **Step 3:** `p1.test.ts` — assert `{ROMANTIC(3),[FOOD(9)]} → (3 + 0.5·9)/1.5 = 5.0`; `{FOOD(9),[]} → 9`; anonymous → `DEFAULT_MATCH_SCORE` regardless of set size. `cursor-codec.test.ts` — a float `matchScore` round-trips through encode/decode.

**Acceptance criteria:**
- [ ] Both targeted tests green; the same computed float is used for sort key and cursor key.

**Verification:** `pnpm vitest run src/modules/feed/application/ranking/p1.test.ts src/modules/feed/application/cursor-codec.test.ts`.
**Dependencies:** Task 3. **Scope:** M.

---

## Task 7: Application — use cases

**Files:**
- Edit: `src/modules/activities/application/PromoteCandidateUseCase.ts`
- Edit: `src/modules/activities/application/CreateActivityUseCase.ts`

- [ ] **Step 1:** `PromoteCandidateUseCase.ts` — `baseInput.category → categories: payload.categories`; **remove** the `imageCredit`, `tags`, and `externalId: null` lines. **Do not** add DUPLICATE-merge logic — the existing first-write-wins refresh (`findByCityAndDedupeKey` → `refreshFreshness`) stays (decision #6).
- [ ] **Step 2:** `CreateActivityUseCase.ts` — confirm it flows through via `ActivityCreateInput`/spread with **no** direct reference to a dropped field (`imageCredit`/`tags`/`externalId`).

**Acceptance criteria:**
- [ ] Both use cases construct the new shape; no dropped-field references remain.

**Verification:** targeted compile/test in Task 13; no merge branch added.
**Dependencies:** Task 3. **Scope:** S.

---

## Task 8: Contracts — DTO + mapper

**Files:**
- Edit: `src/shared/contracts/ActivityDTO.ts` · Edit: `src/shared/contracts/toActivityDTO.ts`

- [ ] **Step 1:** `ActivityDTO.ts` — `category → categories: ActivityCategorySet`, **reusing the domain type** (the DTO already imports `ActivityCategory` from domain; the DAG allows `shared/contracts → domain`). Drop `imageCredit`, `tags`, `sourceId`. (`externalId` is already absent from the DTO consumer set — confirm it is dropped if present.)
- [ ] **Step 2:** `toActivityDTO.ts` — map `categories: activity.categories`; drop the dropped fields.

**Acceptance criteria:**
- [ ] DTO carries the full set via the domain type; `imageCredit`/`tags`/`sourceId` gone from the DTO.

**Verification:** compiles after Tasks 9–13; covered by use-case tests in Task 13.
**Dependencies:** Task 3. **Scope:** S.

---

## Task 9: Web — admin + chat routes

**Files:**
- Edit: `src/modules/activities/web/adminActivityRoute.ts`
- Edit: `src/modules/chat/web/chatMessagesRoute.ts`

- [ ] **Step 1:** `adminActivityRoute.ts` — Zod `category` → **required** `categories: z.object({ primary: z.enum(ActivityCategories), secondary: z.array(z.enum(ActivityCategories)).max(2).default([]) })` (mirrors the MCP schema; structural shape only — the full invariant stays in the domain). Drop `imageCredit`/`tags`/`externalId`; build `categories` into the create input.
- [ ] **Step 2:** `chatMessagesRoute.ts` — reshape the two mock `ActivityDTO`s to `categories: { primary: <existing value>, secondary: [] }` (rooftop → `NIGHTLIFE`, spa → `ROMANTIC`); drop `imageCredit`/`tags`/`sourceId`/`externalId`.

**Acceptance criteria:**
- [ ] Admin route validates the category object; chat mocks compile against the new DTO.

**Verification:** part of final `type-check`; `pnpm dep:check` (DAG intact).
**Dependencies:** Task 8. **Scope:** S.

---

## Task 10: MCP — `ingestActivity` tool

**Files:**
- Edit: `src/mcp/tools/ingestActivity.ts`
- Edit: `src/mcp/tools/ingestActivity.test.ts` · Edit: `src/mcp/mcp-tools.integration.test.ts`

- [ ] **Step 1:** `payloadSchema.category → categories: z.object({ primary: z.enum(ActivityCategories), secondary: z.array(z.enum(ActivityCategories)).max(2).default([]) })` — **structural shape only**; the full invariant (`primary ∉ secondary`) stays in the domain and surfaces as `REJECTED` + reason (scout corrects the data and retries once), not a Zod error. Drop `imageCredit`/`tags` from the payload. `meta.category` (theme) **unchanged**.
- [ ] **Step 2:** Update the **French** `ingestActivityDescription`: describe `payload.categories = { primary, secondary[] }` (1 primaire + 0–2 secondaires distinctes ≠ primaire); remove `imageCredit`/`tags` from the field list.
- [ ] **Step 3:** Update MCP test fixtures (`ingestActivity.test.ts`, `mcp-tools.integration.test.ts`) to the `categories` shape; drop the dropped fields. Add/keep an assertion that a `primary ∈ secondary` payload returns `REJECTED` with a reason.

**Acceptance criteria:**
- [ ] Tool accepts the category object; `meta.category` still the theme; invariant violation → domain `REJECTED`, not a Zod form-error.

**Verification:** `pnpm vitest run src/mcp/tools/ingestActivity.test.ts` and `pnpm vitest run --config vitest.integration.config.ts src/mcp/mcp-tools.integration.test.ts`.
**Dependencies:** Task 7. **Scope:** M.

---

## Task 11: Agents — `wandr-theme-scout` classification rule

**Files:**
- Edit: `.claude/agents/wandr-theme-scout.md` (**French**)

- [ ] **Step 1:** State the classification rule explicitly: **`primary` = what the place fundamentally IS** (its dominant nature), **not** the search theme (the theme is just a lens); **`secondary` (0–2)** = other categories it genuinely also serves, **only if clearly applicable** — *"0 secondary is normal; don't pad."*
- [ ] **Step 2:** One cross-scout example: a candle-lit fine-dining restaurant → `{ primary: FOOD, secondary: [ROMANTIC] }` **whether found by the FOOD-scout or the ROMANTIC-scout** (this is the cross-scout consistency lever for decision #6). `meta.category` stays = its theme. Remove `imageCredit`/`tags` mentions.
- [ ] **Step 3:** Leave `.claude/commands/wandr-ingest.md`, `.claude/commands/wandr-recheck.md`, `.claude/agents/wandr-recheck-verifier.md` **unchanged** (no payload/category contract).

**Acceptance criteria:**
- [ ] Prompt encodes primary-is-nature, secondary-only-if-real, the cross-scout example, and drops `imageCredit`/`tags`.

**Verification:** structural read of the file (it is a prompt, not code).
**Dependencies:** Task 10. **Scope:** S.

---

## Task 12: Seed

**Files:**
- Edit: `prisma/seed.ts`

- [ ] **Step 1:** `SeedActivity.category → categories: ActivityCategorySet`; drop `imageCredit`, `externalId`.
- [ ] **Step 2:** Change the upsert key from `sourceId_externalId` → **`cityId_dedupeKey`** (`dedupeKey` is already computed in the loop).
- [ ] **Step 3:** Convert all ~30 entries (15 events + 15 places) to `{ primary, secondary: [] }`; give **three** real secondaries to exercise cross-feed surfacing for manual checks: Maison Boulud `{ FOOD, [ROMANTIC] }`, Bota Bota (place) `{ ROMANTIC, [OUTDOOR] }`, Jardin botanique `{ CULTURE, [OUTDOOR] }`. The `affinities` block and the count summary are unchanged.
- [ ] **Step 4:** `pnpm db:seed`.

**Acceptance criteria:**
- [ ] Seed runs clean; all 30 activities have a valid category set; the 3 cross-feed rows present.

**Verification:** `pnpm db:seed` (optionally re-run the Task 1 integration test against seeded data for a manual cross-feed sanity check).
**Dependencies:** Task 4. **Scope:** M.

---

## Task 13: Mechanical test-fixture updates → full `test` GREEN

**Files (edit):**
- `src/modules/activities/application/PromoteCandidateUseCase.test.ts`
- `src/modules/activities/application/CreateActivityUseCase.test.ts`
- `src/modules/activities/application/GetActivityUseCase.test.ts`
- `src/modules/activities/application/ListFeaturedActivitiesUseCase.test.ts`
- `src/modules/favorites/application/ListFavoritesUseCase.test.ts`
- `src/modules/calendar/application/AddToCalendarUseCase.test.ts`
- `src/modules/affinity/application/GetUserAffinityMapUseCase.test.ts`
- `src/modules/feed/application/GetFeedUseCase.test.ts`

- [ ] **Step 1:** Mechanical: `category → categories` (a `{primary, secondary}` literal); drop `imageCredit`/`tags`/`externalId` from every activity fixture.
- [ ] **Step 2:** In `GetFeedUseCase.test.ts`, update the in-memory **fake repo** to match on **set-membership** (an activity matches a criteria category if it is the `primary` OR in `secondary`), mirroring the Prisma where-clause.
- [ ] **Step 3 (GREEN):** `pnpm test` — full unit suite passes.

**Acceptance criteria:**
- [ ] `pnpm test` green; the fake feed repo matches the real set-membership semantics.

**Verification:** `pnpm test`.
**Dependencies:** Tasks 6, 7, 8, 10. **Scope:** M.

---

## Task 14: Record `tbd.md` deferrals

**Files:**
- Edit: `tbd.md`

- [ ] Add, under the existing `## Assumptions` / `## Future changes` / `## Hardcoded` headings (with `file:line` refs where they exist):
  - **Assumption:** feed ranking uses a **weighted average** of affinity over the set (primary ×1, secondary ×0.5, normalized) — `ranking/p1.ts`.
  - **Assumption:** cross-scout `DUPLICATE` keeps the **first ingester's** category set (no merge); consistency steered by the scout prompt's classification rule, not code.
  - **Assumption:** `cursor-codec` `matchScore` is now a bounded **float** (was int).
  - **Future change:** when user actions write `UserCategoryAffinity`, attribute to the **primary** category.
  - **Hardcoded/Future:** no GIN index on `categories Json`; feed query ORs JSON-path filters — revisit if data grows.
  - **Assumption:** seed upserts on `cityId_dedupeKey` (since `externalId` dropped).
  - **Flag (no action):** `SPORT` is absent from `CATEGORY_PRESETS` (separate `SPORT_PRESET`/`/sport` page) — surfaced for the user.

**Acceptance criteria:**
- [ ] All 7 bullets recorded under the correct headings.

**Dependencies:** None (can be done anytime). **Scope:** S.

---

## ✅ Final checkpoint — full verification suite (spec §7)

Run all and paste outputs into the implementation report. All must pass:

- [ ] `pnpm type-check`
- [ ] `pnpm test`
- [ ] `pnpm test:integration`
- [ ] `pnpm dep:check`
- [ ] `pnpm prisma:validate`
- [ ] `pnpm db:push`
- [ ] `pnpm db:seed`

**Success criteria recap:** an activity `{FOOD,[ROMANTIC]}` surfaces in both the Dining and Romantic feeds (Task 1 integration test); the domain invariant holds (Task 2); ranking is the weighted average (Task 6); the dropped fields are gone DB→DTO; `type-check` is finally green.

---

## Out of scope

New feeds/pages; changing the six categories; acting on the SPORT/`CATEGORY_PRESETS` mismatch (flag only); multi-city/locale/user generalization; data backfill (reseed instead); re-architecting ranking/affinity beyond the weighted-average rule; any added configurability.
