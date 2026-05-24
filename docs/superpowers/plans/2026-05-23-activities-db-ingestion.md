# Activities DB Schema & Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the database schema and pure ingestion mechanics that let the app store web-sourced activities per city and show only fresh, non-expired ones in the feed.

**Architecture:** Selective-hexagonal modular monolith. New pure domain helpers (`computeDedupeKey`, freshness math, `City`, candidate types) drive a `PromoteCandidateUseCase` (staging → `Activity`) and a `ConfirmActivityUseCase` (refresh + recompute `recheckAfter`), wired through new ports. Prisma adapters implement the ports. The feed becomes city-scoped + freshness-filtered. The re-verification *decision* (is an activity still valid?) is made by an orchestrator agent via an MCP server in a **follow-up plan** — this plan only exposes the deterministic data-layer operations (`findDueForRecheck`, `confirmActivity`, `archive`) those tools will call.

**Tech Stack:** TypeScript, Next.js 14 (app router), Prisma 5 + PostgreSQL, Vitest, Zod, dependency-cruiser.

---

## Source spec

`docs/superpowers/specs/2026-05-23-activities-db-ingestion-design.md`. Read §4–§8 before starting; this plan implements those sections.

## What is intentionally NOT built (spec §7, §9)

- The **MCP server** that exposes these use cases/repos as agent tools — that is a separate follow-up plan (see `docs/superpowers/specs/2026-05-23-ingestion-mcp-server-design.md`).
- The re-verification *orchestration*: the orchestrator agent (run from Claude Code) does the Tavily search + the "still valid?" judgment and calls deterministic tools. There is **no** in-process verifier port or recheck loop here.
- The per-theme search agents, the Tavily MCP, and any MCP transport / config wiring.
- Fuzzy dedupe matching, geocoding of Tavily results, i18n.

This plan is the **foundation**: schema, domain, `PromoteCandidateUseCase`, `ConfirmActivityUseCase`, Prisma adapters, and the city-scoped + freshness-filtered feed. Everything in §4–§6, §8 is built and tested here; §7/§9 are deferred to the MCP plan.

## Conventions for the engineer

- Package manager is **pnpm**. Run scripts with `pnpm <script>` or binaries with `pnpm exec <bin>`.
- Run a single test file: `pnpm exec vitest run <path>`. Run all tests: `pnpm test`.
- Type-check: `pnpm type-check`. Architecture rules: `pnpm dep:check`. Prisma schema: `pnpm prisma:validate`.
- Layer DAG is enforced by dependency-cruiser (see `CLAUDE.md` §5). Never import `infra`/`application` from `domain`; never import `infra` from a Next.js `app/` route. Module route handlers under `modules/<cap>/web/` **may** instantiate infra adapters (the existing routes already do).
- This is a single-developer POC with a disposable, seed-derived dev database. We use `prisma db push` (there are **no** migration files in the repo), and "backfill" is done by re-seeding, not by a hand-written migration. Spec §8's backfill steps describe what a production migration would do; for this POC the updated seed encodes the same end state.

---

## File Structure

**New domain files** (`src/modules/activities/domain/`)
- `slug.ts` — `slugify(value)` shared normalizer (extracted so domain code can slugify without importing application).
- `computeDedupeKey.ts` — deterministic fingerprint (spec §5).
- `freshness.ts` — `RECHECK_INTERVAL_DAYS`, `computeExpiresAt`, `computeRecheckAfter` (spec §6).
- `City.ts` — `City` type + `isWithinCityBbox`.
- `RawActivityCandidate.ts` — `CandidateStatus`, `ExtractedActivityPayload`, `RawActivityCandidate`.
- `ICityRepository.ts`, `ICandidateRepository.ts`, `IActivityIngestionRepository.ts` — ports.

**Modified domain files**
- `Activity.ts` — extend `Activity`/`ActivityCreateInput` types + `validateActivity`.
- `ActivityCandidateCriteria.ts` — add `cityId` + `notExpiredAsOf`.

**New application files** (`src/modules/activities/application/`)
- `PromoteCandidateUseCase.ts` (+ test) — staging → `Activity` (spec §5).
- `ConfirmActivityUseCase.ts` (+ test) — refresh `lastSeenAt`/`lastVerifiedAt` + recompute `recheckAfter` (spec §6). Called by the future recheck MCP tool when the agent confirms an activity still exists.

**Modified application files**
- `CreateActivityUseCase.ts` (+ new test) — derive `dedupeKey`/freshness, require `cityId`.
- `feed/application/GetFeedUseCase.ts` (+ test) — thread `cityId` + freshness into criteria.
- `favorites/application/ListFavoritesUseCase.ts` — thread `cityId`.

**New infra files** (`src/modules/activities/infra/`)
- `PrismaCityRepository.ts`, `PrismaCandidateRepository.ts`.

**Modified infra**
- `PrismaActivityRepository.ts` — map new columns, write them on create, city+freshness filter, implement `IActivityIngestionRepository`.

**Modified contracts / shared**
- `shared/contracts/ActivityDTO.ts` + `toActivityDTO.ts` — add `tags` (city stays server-side, freshness internal).
- `shared/auth/current-user.ts` — add `cityId` to `CurrentUser`.

**Modified web routes**
- `feed/web/feedRoute.ts`, `favorites/web/favoritesFeedRoute.ts` — pass `user.cityId`.
- `activities/web/adminActivityRoute.ts` — resolve a city for manual creates.

**Modified schema + seed**
- `prisma/schema.prisma`, `prisma/seed.ts`.

**Modified test fixtures** (Activity gained required fields)
- `activities/domain/Activity.test.ts`, `activities/application/GetActivityUseCase.test.ts`, `activities/application/ListFeaturedActivitiesUseCase.test.ts`, `feed/application/GetFeedUseCase.test.ts`, `favorites/application/ListFavoritesUseCase.test.ts`, `calendar/application/AddToCalendarUseCase.test.ts`.

---

# Phase 1 — Pure domain logic (TDD)

### Task 1: `slugify` shared normalizer

**Files:**
- Create: `src/modules/activities/domain/slug.ts`
- Test: `src/modules/activities/domain/slug.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/domain/slug.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases, strips accents, and hyphenates', () => {
    expect(slugify('Café de Montréal')).toBe('cafe-de-montreal');
  });

  it('collapses repeated separators and trims edges', () => {
    expect(slugify('  Bota   Bota!! ')).toBe('bota-bota');
  });

  it('falls back to "activity" when nothing usable remains', () => {
    expect(slugify('!!!')).toBe('activity');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/domain/slug.test.ts`
Expected: FAIL — cannot find module `./slug`.

- [ ] **Step 3: Write minimal implementation**

Create `src/modules/activities/domain/slug.ts`:

```typescript
export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return slug.length > 0 ? slug : 'activity';
}
```

> The `/\p{Diacritic}/gu` regex strips the combining accents left by `normalize('NFKD')`. It is copy-safe ASCII and behaves the same as the `/[̀-ͯ]/g` range used in `CreateActivityUseCase`. Requires Node 18+ (the project runs Node 20) for the `u`-flag Unicode property escape.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/domain/slug.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/domain/slug.ts src/modules/activities/domain/slug.test.ts
git commit -m "feat(activities): add shared slugify domain helper"
```

---

### Task 2: `computeDedupeKey` (spec §5)

**Files:**
- Create: `src/modules/activities/domain/computeDedupeKey.ts`
- Test: `src/modules/activities/domain/computeDedupeKey.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/domain/computeDedupeKey.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { computeDedupeKey } from './computeDedupeKey';

