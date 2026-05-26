# Multi-category activities + Activity-schema slim-down — Design

**Date:** 2026-05-25
**Stage:** personal POC (single locale, single user, single deployment)
**Scope:** Replace Activity's single `category` enum with a JSONB category set (1 primary + 0–2 secondary), and remove Activity fields the app doesn't use. Propagate both across DB → domain → application → infra → contracts → web → MCP → agents → seed/tests so one activity surfaces in every feed matching any of its categories.

---

## Locked decisions

1. **Storage:** `categories Json` — a JSONB **object** `{ "primary": ActivityCategory, "secondary": ActivityCategory[] }`. (Faithful to the brief; domain VO mirrors it 1:1.)
2. **DTO:** reshape `category → categories`; the activity contract carries the full set.
3. **Drop-list (all four):** `imageCredit`, `tags`, `externalId` (+ `@@unique([sourceId, externalId])`), and `sourceId` **from the DTO only** (column + `Source` FK stay in the DB).

The six categories are **unchanged**: `SPORT, ROMANTIC, FOOD, CULTURE, OUTDOOR, NIGHTLIFE`.

---

## Field audit (consumer evidence)

| Field | UI reads it? | Ingestion (MCP) | Recheck | Admin route | Decision |
|---|---|---|---|---|---|
| `category` | **No** — neither `cards/*.tsx` nor `ActivityModal` read `activity.category`; only the *filter* UI uses a category **list** | `payload.category` (real) + `meta.category` (theme) | no | yes | **RESHAPE → set** |
| `imageCredit` | **No** — cards use `coverImage(imageUrl)`; modal never reads it | optional payload field | no | optional | **DROP** |
| `tags` | **No** — grep hits are filter-local vars + `profile.tags` (unrelated) | **required** payload field | no | optional | **DROP** |
| `externalId` | **No** | never set — `PromoteCandidate` hardcodes `null` | verifier reads `externalUrl`, not `externalId` | optional | **DROP** (+ `@@unique([sourceId, externalId])`) |
| `sourceId` | **No** (DTO field unread); `Source` FK *is* used in promote | resolved in promote | no | n/a | **DROP from DTO**, keep column + FK |
| `@@index([category, dateStart])` | — | — | — | — | **DROP** (column gone) |
| `status`, `expiresAt`, `dedupeKey`, `lastSeenAt`, `lastVerifiedAt`, `recheckAfter` | freshness/recheck pipeline | yes | yes | — | **KEEP** |

**Confirmed from code:**
- **No code writes `UserCategoryAffinity`** — only `seed.ts` does. "Attribute affinity to primary" is moot (recorded in `tbd.md`; no code written).
- **Profile is fully mocked** (`MockProfileRepository` returns string literals) — does not read `activity.category`; the reshape does not touch profile.
- **`FilterValue.category` is already `ActivityCategory[]`** — filter/feed input is unchanged; only how the repo *matches* an activity's category set against that list changes.
- **SPORT mismatch (flagged, not actioned):** `CATEGORY_PRESETS` has 5 keys (no `sport`); SPORT lives in a separate `SPORT_PRESET` + `/sport` page.

---

## 1. Category shape + domain invariant

New value object: `src/modules/activities/domain/ActivityCategorySet.ts`

```ts
export type ActivityCategorySet = {
  primary: ActivityCategory;
  secondary: ActivityCategory[];
};

export function validateCategorySet(set: ActivityCategorySet): void; // throws on violation
export function categorySetToArray(set: ActivityCategorySet): ActivityCategory[]; // [primary, ...secondary]
```

**Invariant (source of truth, enforced here):**
- `primary` ∈ `ActivityCategories`.
- `secondary` is an array, length **0–2**, each ∈ `ActivityCategories`.
- `secondary` entries are **distinct**.
- **`primary` ∉ `secondary`.**
- ⇒ total distinct categories = `1 + secondary.length`, **1–3**.

`Activity.category: ActivityCategory` → `Activity.categories: ActivityCategorySet`. `validateActivity` calls `validateCategorySet`. `imageCredit`, `tags`, `externalId` removed from the `Activity` entity. `sourceId` stays in the domain entity (needed by `create`); it only leaves the DTO.