describe('computeDedupeKey', () => {
  it('builds an EVENT key from slug, start day, and rounded coords', () => {
    const key = computeDedupeKey({
      kind: 'EVENT',
      title: 'MURAL Festival',
      dateStart: new Date('2026-06-04T16:00:00.000Z'),
      latitude: 45.5162,
      longitude: -73.5817,
    });
    expect(key).toBe('mural-festival|2026-06-04|45.516,-73.582');
  });

  it('builds a PLACE key from slug and rounded coords only', () => {
    const key = computeDedupeKey({
      kind: 'PLACE',
      title: 'Bota Bota',
      dateStart: null,
      latitude: 45.5014,
      longitude: -73.5496,
    });
    expect(key).toBe('bota-bota|45.501,-73.550');
  });

  it('is stable across coordinate jitter within ~100m (3-decimal rounding)', () => {
    const a = computeDedupeKey({
      kind: 'PLACE',
      title: 'Mount Royal Lookout',
      dateStart: null,
      latitude: 45.5036,
      longitude: -73.5871,
    });
    const b = computeDedupeKey({
      kind: 'PLACE',
      title: 'Mount Royal Lookout',
      dateStart: null,
      latitude: 45.5038,
      longitude: -73.5869,
    });
    expect(a).toBe(b);
  });

  it('throws when an EVENT has no dateStart', () => {
    expect(() =>
      computeDedupeKey({
        kind: 'EVENT',
        title: 'X',
        dateStart: null,
        latitude: 45.5,
        longitude: -73.5,
      }),
    ).toThrow(/dateStart/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/domain/computeDedupeKey.test.ts`
Expected: FAIL — cannot find module `./computeDedupeKey`.

- [ ] **Step 3: Write minimal implementation**

Create `src/modules/activities/domain/computeDedupeKey.ts`:

```typescript
import type { ActivityKind } from './Activity';
import { slugify } from './slug';

export type DedupeKeyInput = {
  kind: ActivityKind;
  title: string;
  dateStart: Date | null;
  latitude: number;
  longitude: number;
};

export function computeDedupeKey(input: DedupeKeyInput): string {
  const title = slugify(input.title);
  const coords = `${input.latitude.toFixed(3)},${input.longitude.toFixed(3)}`;

  if (input.kind === 'EVENT') {
    if (!input.dateStart) {
      throw new Error('computeDedupeKey: EVENT requires dateStart.');
    }
    const day = input.dateStart.toISOString().slice(0, 10);
    return `${title}|${day}|${coords}`;
  }

  return `${title}|${coords}`;
}
```

> Note: `toFixed(3)` rounds to 3 decimals deterministically (~100 m tolerance per spec §5). Day is taken in UTC for determinism.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/domain/computeDedupeKey.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/domain/computeDedupeKey.ts src/modules/activities/domain/computeDedupeKey.test.ts
git commit -m "feat(activities): add deterministic computeDedupeKey (spec §5)"
```

---

### Task 3: Freshness math — `computeExpiresAt` + `computeRecheckAfter` (spec §6)

**Files:**
- Create: `src/modules/activities/domain/freshness.ts`
- Test: `src/modules/activities/domain/freshness.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/domain/freshness.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { computeExpiresAt, computeRecheckAfter, RECHECK_INTERVAL_DAYS } from './freshness';

describe('computeExpiresAt', () => {
  it('returns dateEnd for an EVENT', () => {
    const dateEnd = new Date('2026-06-14T03:00:00.000Z');
    expect(computeExpiresAt({ kind: 'EVENT', dateEnd })).toEqual(dateEnd);
  });

  it('returns null for a PLACE', () => {
    expect(computeExpiresAt({ kind: 'PLACE', dateEnd: null })).toBeNull();
  });

  it('throws when an EVENT has no dateEnd', () => {
    expect(() => computeExpiresAt({ kind: 'EVENT', dateEnd: null })).toThrow(/dateEnd/);
  });
});

describe('computeRecheckAfter', () => {
  it('returns lastSeenAt + 90 days for a PLACE', () => {
    const lastSeenAt = new Date('2026-05-23T00:00:00.000Z');
    const expected = new Date(
      lastSeenAt.getTime() + RECHECK_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(computeRecheckAfter({ kind: 'PLACE', lastSeenAt })).toEqual(expected);
  });

  it('returns null for an EVENT (events expire by date, no recheck)', () => {
    expect(
      computeRecheckAfter({ kind: 'EVENT', lastSeenAt: new Date('2026-05-23T00:00:00.000Z') }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/domain/freshness.test.ts`
Expected: FAIL — cannot find module `./freshness`.

- [ ] **Step 3: Write minimal implementation**

Create `src/modules/activities/domain/freshness.ts`:

```typescript
import type { ActivityKind } from './Activity';

export const RECHECK_INTERVAL_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeExpiresAt(input: { kind: ActivityKind; dateEnd: Date | null }): Date | null {
  if (input.kind === 'EVENT') {
    if (!input.dateEnd) {
      throw new Error('computeExpiresAt: EVENT requires dateEnd.');
    }
    return input.dateEnd;
  }
  return null;
}

export function computeRecheckAfter(input: { kind: ActivityKind; lastSeenAt: Date }): Date | null {
  if (input.kind === 'EVENT') {
    return null;
  }
  return new Date(input.lastSeenAt.getTime() + RECHECK_INTERVAL_DAYS * MS_PER_DAY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/domain/freshness.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/domain/freshness.ts src/modules/activities/domain/freshness.test.ts
git commit -m "feat(activities): add expiresAt/recheckAfter freshness math (spec §6)"
```

---

### Task 4: `City` type + `isWithinCityBbox` (spec §4.1)

**Files:**
- Create: `src/modules/activities/domain/City.ts`
- Test: `src/modules/activities/domain/City.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/domain/City.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { isWithinCityBbox, type City } from './City';

const montreal: City = {
  id: 'city_mtl',
  slug: 'montreal',
  name: 'Montréal',
  country: 'CA',
  timezone: 'America/Toronto',
  centerLat: 45.5019,
  centerLng: -73.5674,
  bboxMinLat: 45.4,
  bboxMinLng: -73.98,
  bboxMaxLat: 45.71,
  bboxMaxLng: -73.47,
};

describe('isWithinCityBbox', () => {
  it('accepts a point inside the bbox', () => {
    expect(isWithinCityBbox(montreal, 45.5162, -73.5817)).toBe(true);
  });

  it('rejects a point north of the bbox', () => {
    expect(isWithinCityBbox(montreal, 46.0, -73.5817)).toBe(false);
  });

  it('rejects a point west of the bbox', () => {
    expect(isWithinCityBbox(montreal, 45.5, -74.5)).toBe(false);
  });

  it('accepts the boundary edges (inclusive)', () => {
    expect(isWithinCityBbox(montreal, 45.4, -73.98)).toBe(true);
    expect(isWithinCityBbox(montreal, 45.71, -73.47)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/domain/City.test.ts`
Expected: FAIL — cannot find module `./City`.

- [ ] **Step 3: Write minimal implementation**

Create `src/modules/activities/domain/City.ts`:

```typescript
export type City = {
  id: string;
  slug: string;
  name: string;
  country: string;
  timezone: string;
  centerLat: number;
  centerLng: number;
  bboxMinLat: number;
  bboxMinLng: number;
  bboxMaxLat: number;
  bboxMaxLng: number;
};

export function isWithinCityBbox(city: City, latitude: number, longitude: number): boolean {
  return (
    latitude >= city.bboxMinLat &&
    latitude <= city.bboxMaxLat &&
    longitude >= city.bboxMinLng &&
    longitude <= city.bboxMaxLng
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/domain/City.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/domain/City.ts src/modules/activities/domain/City.test.ts
git commit -m "feat(activities): add City entity and bbox check (spec §4.1)"
```

---

### Task 5: Extend `Activity` type + `validateActivity` (spec §4.2, §8)

**Files:**
- Modify: `src/modules/activities/domain/Activity.ts`
- Modify: `src/modules/activities/domain/Activity.test.ts`

- [ ] **Step 1: Update the test fixture and add failing validation cases**

In `src/modules/activities/domain/Activity.test.ts`, replace the `baseActivity` factory's returned object (lines 9–33, the block from `return {` through `};`) so it includes the new required fields. The new factory body:

```typescript
  return {
    slug: 'mural-festival',
    title: 'MURAL Festival',
    description: 'Public art and music on Saint-Laurent.',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205',
    imageCredit: 'Photo on Unsplash',
    kind: 'EVENT',
    category: 'CULTURE',
    address: 'Saint-Laurent Boulevard, Montreal',
    neighborhood: 'Plateau-Mont-Royal',
    latitude: 45.516,
    longitude: -73.583,
    dateStart: eventStart,
    dateEnd: eventEnd,
    priceMinCents: 0,
    priceMaxCents: 2500,
    externalUrl: 'https://example.com/mural',
    indoor: false,
    outdoor: true,
    isFeatured: true,
    status: 'PUBLISHED',
    sourceId: 'source_1',
    externalId: 'event_mural',
    cityId: 'city_mtl',
    tags: [],
    dedupeKey: 'mural-festival|2026-06-15|45.516,-73.583',
    expiresAt: eventEnd,
    lastSeenAt: eventStart,
    lastVerifiedAt: eventStart,
    recheckAfter: null,
    ...overrides,
  };
```

In the same file, the two PLACE test cases must also clear `expiresAt` (a PLACE must not carry one). Update them:

The `'rejects dates on PLACE activities'` test — change its `baseActivity({ ... })` call to:

```typescript
      createActivity(
        baseActivity({
          kind: 'PLACE',
          dateStart: eventStart,
          dateEnd: eventEnd,
          expiresAt: null,
        }),
      ),
```

The `'accepts PLACE activities without dates'` test — change its call to:

```typescript
      createActivity(
        baseActivity({
          slug: 'mount-royal-lookout',
          kind: 'PLACE',
          dateStart: null,
          dateEnd: null,
          expiresAt: null,
        }),
      ),
```

Then append these new cases inside the `describe('Activity', ...)` block (before its closing `});`):

```typescript
  it('requires a cityId', () => {
    expect(() => createActivity(baseActivity({ cityId: '' }))).toThrow(/cityId/);
  });

  it('requires a dedupeKey', () => {
    expect(() => createActivity(baseActivity({ dedupeKey: '' }))).toThrow(/dedupeKey/);
  });

  it('rejects a PLACE that carries an expiresAt', () => {
    expect(() =>
      createActivity(
        baseActivity({
          slug: 'mount-royal-lookout',
          kind: 'PLACE',
          dateStart: null,
          dateEnd: null,
          expiresAt: eventEnd,
        }),
      ),
    ).toThrow(/expiresAt/);
  });

  it('rejects an EVENT whose expiresAt does not equal dateEnd', () => {
    expect(() =>
      createActivity(baseActivity({ expiresAt: new Date('2026-06-15T22:00:00.000Z') })),
    ).toThrow(/expiresAt/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/domain/Activity.test.ts`
Expected: FAIL — TypeScript errors (missing properties on `ActivityCreateInput`) and/or the new assertions throwing nothing.

- [ ] **Step 3: Extend the type and validation**

In `src/modules/activities/domain/Activity.ts`, add the new fields to the `Activity` type. Insert them after the `externalId: string | null;` line (line 40), before `createdAt`:

```typescript
  cityId: string;
  tags: string[];
  dedupeKey: string;
  expiresAt: Date | null;
  lastSeenAt: Date;
  lastVerifiedAt: Date | null;
  recheckAfter: Date | null;
```

`ActivityCreateInput` is `Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>` — it automatically includes the new fields, no change needed there.

Then extend `validateActivity`. Add a `cityId`/`dedupeKey` non-empty check near the top, alongside the existing `assertNonEmpty` calls (after the `assertNonEmpty(input.address, 'address');` line):

```typescript
  assertNonEmpty(input.cityId, 'cityId');
  assertNonEmpty(input.dedupeKey, 'dedupeKey');
```

And add expiresAt/kind coherence at the end of `validateActivity`, immediately after the coordinates check (the block that throws `'Activity coordinates must be finite numbers.'`):

```typescript
  if (input.kind === 'PLACE' && input.expiresAt !== null) {
    throw new Error('PLACE activities must not have expiresAt.');
  }

  if (input.kind === 'EVENT') {
    if (input.expiresAt === null) {
      throw new Error('EVENT activities require expiresAt.');
    }
    if (input.dateEnd && input.expiresAt.getTime() !== input.dateEnd.getTime()) {
      throw new Error('EVENT expiresAt must equal dateEnd.');
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/domain/Activity.test.ts`
Expected: PASS (all original + 4 new cases).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/domain/Activity.ts src/modules/activities/domain/Activity.test.ts
git commit -m "feat(activities): extend Activity with city/freshness fields + validation (spec §4.2)"
```

---

### Task 6: Candidate staging types (spec §4.3)

**Files:**
- Create: `src/modules/activities/domain/RawActivityCandidate.ts`

This is a pure type module (no behavior to TDD); it is verified by the type-checker and consumed in Task 9.

- [ ] **Step 1: Create the file**

Create `src/modules/activities/domain/RawActivityCandidate.ts`:

```typescript
import type { ActivityCategory, ActivityKind } from './Activity';

export const CandidateStatuses = ['PENDING', 'PROMOTED', 'REJECTED', 'DUPLICATE'] as const;
export type CandidateStatus = (typeof CandidateStatuses)[number];

/**
 * The Activity-shaped payload an agent extracted from a Tavily result.
 * Dates are ISO strings because this is persisted as Prisma `Json`.
 */
export type ExtractedActivityPayload = {
  title: string;
  description: string;
  imageUrl: string;
  imageCredit: string | null;
  kind: ActivityKind;
  category: ActivityCategory;
  address: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
  dateStart: string | null;
  dateEnd: string | null;
  priceMinCents: number;
  priceMaxCents: number | null;
  externalUrl: string | null;
  indoor: boolean;
  outdoor: boolean;
  tags: string[];
};

export type RawActivityCandidate = {
  id: string;
  cityId: string;
  category: ActivityCategory;
  agentName: string;
  searchQuery: string;
  sourceUrl: string;
  rawExcerpt: string;
  extractedPayload: ExtractedActivityPayload;
  dedupeKey: string;
  status: CandidateStatus;
  promotedActivityId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
};

export type RawActivityCandidateCreateInput = Omit<
  RawActivityCandidate,
  'id' | 'status' | 'promotedActivityId' | 'rejectionReason' | 'createdAt'
>;
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm type-check`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/domain/RawActivityCandidate.ts
git commit -m "feat(activities): add RawActivityCandidate staging types (spec §4.3)"
```

---

# Phase 2 — Ports

### Task 7: Repository ports + criteria extension

**Files:**
- Create: `src/modules/activities/domain/ICityRepository.ts`
- Create: `src/modules/activities/domain/ICandidateRepository.ts`
- Create: `src/modules/activities/domain/IActivityIngestionRepository.ts`
- Modify: `src/modules/activities/domain/ActivityCandidateCriteria.ts`

These are interfaces/types; verified by the type-checker and exercised by the use-case tests in Phase 3.

> **Design choice:** the ingestion/freshness operations go on a **separate** `IActivityIngestionRepository`, not on the existing `IActivityRepository`. This keeps the feed/featured/calendar fakes (which implement `IActivityRepository`) unchanged. `PrismaActivityRepository` will implement both interfaces.

- [ ] **Step 1: Create `ICityRepository.ts`**

```typescript
import type { City } from './City';

export interface ICityRepository {
  findById(id: string): Promise<City | null>;
  findBySlug(slug: string): Promise<City | null>;
}
```

- [ ] **Step 2: Create `ICandidateRepository.ts`**

```typescript
import type {
  RawActivityCandidate,
  RawActivityCandidateCreateInput,
} from './RawActivityCandidate';

export interface ICandidateRepository {
  create(input: RawActivityCandidateCreateInput): Promise<RawActivityCandidate>;
  findById(id: string): Promise<RawActivityCandidate | null>;
  markPromoted(id: string, activityId: string): Promise<void>;
  markDuplicate(id: string, activityId: string): Promise<void>;
  markRejected(id: string, reason: string): Promise<void>;
}
```

- [ ] **Step 3: Create `IActivityIngestionRepository.ts`**

```typescript
import type { Activity } from './Activity';

export type FreshnessUpdate = {
  lastSeenAt: Date;
  lastVerifiedAt: Date;
  recheckAfter: Date | null;
};

export interface IActivityIngestionRepository {
  findByCityAndDedupeKey(cityId: string, dedupeKey: string): Promise<Activity | null>;
  refreshFreshness(id: string, update: FreshnessUpdate): Promise<void>;
  findDueForRecheck(cityId: string, now: Date): Promise<Activity[]>;
  archive(id: string): Promise<void>;
}
```

> `findDueForRecheck` / `archive` on `IActivityIngestionRepository` are the deterministic re-verification operations the future recheck MCP tools will call (spec §6/§7). There is **no** in-process verifier port — the agent makes the validity judgment (see the MCP follow-up spec).

- [ ] **Step 4: Extend `ActivityCandidateCriteria.ts`**

Replace the file with:

```typescript
import type { ActivityCategory, ActivityKind, ActivityStatus } from './Activity';

export type ActivityCandidateCriteria = {
  status: ActivityStatus;
  cityId: string;
  notExpiredAsOf?: Date;
  kinds?: ActivityKind[];
  categories?: ActivityCategory[];
  neighborhoods?: string[];
  priceMaxCents?: number;
  indoor?: true;
  outdoor?: true;
  free?: true;
  paid?: true;
  eventDateWindow?: { from: Date; to: Date };
  activityIds?: string[];
};
```

- [ ] **Step 5: Verify it type-checks (failures here are expected and fixed in later tasks)**

Run: `pnpm type-check`
Expected: FAIL — callers of `findCandidates` (GetFeedUseCase, PrismaActivityRepository, fakes) don't yet set the now-required `cityId`. These are fixed in Tasks 11, 13, 16, 19, 20. The new port files themselves must show **no** errors.

> Do not try to fix the `cityId` errors yet — they are addressed in order below. Proceed to commit the new ports.

- [ ] **Step 6: Commit**

```bash
git add src/modules/activities/domain/ICityRepository.ts src/modules/activities/domain/ICandidateRepository.ts src/modules/activities/domain/IActivityIngestionRepository.ts src/modules/activities/domain/ActivityCandidateCriteria.ts
git commit -m "feat(activities): add city/candidate/ingestion ports + city-scoped criteria"
```

---

# Phase 3 — Application use cases (TDD)

### Task 8: `PromoteCandidateUseCase` (spec §5)

**Files:**
- Create: `src/modules/activities/application/PromoteCandidateUseCase.ts`
- Test: `src/modules/activities/application/PromoteCandidateUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/application/PromoteCandidateUseCase.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { City } from '../domain/City';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
import type { ICandidateRepository } from '../domain/ICandidateRepository';
import type { ICityRepository } from '../domain/ICityRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
} from '../domain/RawActivityCandidate';
import { PromoteCandidateUseCase } from './PromoteCandidateUseCase';

const NOW = new Date('2026-05-23T12:00:00.000Z');

const MONTREAL: City = {
  id: 'city_mtl',
  slug: 'montreal',
  name: 'Montréal',
  country: 'CA',
  timezone: 'America/Toronto',
  centerLat: 45.5019,
  centerLng: -73.5674,
  bboxMinLat: 45.4,
  bboxMinLng: -73.98,
  bboxMaxLat: 45.71,
  bboxMaxLng: -73.47,
};

function payload(overrides: Partial<ExtractedActivityPayload> = {}): ExtractedActivityPayload {
  return {
    title: 'St-Viateur Bagel',
    description: 'Warm bagels in Mile End.',
    imageUrl: 'https://images.unsplash.com/x',
    imageCredit: null,
    kind: 'PLACE',
    category: 'FOOD',
    address: '263 Rue Saint-Viateur O, Montreal, QC',
    neighborhood: 'Mile End',
    latitude: 45.5227,
    longitude: -73.6016,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 200,
    priceMaxCents: 2500,
    externalUrl: 'https://www.stviateurbagel.com/',
    indoor: true,
    outdoor: false,
    tags: ['FOOD'],
    ...overrides,
  };
}

function candidate(overrides: Partial<RawActivityCandidate> = {}): RawActivityCandidate {
  return {
    id: 'cand_1',
    cityId: 'city_mtl',
    category: 'FOOD',
    agentName: 'food-agent',
    searchQuery: 'best bagels montreal',
    sourceUrl: 'https://example.com',
    rawExcerpt: 'St-Viateur Bagel...',
    extractedPayload: payload(),
    dedupeKey: 'placeholder',
    status: 'PENDING',
    promotedActivityId: null,
    rejectionReason: null,
    createdAt: NOW,
    ...overrides,
  };
}

class FakeCityRepository implements ICityRepository {
  constructor(private readonly cities: City[]) {}
  async findById(id: string): Promise<City | null> {
    return this.cities.find((c) => c.id === id) ?? null;
  }
  async findBySlug(slug: string): Promise<City | null> {
    return this.cities.find((c) => c.slug === slug) ?? null;
  }
}

class FakeCandidateRepository implements ICandidateRepository {
  readonly marks: Array<{ id: string; status: string; ref: string | null }> = [];
  constructor(private readonly candidates: RawActivityCandidate[]) {}
  async create(): Promise<RawActivityCandidate> {
    throw new Error('not used');
  }
  async findById(id: string): Promise<RawActivityCandidate | null> {
    return this.candidates.find((c) => c.id === id) ?? null;
  }
  async markPromoted(id: string, activityId: string): Promise<void> {
    this.marks.push({ id, status: 'PROMOTED', ref: activityId });
  }
  async markDuplicate(id: string, activityId: string): Promise<void> {
    this.marks.push({ id, status: 'DUPLICATE', ref: activityId });
  }
  async markRejected(id: string, reason: string): Promise<void> {
    this.marks.push({ id, status: 'REJECTED', ref: reason });
  }
}

class FakeActivityWriter
  implements
    Pick<IActivityRepository, 'create' | 'getOrCreateSourceIdByName' | 'slugExists'>,
    IActivityIngestionRepository
{
  readonly created: ActivityCreateInput[] = [];
  readonly refreshed: Array<{ id: string; update: FreshnessUpdate }> = [];
  private nextId = 1;
  constructor(private existing: Activity | null = null) {}

  async create(input: ActivityCreateInput): Promise<Activity> {
    this.created.push(input);
    const now = new Date('2026-05-23T12:00:00.000Z');
    return { ...input, id: `activity_${this.nextId++}`, createdAt: now, updatedAt: now };
  }
  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_agent';
  }
  async slugExists(slug: string): Promise<boolean> {
    return this.existing?.slug === slug;
  }
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return this.existing;
  }
  async refreshFreshness(id: string, update: FreshnessUpdate): Promise<void> {
    this.refreshed.push({ id, update });
  }
  async findDueForRecheck(): Promise<Activity[]> {
    return [];
  }
  async archive(): Promise<void> {}
}

function buildUseCase(opts: {
  candidates: RawActivityCandidate[];
  cities?: City[];
  existing?: Activity | null;
}) {
  const writer = new FakeActivityWriter(opts.existing ?? null);
  const candidatesRepo = new FakeCandidateRepository(opts.candidates);
  const useCase = new PromoteCandidateUseCase(
    writer as unknown as IActivityRepository,
    writer,
    candidatesRepo,
    new FakeCityRepository(opts.cities ?? [MONTREAL]),
  );
  return { useCase, writer, candidatesRepo };
}

describe('PromoteCandidateUseCase', () => {
  it('creates a new PLACE Activity and marks the candidate PROMOTED', async () => {
    const { useCase, writer, candidatesRepo } = buildUseCase({ candidates: [candidate()] });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('PROMOTED');
    expect(writer.created).toHaveLength(1);
    const created = writer.created[0];
    expect(created.cityId).toBe('city_mtl');
    expect(created.status).toBe('PUBLISHED');
    expect(created.dedupeKey).toBe('st-viateur-bagel|45.523,-73.602');
    expect(created.lastSeenAt).toEqual(NOW);
    expect(created.lastVerifiedAt).toEqual(NOW);
    expect(created.expiresAt).toBeNull();
    expect(created.recheckAfter).toEqual(new Date('2026-08-21T12:00:00.000Z'));
    expect(candidatesRepo.marks).toEqual([
      { id: 'cand_1', status: 'PROMOTED', ref: 'activity_1' },
    ]);
  });

  it('refreshes freshness and marks DUPLICATE when an Activity already exists', async () => {
    const existing: Activity = {
      ...({} as Activity),
      id: 'activity_existing',
      slug: 'st-viateur-bagel',
      kind: 'PLACE',
      cityId: 'city_mtl',
      dedupeKey: 'st-viateur-bagel|45.523,-73.602',
    } as Activity;
    const { useCase, writer, candidatesRepo } = buildUseCase({
      candidates: [candidate()],
      existing,
    });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('DUPLICATE');
    expect(writer.created).toHaveLength(0);
    expect(writer.refreshed).toEqual([
      {
        id: 'activity_existing',
        update: {
          lastSeenAt: NOW,
          lastVerifiedAt: NOW,
          recheckAfter: new Date('2026-08-21T12:00:00.000Z'),
        },
      },
    ]);
    expect(candidatesRepo.marks).toEqual([
      { id: 'cand_1', status: 'DUPLICATE', ref: 'activity_existing' },
    ]);
  });

  it('rejects a candidate whose coordinates fall outside the city bbox', async () => {
    const { useCase, writer, candidatesRepo } = buildUseCase({
      candidates: [candidate({ extractedPayload: payload({ latitude: 48.0, longitude: -71.0 }) })],
    });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('REJECTED');
    expect(writer.created).toHaveLength(0);
    expect(candidatesRepo.marks[0].status).toBe('REJECTED');
  });

  it('rejects a structurally invalid payload (empty title)', async () => {
    const { useCase, candidatesRepo } = buildUseCase({
      candidates: [candidate({ extractedPayload: payload({ title: '' }) })],
    });

    const result = await useCase.execute({ candidateId: 'cand_1', now: NOW });

    expect(result.outcome).toBe('REJECTED');
    expect(candidatesRepo.marks[0].status).toBe('REJECTED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/application/PromoteCandidateUseCase.test.ts`
Expected: FAIL — cannot find module `./PromoteCandidateUseCase`.

- [ ] **Step 3: Write the implementation**

Create `src/modules/activities/application/PromoteCandidateUseCase.ts`:

```typescript
import { createActivity, type ActivityCreateInput } from '../domain/Activity';
import { isWithinCityBbox } from '../domain/City';
import { computeDedupeKey } from '../domain/computeDedupeKey';
import { computeExpiresAt, computeRecheckAfter } from '../domain/freshness';
import type { IActivityIngestionRepository } from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
import type { ICandidateRepository } from '../domain/ICandidateRepository';
import type { ICityRepository } from '../domain/ICityRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
} from '../domain/RawActivityCandidate';
import { slugify } from '../domain/slug';

export type PromotionOutcome = 'PROMOTED' | 'DUPLICATE' | 'REJECTED';

export type PromotionResult = {
  outcome: PromotionOutcome;
  activityId: string | null;
  reason: string | null;
};

export type PromoteCandidateInput = {
  candidateId: string;
  now: Date;
};

export class PromoteCandidateUseCase {
  constructor(
    private readonly activities: IActivityRepository,
    private readonly ingestion: IActivityIngestionRepository,
    private readonly candidates: ICandidateRepository,
    private readonly cities: ICityRepository,
  ) {}

  async execute(input: PromoteCandidateInput): Promise<PromotionResult> {
    const candidate = await this.candidates.findById(input.candidateId);
    if (!candidate) {
      throw new Error(`Candidate ${input.candidateId} not found.`);
    }

    const city = await this.cities.findById(candidate.cityId);
    if (!city) {
      return this.reject(candidate.id, `Unknown city ${candidate.cityId}.`);
    }

    const payload = candidate.extractedPayload;
    if (!isWithinCityBbox(city, payload.latitude, payload.longitude)) {
      return this.reject(candidate.id, 'Coordinates outside city bbox.');
    }

    const dateStart = payload.dateStart ? new Date(payload.dateStart) : null;
    const dateEnd = payload.dateEnd ? new Date(payload.dateEnd) : null;

    let dedupeKey: string;
    let baseInput: Omit<ActivityCreateInput, 'slug'>;
    try {
      dedupeKey = computeDedupeKey({
        kind: payload.kind,
        title: payload.title,
        dateStart,
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      baseInput = {
        title: payload.title,
        description: payload.description,
        imageUrl: payload.imageUrl,
        imageCredit: payload.imageCredit,
        kind: payload.kind,
        category: payload.category,
        address: payload.address,
        neighborhood: payload.neighborhood,
        latitude: payload.latitude,
        longitude: payload.longitude,
        dateStart,
        dateEnd,
        priceMinCents: payload.priceMinCents,
        priceMaxCents: payload.priceMaxCents,
        externalUrl: payload.externalUrl,
        indoor: payload.indoor,
        outdoor: payload.outdoor,
        isFeatured: false,
        status: 'PUBLISHED',
        sourceId: '', // resolved below for the create branch
        externalId: null,
        cityId: city.id,
        tags: payload.tags,
        dedupeKey,
        expiresAt: computeExpiresAt({ kind: payload.kind, dateEnd }),
        lastSeenAt: input.now,
        lastVerifiedAt: input.now,
        recheckAfter: computeRecheckAfter({ kind: payload.kind, lastSeenAt: input.now }),
      };
    } catch (error) {
      return this.reject(candidate.id, messageOf(error));
    }

    const existing = await this.ingestion.findByCityAndDedupeKey(city.id, dedupeKey);
    if (existing) {
      await this.ingestion.refreshFreshness(existing.id, {
        lastSeenAt: input.now,
        lastVerifiedAt: input.now,
        recheckAfter: computeRecheckAfter({ kind: existing.kind, lastSeenAt: input.now }),
      });
      await this.candidates.markDuplicate(candidate.id, existing.id);
      return { outcome: 'DUPLICATE', activityId: existing.id, reason: null };
    }

    let created;
    try {
      const sourceId = await this.activities.getOrCreateSourceIdByName(candidate.agentName);
      const slug = await this.uniqueSlug(payload.title);
      created = await this.activities.create(
        createActivity({ ...baseInput, sourceId, slug }),
      );
    } catch (error) {
      return this.reject(candidate.id, messageOf(error));
    }

    await this.candidates.markPromoted(candidate.id, created.id);
    return { outcome: 'PROMOTED', activityId: created.id, reason: null };
  }

  private async reject(candidateId: string, reason: string): Promise<PromotionResult> {
    await this.candidates.markRejected(candidateId, reason);
    return { outcome: 'REJECTED', activityId: null, reason };
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.activities.slugExists(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type { ExtractedActivityPayload, RawActivityCandidate };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/application/PromoteCandidateUseCase.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/application/PromoteCandidateUseCase.ts src/modules/activities/application/PromoteCandidateUseCase.test.ts
git commit -m "feat(activities): add PromoteCandidateUseCase (staging → Activity, spec §5)"
```

---

### Task 9: `ConfirmActivityUseCase` (spec §6)

> The re-verification *decision* (still valid?) is made by the orchestrator agent in the follow-up MCP plan. This task builds only the deterministic "the agent confirmed it still exists" operation: refresh `lastSeenAt`/`lastVerifiedAt` to now and recompute `recheckAfter`. Archiving is `IActivityIngestionRepository.archive` (built in Task 7/12, no domain logic, no use case needed).

**Files:**
- Create: `src/modules/activities/application/ConfirmActivityUseCase.ts`
- Test: `src/modules/activities/application/ConfirmActivityUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/application/ConfirmActivityUseCase.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import type { Activity } from '../domain/Activity';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { ConfirmActivityUseCase } from './ConfirmActivityUseCase';

const NOW = new Date('2026-05-23T12:00:00.000Z');

function activity(id: string, kind: Activity['kind']): Activity {
  return { ...({} as Activity), id, slug: id, kind, cityId: 'city_mtl' } as Activity;
}

class FakeActivities {
  constructor(private readonly byId: Map<string, Activity>) {}
  async findById(id: string): Promise<Activity | null> {
    return this.byId.get(id) ?? null;
  }
}

class FakeIngestion implements IActivityIngestionRepository {
  readonly refreshed: Array<{ id: string; update: FreshnessUpdate }> = [];
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return null;
  }
  async refreshFreshness(id: string, update: FreshnessUpdate): Promise<void> {
    this.refreshed.push({ id, update });
  }
  async findDueForRecheck(): Promise<Activity[]> {
    return [];
  }
  async archive(): Promise<void> {}
}

function build(map: Map<string, Activity>) {
  const ingestion = new FakeIngestion();
  const useCase = new ConfirmActivityUseCase(
    new FakeActivities(map) as unknown as IActivityRepository,
    ingestion,
  );
  return { useCase, ingestion };
}

describe('ConfirmActivityUseCase', () => {
  it('refreshes freshness and recomputes recheckAfter (+90d) for a PLACE', async () => {
    const { useCase, ingestion } = build(new Map([['a', activity('a', 'PLACE')]]));

    await useCase.execute({ activityId: 'a', now: NOW });

    expect(ingestion.refreshed).toEqual([
      {
        id: 'a',
        update: {
          lastSeenAt: NOW,
          lastVerifiedAt: NOW,
          recheckAfter: new Date('2026-08-21T12:00:00.000Z'),
        },
      },
    ]);
  });

  it('sets recheckAfter null for an EVENT', async () => {
    const { useCase, ingestion } = build(new Map([['e', activity('e', 'EVENT')]]));

    await useCase.execute({ activityId: 'e', now: NOW });

    expect(ingestion.refreshed[0].update.recheckAfter).toBeNull();
  });

  it('throws when the activity does not exist', async () => {
    const { useCase } = build(new Map());

    await expect(useCase.execute({ activityId: 'missing', now: NOW })).rejects.toThrow(/not found/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/application/ConfirmActivityUseCase.test.ts`
Expected: FAIL — cannot find module `./ConfirmActivityUseCase`.

- [ ] **Step 3: Write the implementation**

Create `src/modules/activities/application/ConfirmActivityUseCase.ts`:

```typescript
import { computeRecheckAfter } from '../domain/freshness';
import type { IActivityIngestionRepository } from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';

export type ConfirmActivityInput = {
  activityId: string;
  now: Date;
};

/**
 * Spec §6: the orchestrator agent has confirmed (via Tavily) that an activity
 * still exists. Refresh its freshness timestamps to `now` and recompute the
 * absolute `recheckAfter` deadline. The judgment lives in the agent; this use
 * case is the deterministic write the recheck MCP tool will call.
 */
export class ConfirmActivityUseCase {
  constructor(
    private readonly activities: IActivityRepository,
    private readonly ingestion: IActivityIngestionRepository,
  ) {}

  async execute(input: ConfirmActivityInput): Promise<void> {
    const activity = await this.activities.findById(input.activityId);
    if (!activity) {
      throw new Error(`Activity ${input.activityId} not found.`);
    }

    await this.ingestion.refreshFreshness(activity.id, {
      lastSeenAt: input.now,
      lastVerifiedAt: input.now,
      recheckAfter: computeRecheckAfter({ kind: activity.kind, lastSeenAt: input.now }),
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/application/ConfirmActivityUseCase.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/application/ConfirmActivityUseCase.ts src/modules/activities/application/ConfirmActivityUseCase.test.ts
git commit -m "feat(activities): add ConfirmActivityUseCase (refresh + recompute recheckAfter, spec §6)"
```

---

### Task 10: Update `CreateActivityUseCase` to derive dedupe/freshness

**Files:**
- Modify: `src/modules/activities/application/CreateActivityUseCase.ts`
- Test: `src/modules/activities/application/CreateActivityUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/activities/application/CreateActivityUseCase.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { CreateActivityUseCase } from './CreateActivityUseCase';

class FakeActivityRepository implements IActivityRepository {
  readonly created: ActivityCreateInput[] = [];
  private nextId = 1;

  async create(input: ActivityCreateInput): Promise<Activity> {
    this.created.push(input);
    const now = new Date('2026-05-23T00:00:00.000Z');
    return { ...input, id: `activity_${this.nextId++}`, createdAt: now, updatedAt: now };
  }
  async findBySlug(): Promise<Activity | null> {
    return null;
  }
  async findById(): Promise<Activity | null> {
    return null;
  }
  async findByIds(): Promise<Activity[]> {
    return [];
  }
  async findCandidates(): Promise<Activity[]> {
    return [];
  }
  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_1';
  }
  async slugExists(): Promise<boolean> {
    return false;
  }
  async listNeighborhoods(): Promise<string[]> {
    return [];
  }
  async listFeatured(): Promise<Activity[]> {
    return [];
  }
}

const NOW = new Date('2026-05-23T12:00:00.000Z');

const basePlace = {
  title: 'St-Viateur Bagel',
  description: 'Bagels',
  imageUrl: 'https://images.unsplash.com/x',
  imageCredit: null,
  kind: 'PLACE' as const,
  category: 'FOOD' as const,
  address: 'Mile End',
  neighborhood: 'Mile End',
  latitude: 45.5227,
  longitude: -73.6016,
  dateStart: null,
  dateEnd: null,
  priceMinCents: 200,
  priceMaxCents: 2500,
  externalUrl: null,
  indoor: true,
  outdoor: false,
  isFeatured: false,
  status: 'PUBLISHED' as const,
  externalId: null,
  cityId: 'city_mtl',
  tags: [],
};

describe('CreateActivityUseCase', () => {
  it('derives dedupeKey, expiresAt (null for PLACE), and freshness fields', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new CreateActivityUseCase(repo);

    await useCase.execute({ ...basePlace, now: NOW });

    const created = repo.created[0];
    expect(created.dedupeKey).toBe('st-viateur-bagel|45.523,-73.602');
    expect(created.expiresAt).toBeNull();
    expect(created.lastSeenAt).toEqual(NOW);
    expect(created.lastVerifiedAt).toEqual(NOW);
    expect(created.recheckAfter).toEqual(new Date('2026-08-21T12:00:00.000Z'));
  });

  it('sets expiresAt = dateEnd for an EVENT', async () => {
    const repo = new FakeActivityRepository();
    const useCase = new CreateActivityUseCase(repo);
    const dateStart = new Date('2026-06-04T16:00:00.000Z');
    const dateEnd = new Date('2026-06-14T03:00:00.000Z');

    await useCase.execute({
      ...basePlace,
      title: 'MURAL Festival',
      kind: 'EVENT',
      dateStart,
      dateEnd,
      now: NOW,
    });

    const created = repo.created[0];
    expect(created.expiresAt).toEqual(dateEnd);
    expect(created.recheckAfter).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/application/CreateActivityUseCase.test.ts`
Expected: FAIL — `execute` does not accept `now`/lacks the derived fields (type + assertion errors).

- [ ] **Step 3: Update the implementation**

Replace `src/modules/activities/application/CreateActivityUseCase.ts` with:

```typescript
import { createActivity, type Activity, type ActivityCreateInput } from '../domain/Activity';
import { computeDedupeKey } from '../domain/computeDedupeKey';
import { computeExpiresAt, computeRecheckAfter } from '../domain/freshness';
import type { IActivityRepository } from '../domain/IActivityRepository';
import { slugify } from '../domain/slug';

export type CreateActivityUseCaseInput = Omit<
  ActivityCreateInput,
  'slug' | 'sourceId' | 'dedupeKey' | 'expiresAt' | 'lastSeenAt' | 'lastVerifiedAt' | 'recheckAfter'
> & {
  slug?: string;
  sourceName?: string;
  now?: Date;
};

export class CreateActivityUseCase {
  constructor(private readonly activities: IActivityRepository) {}

  async execute(input: CreateActivityUseCaseInput): Promise<Activity> {
    const now = input.now ?? new Date();
    const sourceId = await this.activities.getOrCreateSourceIdByName(input.sourceName ?? 'manual');
    const slug = await this.createUniqueSlug(input.slug ?? input.title);

    const dedupeKey = computeDedupeKey({
      kind: input.kind,
      title: input.title,
      dateStart: input.dateStart,
      latitude: input.latitude,
      longitude: input.longitude,
    });

    return this.activities.create(
      createActivity({
        ...input,
        slug,
        sourceId,
        dedupeKey,
        expiresAt: computeExpiresAt({ kind: input.kind, dateEnd: input.dateEnd }),
        lastSeenAt: now,
        lastVerifiedAt: now,
        recheckAfter: computeRecheckAfter({ kind: input.kind, lastSeenAt: now }),
      }),
    );
  }

  private async createUniqueSlug(value: string): Promise<string> {
    const baseSlug = slugify(value);
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.activities.slugExists(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
```

> The local `slugify` function was removed in favor of the shared domain `slugify` (Task 1). The `now` field is stripped implicitly because it is not part of `ActivityCreateInput`, so `createActivity({ ...input, ... })` ignores it.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/application/CreateActivityUseCase.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/application/CreateActivityUseCase.ts src/modules/activities/application/CreateActivityUseCase.test.ts
git commit -m "feat(activities): derive dedupeKey/expiresAt/freshness in CreateActivityUseCase"
```

---

# Phase 4 — Prisma schema + adapters

### Task 11: Prisma schema changes (spec §4)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the `City` model**

Insert after the `model User { ... }` block (after line 18), a new model:

```prisma
model City {
  id         String     @id @default(cuid())
  slug       String     @unique
  name       String
  country    String
  timezone   String
  centerLat  Float
  centerLng  Float
  bboxMinLat Float
  bboxMinLng Float
  bboxMaxLat Float
  bboxMaxLng Float
  activities Activity[]
  users      User[]
}
```

- [ ] **Step 2: Add `cityId`, `gender`, `birthDate` to `User`**

In `model User`, add these lines (e.g. after `createdAt`):

```prisma
  cityId          String
  city            City                   @relation(fields: [cityId], references: [id])
  gender          Gender
  birthDate       DateTime               @db.Date
```

> `gender`/`birthDate` are persisted now at the product owner's request (initial user: Hugo Coeuillet, Montréal, Homme, 2000-06-28). They have **no consumer yet** — the profile page still reads `MockProfileRepository`. Do **not** add them to `CurrentUser`/`getCurrentUser` (Task 18) until something reads them; this is tracked in `tbd.md`.

- [ ] **Step 3: Add the `CandidateStatus` and `Gender` enums**

After the existing `enum ActivityCategory { ... }` block, add:

```prisma
enum CandidateStatus {
  PENDING
  PROMOTED
  REJECTED
  DUPLICATE
}

enum Gender {
  MALE
  FEMALE
  OTHER
}
```

- [ ] **Step 4: Extend `Activity`**

In `model Activity`, add the new fields after `externalId String?` (line 69) and add the relation + new index. The additions:

```prisma
  cityId         String
  city           City             @relation(fields: [cityId], references: [id])
  tags           String[]         @default([])
  dedupeKey      String
  expiresAt      DateTime?
  lastSeenAt     DateTime         @default(now())
  lastVerifiedAt DateTime?
  recheckAfter   DateTime?
```

Then add these two lines to the index block at the bottom of the model (alongside the existing `@@unique`/`@@index` lines):

```prisma
  @@unique([cityId, dedupeKey])
  @@index([cityId, status, expiresAt])
```

- [ ] **Step 5: Add the `RawActivityCandidate` model**

At the end of the file, add:

```prisma
model RawActivityCandidate {
  id                 String          @id @default(cuid())
  cityId             String
  category           ActivityCategory
  agentName          String
  searchQuery        String
  sourceUrl          String
  rawExcerpt         String
  extractedPayload   Json
  dedupeKey          String
  status             CandidateStatus @default(PENDING)
  promotedActivityId String?
  rejectionReason    String?
  createdAt          DateTime        @default(now())

  @@index([status, cityId, createdAt])
  @@index([dedupeKey])
}
```

- [ ] **Step 6: Validate the schema and regenerate the client**

Run: `pnpm prisma:validate`
Expected: "The schema at prisma/schema.prisma is valid 🚀"

Run: `pnpm exec prisma generate`
Expected: "Generated Prisma Client" — this updates `@prisma/client` types so the infra tasks below type-check.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add City, RawActivityCandidate, Activity freshness fields, User city/gender/birthDate (spec §4)"
```

---

### Task 12: Extend `PrismaActivityRepository` (mapping, create, city/freshness filter, ingestion port)

**Files:**
- Modify: `src/modules/activities/infra/PrismaActivityRepository.ts`

- [ ] **Step 1: Update the class declaration and imports**

Change the imports at the top to add the ingestion port and candidate-free types. Replace lines 1–6 with:

```typescript
import type { Activity as PrismaActivityModel, Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type { Activity, ActivityCreateInput } from '../domain/Activity';
import type { ActivityCandidateCriteria } from '../domain/ActivityCandidateCriteria';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../domain/IActivityRepository';
```

Change the class line (line 8) to implement both ports:

```typescript
export class PrismaActivityRepository
  implements IActivityRepository, IActivityIngestionRepository
{
```

- [ ] **Step 2: Write the new columns in `create`**

In the `create` method's `data: { ... }` object, add these fields after `externalId: input.externalId,`:

```typescript
        cityId: input.cityId,
        tags: input.tags,
        dedupeKey: input.dedupeKey,
        expiresAt: input.expiresAt,
        lastSeenAt: input.lastSeenAt,
        lastVerifiedAt: input.lastVerifiedAt,
        recheckAfter: input.recheckAfter,
```

- [ ] **Step 3: Add city + freshness filtering in `findCandidates`**

In `findCandidates`, change the `where` initializer (currently `const where: Prisma.ActivityWhereInput = { status: criteria.status };`) to include cityId:

```typescript
    const where: Prisma.ActivityWhereInput = { status: criteria.status, cityId: criteria.cityId };
```

Then, immediately before the `if (and.length > 0) where.AND = and;` line, add the freshness filter:

```typescript
    if (criteria.notExpiredAsOf) {
      and.push({
        OR: [{ expiresAt: null }, { expiresAt: { gt: criteria.notExpiredAsOf } }],
      });
    }
```

- [ ] **Step 4: Map the new columns in `toActivity`**

In the `toActivity` function at the bottom, add these to the returned object after `externalId: activity.externalId,`:

```typescript
    cityId: activity.cityId,
    tags: activity.tags,
    dedupeKey: activity.dedupeKey,
    expiresAt: activity.expiresAt,
    lastSeenAt: activity.lastSeenAt,
    lastVerifiedAt: activity.lastVerifiedAt,
    recheckAfter: activity.recheckAfter,
```

- [ ] **Step 5: Implement the `IActivityIngestionRepository` methods**

Add these methods to the class (e.g. after `listFeatured`):

```typescript
  async findByCityAndDedupeKey(cityId: string, dedupeKey: string): Promise<Activity | null> {
    const activity = await this.prisma.activity.findUnique({
      where: { cityId_dedupeKey: { cityId, dedupeKey } },
    });
    return activity ? toActivity(activity) : null;
  }

  async refreshFreshness(id: string, update: FreshnessUpdate): Promise<void> {
    await this.prisma.activity.update({
      where: { id },
      data: {
        lastSeenAt: update.lastSeenAt,
        lastVerifiedAt: update.lastVerifiedAt,
        recheckAfter: update.recheckAfter,
      },
    });
  }

  async findDueForRecheck(cityId: string, now: Date): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { cityId, status: 'PUBLISHED', recheckAfter: { lte: now } },
    });
    return activities.map(toActivity);
  }

  async archive(id: string): Promise<void> {
    await this.prisma.activity.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }
```

> `cityId_dedupeKey` is the compound-unique accessor Prisma generates from `@@unique([cityId, dedupeKey])`.

- [ ] **Step 6: Verify it type-checks**

Run: `pnpm type-check`
Expected: errors remaining only in feed/favorites/admin/contracts/fakes (Tasks 13–20). `PrismaActivityRepository.ts` and `PrismaActivityRepository`-related lines must show **no** errors. If you see errors inside this file, fix them before continuing.

- [ ] **Step 7: Commit**

```bash
git add src/modules/activities/infra/PrismaActivityRepository.ts
git commit -m "feat(activities): map freshness columns + implement ingestion port in Prisma repo"
```

---

### Task 13: `PrismaCityRepository`

**Files:**
- Create: `src/modules/activities/infra/PrismaCityRepository.ts`

- [ ] **Step 1: Create the adapter**

```typescript
import type { City as PrismaCityModel, PrismaClient } from '@prisma/client';

import type { City } from '../domain/City';
import type { ICityRepository } from '../domain/ICityRepository';

export class PrismaCityRepository implements ICityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<City | null> {
    const city = await this.prisma.city.findUnique({ where: { id } });
    return city ? toCity(city) : null;
  }

  async findBySlug(slug: string): Promise<City | null> {
    const city = await this.prisma.city.findUnique({ where: { slug } });
    return city ? toCity(city) : null;
  }
}

function toCity(city: PrismaCityModel): City {
  return {
    id: city.id,
    slug: city.slug,
    name: city.name,
    country: city.country,
    timezone: city.timezone,
    centerLat: city.centerLat,
    centerLng: city.centerLng,
    bboxMinLat: city.bboxMinLat,
    bboxMinLng: city.bboxMinLng,
    bboxMaxLat: city.bboxMaxLat,
    bboxMaxLng: city.bboxMaxLng,
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm type-check`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/infra/PrismaCityRepository.ts
git commit -m "feat(activities): add PrismaCityRepository"
```

---

### Task 14: `PrismaCandidateRepository`

**Files:**
- Create: `src/modules/activities/infra/PrismaCandidateRepository.ts`

- [ ] **Step 1: Create the adapter**

```typescript
import type { Prisma, PrismaClient, RawActivityCandidate as PrismaCandidateModel } from '@prisma/client';

import type { ICandidateRepository } from '../domain/ICandidateRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
  RawActivityCandidateCreateInput,
} from '../domain/RawActivityCandidate';

export class PrismaCandidateRepository implements ICandidateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: RawActivityCandidateCreateInput): Promise<RawActivityCandidate> {
    const candidate = await this.prisma.rawActivityCandidate.create({
      data: {
        cityId: input.cityId,
        category: input.category,
        agentName: input.agentName,
        searchQuery: input.searchQuery,
        sourceUrl: input.sourceUrl,
        rawExcerpt: input.rawExcerpt,
        extractedPayload: input.extractedPayload as unknown as Prisma.InputJsonValue,
        dedupeKey: input.dedupeKey,
      },
    });
    return toCandidate(candidate);
  }

  async findById(id: string): Promise<RawActivityCandidate | null> {
    const candidate = await this.prisma.rawActivityCandidate.findUnique({ where: { id } });
    return candidate ? toCandidate(candidate) : null;
  }

  async markPromoted(id: string, activityId: string): Promise<void> {
    await this.prisma.rawActivityCandidate.update({
      where: { id },
      data: { status: 'PROMOTED', promotedActivityId: activityId },
    });
  }

  async markDuplicate(id: string, activityId: string): Promise<void> {
    await this.prisma.rawActivityCandidate.update({
      where: { id },
      data: { status: 'DUPLICATE', promotedActivityId: activityId },
    });
  }

  async markRejected(id: string, reason: string): Promise<void> {
    await this.prisma.rawActivityCandidate.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
  }
}

function toCandidate(candidate: PrismaCandidateModel): RawActivityCandidate {
  return {
    id: candidate.id,
    cityId: candidate.cityId,
    category: candidate.category,
    agentName: candidate.agentName,
    searchQuery: candidate.searchQuery,
    sourceUrl: candidate.sourceUrl,
    rawExcerpt: candidate.rawExcerpt,
    extractedPayload: candidate.extractedPayload as unknown as ExtractedActivityPayload,
    dedupeKey: candidate.dedupeKey,
    status: candidate.status,
    promotedActivityId: candidate.promotedActivityId,
    rejectionReason: candidate.rejectionReason,
    createdAt: candidate.createdAt,
  };
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm type-check`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/infra/PrismaCandidateRepository.ts
git commit -m "feat(activities): add PrismaCandidateRepository staging adapter"
```

---

# Phase 5 — DTO + feed wiring

### Task 15: Expose `tags` in the DTO (spec §8)

> The feed is scoped to the connected user's city **server-side** (Tasks 18–19), so every item in a response already shares one city — a per-activity `cityId` in the DTO would be dead weight (the UI never displays an opaque id, and there is no city switcher in this single-city POC). We expose only `tags` (used for theme/multi-feed). City exposure as `{ slug, name }` is parked in `tbd.md` for when a multi-city UI exists. Freshness fields stay server-side (CLAUDE.md §6).

**Files:**
- Modify: `src/shared/contracts/ActivityDTO.ts`
- Modify: `src/shared/contracts/toActivityDTO.ts`

- [ ] **Step 1: Add `tags` to `ActivityDTO`**

In `src/shared/contracts/ActivityDTO.ts`, add this field after `externalId: string | null;`:

```typescript
  tags: string[];
```

> Deliberately omitted: `cityId`, `dedupeKey`, `expiresAt`, `lastSeenAt`, `lastVerifiedAt`, `recheckAfter`. `cityId` is a server-side scoping concern (driven by the user); the rest are freshness internals (spec §8 / CLAUDE.md §6 boundary).

- [ ] **Step 2: Map it in `toActivityDTO`**

In `src/shared/contracts/toActivityDTO.ts`, add after `externalId: activity.externalId,`:

```typescript
    tags: activity.tags,
```

- [ ] **Step 3: Verify it type-checks**

Run: `pnpm type-check`
Expected: no new errors from these two files (other modules still pending).

- [ ] **Step 4: Commit**

```bash
git add src/shared/contracts/ActivityDTO.ts src/shared/contracts/toActivityDTO.ts
git commit -m "feat(contracts): expose tags on ActivityDTO (city stays server-side, freshness internal)"
```

---

### Task 16: Thread `cityId` through `GetFeedUseCase` (spec §6, §8)

**Files:**
- Modify: `src/modules/feed/application/GetFeedUseCase.ts`
- Modify: `src/modules/feed/application/GetFeedUseCase.test.ts`

- [ ] **Step 1: Update the test fake, fixture, and calls; add freshness/city cases**

In `src/modules/feed/application/GetFeedUseCase.test.ts`:

(a) In the fake's `findCandidates` (the `all.filter((a) => { ... })` body), add these two checks at the very top of the filter callback (right after `return all.filter((a) => {`):

```typescript
      if (a.cityId !== criteria.cityId) return false;
      if (
        criteria.notExpiredAsOf &&
        a.expiresAt !== null &&
        a.expiresAt.getTime() <= criteria.notExpiredAsOf.getTime()
      ) {
        return false;
      }
```

(b) In the `activity(overrides)` factory, add the new required fields to the returned object after `externalId: null,`:

```typescript
    cityId: 'city_mtl',
    tags: [],
    dedupeKey: id,
    expiresAt: null,
    lastSeenAt: createdAt,
    lastVerifiedAt: null,
    recheckAfter: null,
```

(c) Every `useCase.execute({ ... })` call in this file must now pass `cityId: 'city_mtl'`. Add `cityId: 'city_mtl',` to each of the execute argument objects (there are calls in: the empty-result test, ranked test, 3 calls in the pagination test, the preset-compose test, the kind=EVENT test, the date-range test, and the invalid-cursor test).

(d) Add a new test at the end of the `describe` block:

```typescript
  it('scopes to the cityId and hides expired events', async () => {
    const repo = new FakeActivityRepository();
    repo.seed([
      activity({ id: 'mtl_live', slug: 'mtl_live', cityId: 'city_mtl', expiresAt: null }),
      activity({
        id: 'mtl_expired',
        slug: 'mtl_expired',
        cityId: 'city_mtl',
        kind: 'EVENT',
        dateStart: new Date('2026-05-01T19:00:00.000Z'),
        dateEnd: new Date('2026-05-01T21:00:00.000Z'),
        expiresAt: new Date('2026-05-01T21:00:00.000Z'),
      }),
      activity({ id: 'other_city', slug: 'other_city', cityId: 'city_qc', expiresAt: null }),
    ]);
    const useCase = new GetFeedUseCase(repo);

    const result = await useCase.execute({
      filters: {},
      cursor: null,
      affinityMap: EMPTY_AFFINITY,
      now: NOW,
      cityId: 'city_mtl',
    });

    expect(result.items.map((i) => i.id)).toEqual(['mtl_live']);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/feed/application/GetFeedUseCase.test.ts`
Expected: FAIL — `GetFeedInput` has no `cityId`, and `toCriteria` does not set `cityId`/`notExpiredAsOf`.

- [ ] **Step 3: Update `GetFeedUseCase.ts`**

Add `cityId: string;` to `GetFeedInput` (after `now: Date;`).

Change the `toCriteria` call site in `execute` to pass cityId and set freshness. Replace:

```typescript
    const criteria = toCriteria(merged, input.now);
```

with:

```typescript
    const criteria = toCriteria(merged, input.now, input.cityId);
```

Update the `toCriteria` signature and initializer. Replace its first two lines:

```typescript
function toCriteria(filters: FilterValue, now: Date): ActivityCandidateCriteria {
  const criteria: ActivityCandidateCriteria = { status: 'PUBLISHED' };
```

with:

```typescript
function toCriteria(filters: FilterValue, now: Date, cityId: string): ActivityCandidateCriteria {
  const criteria: ActivityCandidateCriteria = {
    status: 'PUBLISHED',
    cityId,
    notExpiredAsOf: now,
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/feed/application/GetFeedUseCase.test.ts`
Expected: PASS (all original + 1 new case).

- [ ] **Step 5: Commit**

```bash
git add src/modules/feed/application/GetFeedUseCase.ts src/modules/feed/application/GetFeedUseCase.test.ts
git commit -m "feat(feed): scope feed by cityId and filter expired activities (spec §6)"
```

---

### Task 17: Thread `cityId` through `ListFavoritesUseCase`

**Files:**
- Modify: `src/modules/favorites/application/ListFavoritesUseCase.ts`
- Modify: `src/modules/favorites/application/ListFavoritesUseCase.test.ts`

- [ ] **Step 1: Update the test fake, fixture, and calls**

In `src/modules/favorites/application/ListFavoritesUseCase.test.ts`:

(a) In the fake's `findCandidates`, add the cityId guard at the top of the filter callback (right after `return Array.from(this.bySlug.values()).filter((a) => {`):

```typescript
      if (a.cityId !== criteria.cityId) return false;
```

(b) In the `activity(overrides)` factory, add after `externalId: null,`:

```typescript
    cityId: 'city_mtl',
    tags: [],
    dedupeKey: id,
    expiresAt: null,
    lastSeenAt: createdAt,
    lastVerifiedAt: null,
    recheckAfter: null,
```

(c) Add `cityId: 'city_mtl',` to each of the three `useCase.execute({ ... })` argument objects in this file.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/modules/favorites/application/ListFavoritesUseCase.test.ts`
Expected: FAIL — `ListFavoritesInput`/forwarded `GetFeedInput` lacks `cityId`.

- [ ] **Step 3: Update `ListFavoritesUseCase.ts`**

Add `cityId: string;` to `ListFavoritesInput` (after `now: Date;`).

In `execute`, forward it to the feed — add `cityId: input.cityId,` to the `this.feed.execute({ ... })` argument object (e.g. after `now: input.now,`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/modules/favorites/application/ListFavoritesUseCase.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/favorites/application/ListFavoritesUseCase.ts src/modules/favorites/application/ListFavoritesUseCase.test.ts
git commit -m "feat(favorites): thread cityId into the favorites feed"
```

---

### Task 18: Add `cityId` to `CurrentUser`

**Files:**
- Modify: `src/shared/auth/current-user.ts`

- [ ] **Step 1: Extend the type and the query**

In `src/shared/auth/current-user.ts`:

Add `cityId: string;` to the `CurrentUser` type (after `name: string;`).

In the `prisma.user.findUnique` call, change the `select` to include cityId:

```typescript
    select: { id: true, email: true, name: true, cityId: true },
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm type-check`
Expected: no new errors from this file (routes are updated next).

- [ ] **Step 3: Commit**

```bash
git add src/shared/auth/current-user.ts
git commit -m "feat(auth): expose the current user's cityId"
```

---

### Task 19: Pass `user.cityId` from the feed routes

**Files:**
- Modify: `src/modules/feed/web/feedRoute.ts`
- Modify: `src/modules/favorites/web/favoritesFeedRoute.ts`

- [ ] **Step 1: feedRoute**

In `src/modules/feed/web/feedRoute.ts`, in the `useCase.execute({ ... })` call, add `cityId: user.cityId,` (e.g. after `now: new Date(),`).

- [ ] **Step 2: favoritesFeedRoute**

In `src/modules/favorites/web/favoritesFeedRoute.ts`, in the `useCase.execute({ ... })` call, add `cityId: user.cityId,` (e.g. after `now: new Date(),`).

- [ ] **Step 3: Verify it type-checks**

Run: `pnpm type-check`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add src/modules/feed/web/feedRoute.ts src/modules/favorites/web/favoritesFeedRoute.ts
git commit -m "feat(feed): drive feed city scope from the current user"
```

---

### Task 20: Resolve a city in the admin create route

**Files:**
- Modify: `src/modules/activities/web/adminActivityRoute.ts`

- [ ] **Step 1: Accept an optional citySlug + tags and resolve the city**

In `src/modules/activities/web/adminActivityRoute.ts`:

(a) Add the import:

```typescript
import { PrismaCityRepository } from '../infra/PrismaCityRepository';
```

(b) Add two fields to `AdminActivitySchema` (before the closing `});`):

```typescript
  citySlug: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
```

(c) Inside `postAdminActivity`, after `const body = AdminActivitySchema.parse(...)`, resolve the city:

```typescript
  const citySlug = body.citySlug ?? 'montreal';
  const city = await new PrismaCityRepository(prisma).findBySlug(citySlug);
  if (!city) {
    return NextResponse.json({ error: `Unknown city: ${citySlug}` }, { status: 400 });
  }
```

(d) In the `useCase.execute({ ... })` object, add these two fields (e.g. after `slug: body.slug,`):

```typescript
    cityId: city.id,
    tags: body.tags ?? [],
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm type-check`
Expected: PASS for this file. (Test fixtures in Task 21 may still be failing.)

- [ ] **Step 3: Commit**

```bash
git add src/modules/activities/web/adminActivityRoute.ts
git commit -m "feat(activities): resolve city + accept tags in admin create route"
```

---

# Phase 6 — Remaining fixtures, seed, full verification

### Task 21: Update the remaining `Activity` test fixtures

**Files:**
- Modify: `src/modules/activities/application/GetActivityUseCase.test.ts`
- Modify: `src/modules/activities/application/ListFeaturedActivitiesUseCase.test.ts`
- Modify: `src/modules/calendar/application/AddToCalendarUseCase.test.ts`

These three fakes implement `IActivityRepository` (unchanged) but build `Activity` objects that now miss required fields.

- [ ] **Step 1: GetActivityUseCase fixture (EVENT base)**

In `src/modules/activities/application/GetActivityUseCase.test.ts`, in `activityFixture`, add after `externalId: 'event_mural',`:

```typescript
    cityId: 'city_mtl',
    tags: [],
    dedupeKey: 'mural-festival|2026-06-15|45.516,-73.583',
    expiresAt: new Date('2026-06-15T21:00:00.000Z'),
    lastSeenAt: createdAt,
    lastVerifiedAt: null,
    recheckAfter: null,
```

- [ ] **Step 2: ListFeaturedActivitiesUseCase fixture (PLACE base)**

In `src/modules/activities/application/ListFeaturedActivitiesUseCase.test.ts`, in `activityFixture`, add after `externalId: null,`:

```typescript
    cityId: 'city_mtl',
    tags: [],
    dedupeKey: 'a|45.000,-73.000',
    expiresAt: null,
    lastSeenAt: created,
    lastVerifiedAt: null,
    recheckAfter: null,
```

- [ ] **Step 3: AddToCalendarUseCase fixture (PLACE base)**

In `src/modules/calendar/application/AddToCalendarUseCase.test.ts`, in `activityFixture`, add after `externalId: null,`:

```typescript
    cityId: 'city_mtl',
    tags: [],
    dedupeKey: 'demo|0.000,0.000',
    expiresAt: null,
    lastSeenAt: now,
    lastVerifiedAt: null,
    recheckAfter: null,
```

- [ ] **Step 4: Run the three test files**

Run: `pnpm exec vitest run src/modules/activities/application/GetActivityUseCase.test.ts src/modules/activities/application/ListFeaturedActivitiesUseCase.test.ts src/modules/calendar/application/AddToCalendarUseCase.test.ts`
Expected: PASS (all existing assertions unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/application/GetActivityUseCase.test.ts src/modules/activities/application/ListFeaturedActivitiesUseCase.test.ts src/modules/calendar/application/AddToCalendarUseCase.test.ts
git commit -m "test: backfill new Activity required fields in remaining fixtures"
```

---

### Task 22: Update the seed to create the city and freshness fields (spec §8)

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Import the domain helpers**

Add to the top of `prisma/seed.ts` (after the existing imports):

```typescript
import { computeDedupeKey } from '../src/modules/activities/domain/computeDedupeKey';
import { computeExpiresAt, computeRecheckAfter } from '../src/modules/activities/domain/freshness';
```

- [ ] **Step 2: Upsert the Montréal city at the start of `main`**

Inside `main()`, before the `const user = await prisma.user.upsert(...)` call, add:

```typescript
  const montreal = await prisma.city.upsert({
    where: { slug: 'montreal' },
    update: {},
    create: {
      slug: 'montreal',
      name: 'Montréal',
      country: 'CA',
      timezone: 'America/Toronto',
      centerLat: 45.5019,
      centerLng: -73.5674,
      bboxMinLat: 45.4,
      bboxMinLng: -73.98,
      bboxMaxLat: 45.71,
      bboxMaxLng: -73.47,
    },
  });
```

- [ ] **Step 3: Set up the initial user (city, gender, birthDate)**

Make the seeded user the real initial user. Email/name stay env-driven (`SEED_USER_EMAIL` = `coeuillethugo2000@gmail.com`, `SEED_USER_NAME` = `Hugo Coeuillet`); add city + the profile attributes. The call becomes:

```typescript
  const user = await prisma.user.upsert({
    where: { email: env.SEED_USER_EMAIL },
    update: {
      name: env.SEED_USER_NAME,
      cityId: montreal.id,
      gender: 'MALE',
      birthDate: new Date('2000-06-28'),
    },
    create: {
      email: env.SEED_USER_EMAIL,
      name: env.SEED_USER_NAME,
      cityId: montreal.id,
      gender: 'MALE',
      birthDate: new Date('2000-06-28'),
    },
  });
```

> `gender`/`birthDate` are persisted but not yet read anywhere (profile is still `MockProfileRepository`). Tracked in `tbd.md` under "wire profile to DB".

- [ ] **Step 4: Compute freshness + city for each seeded activity**

Replace the `for (const activity of [...eventActivities, ...placeActivities]) { ... }` loop body so it computes the derived fields and writes them in both `update` and `create`. The new loop:

```typescript
  const seedNow = new Date();
  for (const activity of [...eventActivities, ...placeActivities]) {
    const dedupeKey = computeDedupeKey({
      kind: activity.kind,
      title: activity.title,
      dateStart: activity.dateStart,
      latitude: activity.latitude,
      longitude: activity.longitude,
    });
    const expiresAt = computeExpiresAt({ kind: activity.kind, dateEnd: activity.dateEnd });
    const recheckAfter = computeRecheckAfter({ kind: activity.kind, lastSeenAt: seedNow });

    await prisma.activity.upsert({
      where: {
        sourceId_externalId: {
          sourceId: source.id,
          externalId: activity.externalId,
        },
      },
      update: {
        slug: activity.slug,
        title: activity.title,
        description: activity.description,
        imageUrl: activity.imageUrl,
        imageCredit: activity.imageCredit,
        kind: activity.kind,
        category: activity.category,
        address: activity.address,
        neighborhood: activity.neighborhood,
        latitude: activity.latitude,
        longitude: activity.longitude,
        dateStart: activity.dateStart,
        dateEnd: activity.dateEnd,
        priceMinCents: activity.priceMinCents,
        priceMaxCents: activity.priceMaxCents,
        externalUrl: activity.externalUrl,
        indoor: activity.indoor,
        outdoor: activity.outdoor,
        isFeatured: activity.isFeatured,
        status: 'PUBLISHED',
        cityId: montreal.id,
        tags: [],
        dedupeKey,
        expiresAt,
        lastSeenAt: seedNow,
        lastVerifiedAt: seedNow,
        recheckAfter,
      },
      create: {
        ...activity,
        status: 'PUBLISHED',
        sourceId: source.id,
        cityId: montreal.id,
        tags: [],
        dedupeKey,
        expiresAt,
        lastSeenAt: seedNow,
        lastVerifiedAt: seedNow,
        recheckAfter,
      },
    });
  }
```

- [ ] **Step 5: Type-check the seed**

Run: `pnpm type-check`
Expected: PASS (whole project).

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(db): seed Montréal city + per-activity dedupeKey/freshness (spec §8)"
```

---

### Task 23: Full verification + database reset/reseed

**Files:** none (verification only).

- [ ] **Step 1: Type-check the whole project**

Run: `pnpm type-check`
Expected: PASS — zero errors.

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: PASS — all suites green (including the new domain/use-case tests and the updated fixtures).

- [ ] **Step 3: Architecture rules**

Run: `pnpm dep:check`
Expected: no `error`-severity violations. The new ports/use-cases live in `domain`/`application` and only import sideways or downward. (`PromoteCandidateUseCase` and `ConfirmActivityUseCase` are imported by their tests, so they are not orphans. If any unexpected orphan `warn` appears for a new file, confirm it is imported by its consumer.)

- [ ] **Step 4: Validate the Prisma schema**

Run: `pnpm prisma:validate`
Expected: "valid 🚀".

- [ ] **Step 5: Apply the schema to the dev database and reseed**

> This resets the local dev database. That is expected for this POC — the data is seed-derived and disposable (spec §8 / plan preamble).

Run: `pnpm exec prisma db push --force-reset`
Expected: schema applied, client regenerated, database reset.

Run: `pnpm db:seed`
Expected: the summary object prints non-zero `users`, `sources`, `activities`, `events`, `places` counts and no error.

- [ ] **Step 6: Final commit (if anything regenerated)**

```bash
git add -A
git commit -m "chore: apply activities ingestion schema and reseed dev database"
```

(If `git status` shows nothing staged, skip this commit.)

---

## Self-Review

**Spec coverage:**

- §4.1 City entity → Tasks 4 (domain), 11 (schema), 13 (adapter), 22 (seed). ✓
- §4.2 Activity new fields + unique/index → Tasks 5 (domain), 11 (schema), 12 (mapping). ✓
- §4.3 RawActivityCandidate + CandidateStatus → Tasks 6 (domain), 11 (schema), 14 (adapter). ✓
- §5 dedupeKey + promotion algorithm → Tasks 2 (key), 8 (PromoteCandidateUseCase). ✓
- §6 freshness/expiry feed filter + recheck behavior → Tasks 3 (math), 9 (`ConfirmActivityUseCase` = the deterministic confirm write), 12 + 16 (feed filter); `findDueForRecheck`/`archive` repo ops in Tasks 7 + 12. The recheck *orchestration* (agent judgment) is the follow-up MCP plan. ✓
- §7 re-verification MCP contract → deferred to `docs/superpowers/specs/2026-05-23-ingestion-mcp-server-design.md` (agent-driven, not an in-process port). ✓
- §8 impacts: migration/backfill → Tasks 11 + 22 (reseed approach, documented); domain validation → Task 5; DTO → Task 15; repository feed filter / promotion / re-verification ops → Tasks 12, 8, 9; User.cityId → Tasks 11, 18, 19, 22. ✓
- §9 out of scope (MCP server, Tavily adapter, agents, fuzzy dedupe, geocoding, i18n) → not built; re-verification orchestration deferred to the MCP plan. ✓

**Placeholder scan:** no TODO/TBD/"handle edge cases"/"similar to" placeholders; every code step shows complete code.

**Type consistency:**
- `computeDedupeKey({ kind, title, dateStart, latitude, longitude })` — same shape in Tasks 2, 8, 10, 22.
- `computeExpiresAt({ kind, dateEnd })` and `computeRecheckAfter({ kind, lastSeenAt })` — consistent in Tasks 3, 8, 9, 10, 22.
- `FreshnessUpdate = { lastSeenAt, lastVerifiedAt, recheckAfter }` — consistent in Tasks 7, 8, 9, 12.
- `ActivityCandidateCriteria` gains `cityId` (required) + `notExpiredAsOf` — set in Task 16, consumed in Task 12 and all fakes (16, 17; the no-arg fakes in 21 ignore criteria, which is valid).
- New `Activity` fields (`cityId`, `tags`, `dedupeKey`, `expiresAt`, `lastSeenAt`, `lastVerifiedAt`, `recheckAfter`) — declared in Task 5, written/mapped in Task 12, backfilled in every fixture (5, 16, 17, 21) and the seed (22).
- `PromoteCandidateUseCase` constructor order `(activities, ingestion, candidates, cities)` — matches the test in Task 8.

**Known consistency note:** the recheck-after date `2026-08-21T12:00:00.000Z` used in test assertions (Tasks 8, 9, 10) is exactly `2026-05-23T12:00:00.000Z + 90 days`. If the engineer changes `NOW` in a test, recompute the expected `recheckAfter`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-23-activities-db-ingestion.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