Persisted as `categories Json` mirroring the VO. The infra boundary casts `Prisma.JsonValue → ActivityCategorySet` on read.

---

## 2. Feed query + ranking (JSON-matching core)

### Where-clause — `PrismaActivityRepository.findCandidates`

Replaces `where.category = { in: criteria.categories }`. Pushed into the existing `and` array so it ANDs cleanly with status/city/kind/neighborhood/price/date/expiry:

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

An activity `{primary: FOOD, secondary: [ROMANTIC]}` is therefore returned for the Dining feed (`category=['FOOD']`) **and** the Romantic feed (`category=['ROMANTIC']`). `FilterValue` and `ActivityCandidateCriteria.categories` are **unchanged** (`ActivityCategory[]`).

### Ranking — `ranking/p1.ts` (max-affinity over the set)

Replaces `affinityMap.get(activity.category) ?? DEFAULT_MATCH_SCORE`:

```ts
matchScore: Math.max(
  ...categorySetToArray(activity.categories).map((c) => affinityMap.get(c) ?? DEFAULT_MATCH_SCORE),
)
```

An anonymous user (empty `affinityMap`) yields `DEFAULT_MATCH_SCORE` for every category ⇒ max = `DEFAULT_MATCH_SCORE`. Tie-break order (featured → matchScore → dateStart → createdAt → id) is unchanged.

---

## 3. Layer-by-layer change list (DAG order)

**domain**
- New `ActivityCategorySet.ts` (type + `validateCategorySet` + `categorySetToArray`).
- `Activity.ts`: `category → categories`; `validateActivity` delegates to `validateCategorySet`; drop `imageCredit`/`tags`/`externalId` from the entity type.
- `RawActivityCandidate.ts`: `ExtractedActivityPayload.category → categories: ActivityCategorySet`; drop `imageCredit`/`tags`. `RawActivityCandidate.category` (the search **theme**) stays single.

**application**
- `ranking/p1.ts`: max-affinity (above).
- `PromoteCandidateUseCase.ts`: `baseInput.category → categories: payload.categories`; remove `imageCredit`, `tags`, and the `externalId: null` line.
- `CreateActivityUseCase.ts`: flows through via the `ActivityCreateInput` type (verify no direct dropped-field reference).

**infra**
- `PrismaActivityRepository.ts`: `create` writes `categories` as JSON, drops 3 fields; `findCandidates` JSON where-clause (above); `toActivity` casts `Json → ActivityCategorySet`, drops 3 fields.
- `PrismaCandidateRepository.ts`: `extractedPayload` mapping follows the new payload shape; candidate `category` (theme) unchanged.

**contracts**
- `ActivityDTO.ts`: `category → categories: { primary; secondary[] }`; drop `imageCredit`, `tags`, `sourceId`.
- `toActivityDTO.ts`: map `categories`; drop the 3 fields.

**web**
- `adminActivityRoute.ts`: Zod schema `category` → `categories` object (`{ primary: enum, secondary: array(enum).max(2) }`); drop `imageCredit`/`tags`/`externalId`; build `categories` into the create input.
- `chatMessagesRoute.ts`: reshape the two mock `ActivityDTO`s to `categories: { primary, secondary: [] }`; drop `imageCredit`/`tags`/`sourceId`/`externalId`.

**mcp**
- `ingestActivity.ts`: `payloadSchema.category` → `categories: z.object({ primary: z.enum(ActivityCategories), secondary: z.array(z.enum(ActivityCategories)).max(2).default([]) })`; drop `imageCredit`/`tags` (Zod = structural shape only; full invariant stays in domain → REJECTED + reason). `meta.category` (theme) **unchanged**. Update the **French** `ingestActivityDescription`: describe `payload.categories = { primary, secondary[] }` (1 primaire + 0–2 secondaires distinctes ≠ primaire), remove `imageCredit`/`tags` from the field list.

**agents / commands**
- `.claude/agents/wandr-theme-scout.md` (**French**): scout classifies by **real** categories — `payload.categories.primary` is the dominant category and **may differ from its theme**; 0–2 distinct secondaries (≠ primary). `meta.category` stays = its theme. Remove `imageCredit`/`tags` mentions.
- `.claude/commands/wandr-ingest.md`, `.claude/commands/wandr-recheck.md`, `.claude/agents/wandr-recheck-verifier.md`: **no change** — they carry no payload/category contract (verifier reads id/title/address/lat/lng/externalUrl/lastVerifiedAt).

---

## 4. Schema / migration

Applied via `prisma db push` (no migrations directory — POC). Data is **reseeded**, not backfilled (per scope).

`Activity`:
- `category ActivityCategory` → `categories Json`
- drop `imageCredit`, `tags`, `externalId`
- drop `@@unique([sourceId, externalId])`
- drop `@@index([category, dateStart])`
- **keep** `sourceId` + `Source` relation, `dedupeKey` + `@@unique([cityId, dedupeKey])`, all freshness/status fields and their indexes.

**Unchanged:** `RawActivityCandidate.category` (theme), `UserCategoryAffinity` (per-(user,category) score map). No GIN index on `categories` (POC scale — `tbd.md`).

---

## 5. Seed + tests

**`prisma/seed.ts`**
- `SeedActivity.category → categories: ActivityCategorySet`; drop `imageCredit`, `externalId`.
- Upsert key `sourceId_externalId` → **`cityId_dedupeKey`** (`dedupeKey` already computed in the loop).
- Convert all ~30 entries to `{ primary, secondary: [] }`; give a handful real secondaries to exercise cross-feed surfacing for manual checks, e.g. Maison Boulud `{ FOOD, [ROMANTIC] }`, Bota Bota `{ ROMANTIC, [OUTDOOR] }`.
- `affinities` block and the count summary are unchanged.

**Tests**
- **New** `ActivityCategorySet.test.ts` — invariant branches: valid `{FOOD,[ROMANTIC]}`; valid `{FOOD,[]}`; reject `primary ∈ secondary`; reject `secondary.length > 2` (total > 3); reject duplicate secondary; reject invalid enum. *(Success-criterion test.)*
- **New** integration test (alongside `PrismaActivityRepository.*.integration.test.ts`) — seed one `{primary: FOOD, secondary: [ROMANTIC]}` row, assert it is returned by `findCandidates({ categories: ['FOOD'] })` **and** `findCandidates({ categories: ['ROMANTIC'] })`. *(Real proof of the JSON where-clause + the BOTH-feeds success criterion.)*
- `p1.test.ts` — assert max-affinity (e.g. `{primary: ROMANTIC(3), secondary: [FOOD(9)]}` → `matchScore 9`).
- Mechanical fixture updates (`category → categories`, drop `imageCredit`/`tags`/`externalId`): `ingestActivity.test.ts`, `mcp-tools.integration.test.ts`, `PromoteCandidateUseCase.test.ts`, `CreateActivityUseCase.test.ts`, `GetActivityUseCase.test.ts`, `ListFeaturedActivitiesUseCase.test.ts`, `ListFavoritesUseCase.test.ts`, `AddToCalendarUseCase.test.ts`, `GetFeedUseCase.test.ts` (update the in-memory fake repo to match on set-membership), `GetUserAffinityMapUseCase.test.ts`.

---

## 6. `tbd.md` deferrals to record

- **Assumption:** feed ranking uses **max** affinity over the category set (`ranking/p1.ts`).
- **Future change:** when user actions write `UserCategoryAffinity`, attribute to the **primary** category.
- **Hardcoded / Future:** no GIN index on `categories Json`; feed query ORs JSON-path filters — revisit if data grows.
- **Assumption:** seed upserts on `cityId_dedupeKey` (since `externalId` dropped).
- **Flag (no action):** `SPORT` is absent from `CATEGORY_PRESETS` (separate `SPORT_PRESET`/`/sport` page) — surfaced for the user.

---

## 7. Verification (all must pass; output pasted in the implementation report)

`type-check` · `test` · `test:integration` · `dep:check` · `prisma:validate` · `db:push` · `db:seed`

---

## Out of scope

New feeds/pages; changing the six categories; acting on the SPORT mismatch (flag only); multi-city/locale/user generalization; data backfill (reseed instead); re-architecting ranking/affinity beyond the max-affinity rule; any added configurability.
