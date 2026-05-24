# Ingestion MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `wandr-ingestion` MCP server (`src/mcp/`) exposing 4 deterministic tools — `ingestActivity`, `listActivitiesDueForRecheck`, `confirmActivity`, `archiveActivity` — that wrap the existing foundation use cases so an orchestrator agent launched from Claude Code can stage, dedupe, list-for-recheck, confirm, and archive activities.

**Architecture:** `src/mcp/` is a new **composition root** (delivery surface), parallel to Next's `app/`, not a new layer. Each tool is a **pure handler** `(deps, parsedInput) → result` with zero transport coupling, registered onto an `McpServer` over stdio. Handlers are injected with foundation repos/use-cases built once at bootstrap. Validation is two-layer: Zod at the tool boundary (structural → MCP tool error) and domain rules inside the use cases (business → `REJECTED` + `reason`). The server logs one structured line per call to **stderr** (stdout is reserved for JSON-RPC).

**Tech Stack:** TypeScript (ESM), `@modelcontextprotocol/sdk` (stdio transport, `McpServer.registerTool`), Zod, Prisma (dedicated client with event logs → stderr), pino (→ stderr), Vitest (unit + a separate integration project against a real Postgres), `tsx` runner.

---

## File map

**Foundation amendments (pre-requisite — §5 of the spec):**
- Modify: `src/modules/activities/application/ConfirmActivityUseCase.ts` — return `{ recheckAfter }`.
- Modify: `src/modules/activities/application/ConfirmActivityUseCase.test.ts` — assert the return value.
- Modify: `src/modules/activities/domain/IActivityIngestionRepository.ts` — `findDueForRecheck(cityId, now, limit?)` + ordering doc.
- Modify: `src/modules/activities/infra/PrismaActivityRepository.ts` — `orderBy` + `take` in `findDueForRecheck`.
- Create: `src/modules/activities/infra/PrismaActivityRepository.findDueForRecheck.integration.test.ts` — ordering + limit, real DB.

**MCP server (new surface):**
- Create: `src/mcp/logger.ts` — pino → stderr.
- Create: `src/mcp/runTool.ts` — shared try/catch → `CallToolResult`, JSON serialization, structured log.
- Create: `src/mcp/runTool.test.ts` — success/error mapping (the §4.1 backbone).
- Create: `src/mcp/tools/ingestActivity.ts` — schema + deps type + pure handler + description + register fn.
- Create: `src/mcp/tools/ingestActivity.test.ts`.
- Create: `src/mcp/tools/listActivitiesDueForRecheck.ts` + `.test.ts`.
- Create: `src/mcp/tools/confirmActivity.ts` + `.test.ts`.
- Create: `src/mcp/tools/archiveActivity.ts` + `.test.ts`.
- Create: `src/mcp/deps.ts` — `createDeps(prisma, now?)` builds the 4 dep bundles once.
- Create: `src/mcp/deps.test.ts` — wiring/shape guard.
- Create: `src/mcp/db.ts` — dedicated `PrismaClient`, logs forwarded to stderr (not the shared singleton).
- Create: `src/mcp/server.ts` — bootstrap: fail-fast DB connect, McpServer, stdio transport, register 4 tools.
- Create: `src/mcp/mcp-tools.integration.test.ts` — ingestion + recheck flows end-to-end.

**Tooling / config:**
- Create: `vitest.config.ts` — default unit run, excludes `*.integration.test.ts`.
- Create: `vitest.integration.config.ts` — runs only `*.integration.test.ts`, serial.
- Modify: `package.json` — add `@modelcontextprotocol/sdk` + `test:integration` script.
- Create: `.mcp.json` — register the server for Claude Code.
- Modify: `.dependency-cruiser.cjs` — exempt `src/mcp/server.ts` from `no-orphans`.
- Modify: `tbd.md` — record the deferrals (§8 of the spec).

**Ordering invariant:** after every task's commit the repo must be green: `pnpm type-check`, `pnpm lint`, `pnpm dep:check`, and `pnpm test` (unit) all pass without a database. Integration tests run only under `pnpm test:integration` and require `DATABASE_URL`.

---

## Task 1: Tooling — install MCP SDK, split unit vs integration test runs

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.integration.config.ts`

- [ ] **Step 1: Install the MCP SDK**

Run: `pnpm add @modelcontextprotocol/sdk`
Expected: `package.json` `dependencies` gains `"@modelcontextprotocol/sdk": "^1.x"`, lockfile updates.

- [ ] **Step 2: Create the default (unit) Vitest config that excludes integration tests**

Create `vitest.config.ts`:

```ts
import { configDefaults, defineConfig } from 'vitest/config';

// Default run = unit tests only. Integration tests hit a real Postgres and are
// opt-in via `pnpm test:integration` (vitest.integration.config.ts).
export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
});
```

- [ ] **Step 3: Create the integration Vitest config**

Create `vitest.integration.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

// Integration tests talk to the Postgres pointed at by DATABASE_URL. They are
// serial (shared rows, deterministic ordering) and given a generous timeout.
export default defineConfig({
  test: {
    include: ['**/*.integration.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
```

- [ ] **Step 4: Add the `test:integration` script**

In `package.json` `scripts`, add after the `"test"` line:

```json
    "test:integration": "vitest run --config vitest.integration.config.ts",
```

- [ ] **Step 5: Verify the unit run is unaffected and finds no integration tests yet**

Run: `pnpm test`
Expected: PASS — all existing foundation tests run and pass (no integration files exist yet, so nothing is excluded that matters).

Run: `pnpm test:integration`
Expected: exits 0 with "No test files found, exiting with code 0" (no `*.integration.test.ts` files yet).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts vitest.integration.config.ts
git commit -m "chore(mcp): add @modelcontextprotocol/sdk and split unit/integration test runs"
```

---

## Task 2: Foundation amendment — `ConfirmActivityUseCase` returns `{ recheckAfter }`

**Files:**
- Modify: `src/modules/activities/application/ConfirmActivityUseCase.ts`
- Modify: `src/modules/activities/application/ConfirmActivityUseCase.test.ts`

- [ ] **Step 1: Update the test to assert the returned value (failing)**

In `src/modules/activities/application/ConfirmActivityUseCase.test.ts`, replace the first two `it` blocks (the PLACE and EVENT cases) with versions that capture and assert the return value. The not-found case is unchanged.

```ts
  it('refreshes freshness, recomputes recheckAfter (+90d), and returns it for a PLACE', async () => {
    const { useCase, ingestion } = build(new Map([['a', activity('a', 'PLACE')]]));

    const result = await useCase.execute({ activityId: 'a', now: NOW });

    expect(result).toEqual({ recheckAfter: new Date('2026-08-21T12:00:00.000Z') });
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

  it('returns recheckAfter null for an EVENT', async () => {
    const { useCase, ingestion } = build(new Map([['e', activity('e', 'EVENT')]]));

    const result = await useCase.execute({ activityId: 'e', now: NOW });

    expect(result).toEqual({ recheckAfter: null });
    expect(ingestion.refreshed[0].update.recheckAfter).toBeNull();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/modules/activities/application/ConfirmActivityUseCase.test.ts`
Expected: FAIL — `result` is `undefined`, so `expect(result).toEqual({ recheckAfter: ... })` fails.

- [ ] **Step 3: Capture and return `recheckAfter` in the use case**

In `src/modules/activities/application/ConfirmActivityUseCase.ts`, change the `execute` signature and body:

```ts
  async execute(input: ConfirmActivityInput): Promise<{ recheckAfter: Date | null }> {
    const activity = await this.activities.findById(input.activityId);
    if (!activity) {
      throw new Error(`Activity ${input.activityId} not found.`);
    }

    const recheckAfter = computeRecheckAfter({ kind: activity.kind, lastSeenAt: input.now });

    await this.ingestion.refreshFreshness(activity.id, {
      lastSeenAt: input.now,
      lastVerifiedAt: input.now,
      recheckAfter,
    });

    return { recheckAfter };
  }
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/modules/activities/application/ConfirmActivityUseCase.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/activities/application/ConfirmActivityUseCase.ts src/modules/activities/application/ConfirmActivityUseCase.test.ts
git commit -m "feat(activities): ConfirmActivityUseCase returns recheckAfter (spec plan-2 §5)"
```

---

## Task 3: Foundation amendment — `findDueForRecheck(cityId, now, limit?)` ordering + bound

**Files:**
- Modify: `src/modules/activities/domain/IActivityIngestionRepository.ts`
- Modify: `src/modules/activities/infra/PrismaActivityRepository.ts:197`
- Create: `src/modules/activities/infra/PrismaActivityRepository.findDueForRecheck.integration.test.ts`

- [ ] **Step 1: Write the failing integration test**

Create `src/modules/activities/infra/PrismaActivityRepository.findDueForRecheck.integration.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prisma } from '../../../shared/db/prisma';
import { PrismaActivityRepository } from './PrismaActivityRepository';

const NOW = new Date('2026-05-23T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const CITY_SLUG = 'mcp-it-recheck';
const SOURCE_NAME = 'mcp-it-recheck-source';

let cityId: string;
let sourceId: string;

async function seedPlace(id: string, recheckAfter: Date | null): Promise<void> {
  await prisma.activity.create({
    data: {
      id,
      slug: id,
      title: id,
      description: 'd',
      imageUrl: 'https://example.com/x.jpg',
      kind: 'PLACE',
      category: 'FOOD',
      address: 'a',
      latitude: 45.5,
      longitude: -73.6,
      priceMinCents: 0,
      sourceId,
      cityId,
      dedupeKey: id,
      recheckAfter,
    },
  });
}

beforeAll(async () => {
  const city = await prisma.city.upsert({
    where: { slug: CITY_SLUG },
    update: {},
    create: {
      slug: CITY_SLUG,
      name: 'MCP IT Recheck City',
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
  cityId = city.id;
  const source = await prisma.source.upsert({
    where: { name: SOURCE_NAME },
    update: {},
    create: { name: SOURCE_NAME },
  });
  sourceId = source.id;

  // Defensive: a previous crashed run may have left rows; explicit ids would then
  // collide on create. Start from a clean slate for this isolated city.
  await prisma.activity.deleteMany({ where: { cityId } });

  // Two of the three due rows share recheckAfter so the `id asc` tiebreaker is
  // what orders act_b before act_c (stable pagination, design §3.6).
  await seedPlace('act_a', new Date(NOW.getTime() - 3 * DAY));
  await seedPlace('act_b', new Date(NOW.getTime() - 2 * DAY));
  await seedPlace('act_c', new Date(NOW.getTime() - 2 * DAY));
  await seedPlace('act_future', new Date(NOW.getTime() + 10 * DAY)); // not yet due
  await seedPlace('act_null', null); // PLACEs with no deadline are never due
});

afterAll(async () => {
  await prisma.activity.deleteMany({ where: { cityId } });
  await prisma.source.deleteMany({ where: { id: sourceId } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  await prisma.$disconnect();
});

describe('PrismaActivityRepository.findDueForRecheck (integration)', () => {
  it('returns due rows ordered by recheckAfter asc then id asc, excluding null/future', async () => {
    const repo = new PrismaActivityRepository(prisma);

    const due = await repo.findDueForRecheck(cityId, NOW);

    expect(due.map((a) => a.id)).toEqual(['act_a', 'act_b', 'act_c']);
  });

  it('bounds the result set with limit', async () => {
    const repo = new PrismaActivityRepository(prisma);

    const due = await repo.findDueForRecheck(cityId, NOW, 2);

    expect(due.map((a) => a.id)).toEqual(['act_a', 'act_b']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test:integration`
Expected: FAIL — TypeScript rejects `repo.findDueForRecheck(cityId, NOW, 2)` (current signature takes 2 args), so the file does not compile.

- [ ] **Step 3: Add `limit?` to the port with an ordering note**

In `src/modules/activities/domain/IActivityIngestionRepository.ts`, replace the `findDueForRecheck` line:

```ts
  /**
   * Due = PUBLISHED in `cityId` with `recheckAfter <= now`. Ordered
   * `recheckAfter asc, id asc` (the id tiebreaker keeps pagination stable when
   * deadlines tie). `recheckAfter <= now` already excludes `null` deadlines.
   * `limit` (when given) bounds the result to the N oldest-due rows.
   */
  findDueForRecheck(cityId: string, now: Date, limit?: number): Promise<Activity[]>;
```

- [ ] **Step 4: Add `orderBy` + `take` in the adapter**

In `src/modules/activities/infra/PrismaActivityRepository.ts`, replace the `findDueForRecheck` method (currently at line 197):

```ts
  async findDueForRecheck(cityId: string, now: Date, limit?: number): Promise<Activity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { cityId, status: 'PUBLISHED', recheckAfter: { lte: now } },
      orderBy: [{ recheckAfter: 'asc' }, { id: 'asc' }],
      take: limit,
    });
    return activities.map(toActivity);
  }
```

- [ ] **Step 5: Run the integration test to verify it passes**

Run: `pnpm test:integration`
Expected: PASS (2 tests).

- [ ] **Step 6: Confirm unit tests and type-check still pass**

Run: `pnpm test`
Expected: PASS (existing fakes implement `findDueForRecheck()` with no `limit`, which still satisfies the optional parameter).

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/modules/activities/domain/IActivityIngestionRepository.ts src/modules/activities/infra/PrismaActivityRepository.ts src/modules/activities/infra/PrismaActivityRepository.findDueForRecheck.integration.test.ts
git commit -m "feat(activities): findDueForRecheck supports limit + stable ordering (spec plan-2 §5)"
```

---

## Task 4: `src/mcp/logger.ts` — pino to stderr

**Files:**
- Create: `src/mcp/logger.ts`

- [ ] **Step 1: Create the stderr logger**

Create `src/mcp/logger.ts`:

```ts
import pino from 'pino';

// stdio transport: stdout carries JSON-RPC ONLY. Every log line must go to
// stderr (fd 2), so we do NOT reuse src/shared/obs/logger.ts (which writes to
// stdout and would corrupt the protocol stream). spec plan-2 §6 / Q9.
export const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' }, pino.destination(2));
```

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/mcp/logger.ts
git commit -m "feat(mcp): stderr pino logger for the ingestion MCP server"
```

---

## Task 5: `src/mcp/runTool.ts` — error contract backbone (§4.1)

**Files:**
- Create: `src/mcp/runTool.ts`
- Create: `src/mcp/runTool.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/mcp/runTool.test.ts`:

```ts
import type { Logger } from 'pino';
import { describe, expect, it, vi } from 'vitest';

import { runTool } from './runTool';

function fakeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger;
}

describe('runTool', () => {
  it('serializes the result to JSON text content on success', async () => {
    const logger = fakeLogger();

    const res = await runTool(logger, 'demo', async () => ({ ok: true }), () => ({
      level: 'info',
      fields: {},
    }));

    expect(res.isError).toBeUndefined();
    expect(res.content).toEqual([{ type: 'text', text: '{"ok":true}' }]);
    expect(logger.info).toHaveBeenCalledWith({ tool: 'demo' });
  });

  it('logs at warn level and merges fields when logLine says so', async () => {
    const logger = fakeLogger();

    await runTool(logger, 'demo', async () => 1, () => ({
      level: 'warn',
      fields: { outcome: 'REJECTED' },
    }));

    expect(logger.warn).toHaveBeenCalledWith({ tool: 'demo', outcome: 'REJECTED' });
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('maps a thrown error to an isError tool result carrying the message', async () => {
    const logger = fakeLogger();

    const res = await runTool(
      logger,
      'demo',
      async () => {
        throw new Error('boom');
      },
      () => ({ level: 'info', fields: {} }),
    );

    expect(res.isError).toBe(true);
    expect(res.content).toEqual([{ type: 'text', text: 'boom' }]);
    expect(logger.error).toHaveBeenCalledWith({ tool: 'demo', error: 'boom' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/mcp/runTool.test.ts`
Expected: FAIL — cannot find module `./runTool`.

- [ ] **Step 3: Implement `runTool`**

Create `src/mcp/runTool.ts`:

```ts
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Logger } from 'pino';

export type ToolLogLine = {
  level: 'info' | 'warn';
  fields: Record<string, unknown>;
};

/**
 * Shared tool body (spec plan-2 §4.1). Runs the handler, then:
 *  - success → one structured log line on stderr + JSON-serialized result;
 *  - throw   → `isError` tool result carrying the message (the agent learns its
 *              CALL was wrong). Handlers that need "bad data" semantics return a
 *              REJECTED result instead of throwing.
 */
export async function runTool<R>(
  logger: Logger,
  toolName: string,
  handle: () => Promise<R>,
  logLine: (result: R) => ToolLogLine,
): Promise<CallToolResult> {
  try {
    const result = await handle();
    const { level, fields } = logLine(result);
    const payload = { tool: toolName, ...fields };
    if (level === 'warn') {
      logger.warn(payload);
    } else {
      logger.info(payload);
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ tool: toolName, error: message });
    return { content: [{ type: 'text' as const, text: message }], isError: true };
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/mcp/runTool.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mcp/runTool.ts src/mcp/runTool.test.ts
git commit -m "feat(mcp): runTool helper mapping results/throws to MCP tool results"
```

---

## Task 6: `ingestActivity` tool

**Files:**
- Create: `src/mcp/tools/ingestActivity.ts`
- Create: `src/mcp/tools/ingestActivity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/mcp/tools/ingestActivity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { PromoteCandidateUseCase } from '../../modules/activities/application/PromoteCandidateUseCase';
import type { Activity, ActivityCreateInput } from '../../modules/activities/domain/Activity';
import type { City } from '../../modules/activities/domain/City';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import type { ICandidateRepository } from '../../modules/activities/domain/ICandidateRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import type {
  ExtractedActivityPayload,
  RawActivityCandidate,
  RawActivityCandidateCreateInput,
} from '../../modules/activities/domain/RawActivityCandidate';
import { ingestActivity, ingestActivityInputSchema } from './ingestActivity';

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
    imageUrl: 'https://images.example.com/bagel.jpg',
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

function meta(overrides: Record<string, unknown> = {}) {
  return {
    agentName: 'food-agent',
    searchQuery: 'best bagels montreal',
    sourceUrl: 'https://example.com/article',
    rawExcerpt: 'St-Viateur Bagel is a Montreal institution...',
    category: 'FOOD' as const,
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
  readonly created: RawActivityCandidateCreateInput[] = [];
  readonly marks: Array<{ id: string; status: string; ref: string | null }> = [];
  private readonly store = new Map<string, RawActivityCandidate>();
  private n = 1;
  async create(input: RawActivityCandidateCreateInput): Promise<RawActivityCandidate> {
    this.created.push(input);
    const candidate: RawActivityCandidate = {
      ...input,
      id: `cand_${this.n++}`,
      status: 'PENDING',
      promotedActivityId: null,
      rejectionReason: null,
      createdAt: NOW,
    };
    this.store.set(candidate.id, candidate);
    return candidate;
  }
  async findById(id: string): Promise<RawActivityCandidate | null> {
    return this.store.get(id) ?? null;
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
    Pick<IActivityRepository, 'create' | 'getOrCreateSourceIdByName' | 'slugExists' | 'findById'>,
    IActivityIngestionRepository
{
  readonly created: ActivityCreateInput[] = [];
  readonly refreshed: Array<{ id: string; update: FreshnessUpdate }> = [];
  private n = 1;
  constructor(private readonly existing: Activity | null = null) {}
  async create(input: ActivityCreateInput): Promise<Activity> {
    this.created.push(input);
    return { ...input, id: `activity_${this.n++}`, createdAt: NOW, updatedAt: NOW };
  }
  async getOrCreateSourceIdByName(): Promise<string> {
    return 'source_agent';
  }
  async slugExists(slug: string): Promise<boolean> {
    return this.existing?.slug === slug;
  }
  async findById(id: string): Promise<Activity | null> {
    return this.existing?.id === id ? this.existing : null;
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

function build(opts: { cities?: City[]; existing?: Activity | null } = {}) {
  const cities = new FakeCityRepository(opts.cities ?? [MONTREAL]);
  const candidates = new FakeCandidateRepository();
  const writer = new FakeActivityWriter(opts.existing ?? null);
  const promote = new PromoteCandidateUseCase(
    writer as unknown as IActivityRepository,
    writer,
    candidates,
    cities,
  );
  const deps = { cities, candidates, promote, now: () => NOW };
  return { deps, cities, candidates, writer };
}

describe('ingestActivity handler', () => {
  it('PROMOTED: stages the candidate (meta.category + placeholder key) and creates the activity', async () => {
    const { deps, candidates, writer } = build();

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload(),
      meta: meta(),
    });

    expect(result).toEqual({ outcome: 'PROMOTED', activityId: 'activity_1', reason: null });
    expect(candidates.created).toHaveLength(1);
    expect(candidates.created[0].category).toBe('FOOD');
    expect(candidates.created[0].dedupeKey).toBe('pending-promotion');
    expect(candidates.created[0].cityId).toBe('city_mtl');
    expect(writer.created).toHaveLength(1);
    expect(writer.created[0].category).toBe('FOOD');
  });

  it('DUPLICATE: refreshes the existing activity instead of creating one', async () => {
    const existing: Activity = {
      ...({} as Activity),
      id: 'activity_existing',
      slug: 'st-viateur-bagel',
      kind: 'PLACE',
      cityId: 'city_mtl',
      dedupeKey: 'st-viateur-bagel|45.523,-73.602',
    } as Activity;
    const { deps, writer } = build({ existing });

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload(),
      meta: meta(),
    });

    expect(result).toEqual({ outcome: 'DUPLICATE', activityId: 'activity_existing', reason: null });
    expect(writer.created).toHaveLength(0);
    expect(writer.refreshed).toHaveLength(1);
  });

  it('REJECTED: a well-typed payload outside the city bbox returns a reason, not a tool error', async () => {
    const { deps, writer } = build();

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload({ latitude: 48.0, longitude: -71.0 }),
      meta: meta(),
    });

    expect(result.outcome).toBe('REJECTED');
    expect(result.activityId).toBeNull();
    expect(result.reason).toMatch(/bbox/i);
    expect(writer.created).toHaveLength(0);
  });

  it('Unknown city: REJECTED with reason and NO candidate created', async () => {
    const { deps, candidates } = build({ cities: [] });

    const result = await ingestActivity(deps, {
      citySlug: 'montreal',
      payload: payload(),
      meta: meta(),
    });

    expect(result).toEqual({
      outcome: 'REJECTED',
      activityId: null,
      reason: 'Unknown city: montreal',
    });
    expect(candidates.created).toHaveLength(0);
  });

  it('Layer A: a structurally invalid payload (latitude as string) fails Zod parsing', () => {
    const parsed = ingestActivityInputSchema.safeParse({
      citySlug: 'montreal',
      payload: { ...payload(), latitude: '45.5' },
      meta: meta(),
    });

    expect(parsed.success).toBe(false);
  });

  it('Layer A: optional payload fields may be omitted and default to null', () => {
    const parsed = ingestActivityInputSchema.safeParse({
      citySlug: 'montreal',
      payload: {
        title: 'St-Viateur Bagel',
        description: 'Warm bagels.',
        imageUrl: 'https://images.example.com/bagel.jpg',
        kind: 'PLACE',
        category: 'FOOD',
        address: '263 Rue Saint-Viateur O',
        latitude: 45.5227,
        longitude: -73.6016,
        priceMinCents: 200,
        indoor: true,
        outdoor: false,
        tags: ['FOOD'],
      },
      meta: meta(),
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload.dateStart).toBeNull();
      expect(parsed.data.payload.imageCredit).toBeNull();
      expect(parsed.data.payload.priceMaxCents).toBeNull();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/mcp/tools/ingestActivity.test.ts`
Expected: FAIL — cannot find module `./ingestActivity`.

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/ingestActivity.ts`:

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type {
  PromoteCandidateUseCase,
  PromotionResult,
} from '../../modules/activities/application/PromoteCandidateUseCase';
import { ActivityCategories, ActivityKinds } from '../../modules/activities/domain/Activity';
import type { ICandidateRepository } from '../../modules/activities/domain/ICandidateRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import type { ExtractedActivityPayload } from '../../modules/activities/domain/RawActivityCandidate';
import { runTool } from '../runTool';

// Layer A (spec §4.1): structural validation only. Required fields carry meaning
// for every activity; the rest are often absent and default to null when omitted.
// `.default(null)` keeps the OUTPUT type `T | null`, so `z.infer` stays IDENTICAL
// to ExtractedActivityPayload — drift becomes a compile error in the handler, and
// there is no transform/cast to maintain. Business rules (e.g. EVENT ⇒ dateStart)
// are NOT encoded here — they live in the domain (Layer B → REJECTED + reason).
const payloadSchema = z.object({
  // Required
  title: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().url(),
  kind: z.enum(ActivityKinds),
  category: z.enum(ActivityCategories),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  priceMinCents: z.number().int().nonnegative(),
  indoor: z.boolean(),
  outdoor: z.boolean(),
  tags: z.array(z.string()),
  // Optional — omitted ⇒ null
  imageCredit: z.string().nullable().default(null),
  neighborhood: z.string().nullable().default(null),
  dateStart: z.string().datetime().nullable().default(null),
  dateEnd: z.string().datetime().nullable().default(null),
  priceMaxCents: z.number().int().nonnegative().nullable().default(null),
  externalUrl: z.string().url().nullable().default(null),
});

const metaSchema = z.object({
  agentName: z.string().min(1),
  searchQuery: z.string().min(1),
  sourceUrl: z.string().url(),
  rawExcerpt: z.string().min(1),
  category: z.enum(ActivityCategories),
});

export const ingestActivityInputSchema = z.object({
  citySlug: z.string().min(1),
  payload: payloadSchema,
  meta: metaSchema,
});

export type IngestActivityInput = z.infer<typeof ingestActivityInputSchema>;

export type IngestActivityDeps = {
  cities: ICityRepository;
  candidates: ICandidateRepository;
  promote: PromoteCandidateUseCase;
  now: () => Date;
};

// Staging sentinel: the authoritative dedupeKey is (re)computed from the payload
// inside PromoteCandidateUseCase. We can't compute it here because computeDedupeKey
// throws for an EVENT without dateStart, and we must stage EVERY candidate (even
// future rejects) for the audit trail before judging it.
const STAGED_DEDUPE_KEY = 'pending-promotion';

export async function ingestActivity(
  deps: IngestActivityDeps,
  input: IngestActivityInput,
): Promise<PromotionResult> {
  const city = await deps.cities.findBySlug(input.citySlug);
  if (!city) {
    // Unknown city is bad DATA, not a bad call → REJECTED, and we stage nothing.
    return { outcome: 'REJECTED', activityId: null, reason: `Unknown city: ${input.citySlug}` };
  }

  const payload: ExtractedActivityPayload = input.payload;
  const candidate = await deps.candidates.create({
    cityId: city.id,
    category: input.meta.category, // agent's search theme, for traceability
    agentName: input.meta.agentName,
    searchQuery: input.meta.searchQuery,
    sourceUrl: input.meta.sourceUrl,
    rawExcerpt: input.meta.rawExcerpt,
    extractedPayload: payload, // payload.category is the activity's real category
    dedupeKey: STAGED_DEDUPE_KEY,
  });

  return deps.promote.execute({ candidateId: candidate.id, now: deps.now() });
}

export const ingestActivityDescription = [
  'Enregistre UNE activité que tu as extraite du web pour une ville, puis la fait passer par validation + déduplication + création/rafraîchissement. Appelle-le une fois par activité plausible trouvée — ne pré-filtre pas les doublons toi-même, l’outil déduplique. Lis l’outcome pour savoir quoi rapporter.',
  '- citySlug — slug de la ville (ex. "montreal"). Ville inconnue → REJECTED.',
  "- payload — la donnée façon Activity que tu as extraite. latitude/longitude doivent tomber dans la ville ; un kind 'EVENT' doit avoir dateStart (ISO 8601) ; prix en cents entiers ; payload.category = la catégorie réelle de l’activité. Champs optionnels (omis ⇒ null) : imageCredit, neighborhood, dateStart, dateEnd, priceMaxCents, externalUrl.",
  '- meta — provenance : agentName (ton nom), searchQuery (la requête qui l’a trouvée), sourceUrl, rawExcerpt (le texte d’où tu as extrait), category (ton thème de recherche, peut différer de payload.category).',
  '- Outcomes : PROMOTED = nouvelle activité créée ; DUPLICATE = a matché une existante (fraîcheur rafraîchie) ; REJECTED = la donnée a échoué une règle métier — lis reason et corrige la donnée (pas la forme de l’appel).',
].join('\n');

export function registerIngestActivity(
  server: McpServer,
  deps: IngestActivityDeps,
  logger: Logger,
): void {
  server.registerTool(
    'ingestActivity',
    { description: ingestActivityDescription, inputSchema: ingestActivityInputSchema.shape },
    (args) => {
      const input = args as IngestActivityInput;
      return runTool(
        logger,
        'ingestActivity',
        () => ingestActivity(deps, input),
        (result) => ({
          level: result.outcome === 'REJECTED' ? 'warn' : 'info',
          fields: {
            agentName: input.meta.agentName,
            searchQuery: input.meta.searchQuery,
            sourceUrl: input.meta.sourceUrl,
            outcome: result.outcome,
            ...(result.outcome === 'REJECTED'
              ? { reason: result.reason }
              : { activityId: result.activityId }),
          },
        }),
      );
    },
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/mcp/tools/ingestActivity.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mcp/tools/ingestActivity.ts src/mcp/tools/ingestActivity.test.ts
git commit -m "feat(mcp): ingestActivity tool (stage + promote with two-layer validation)"
```

---

## Task 7: `listActivitiesDueForRecheck` tool

**Files:**
- Create: `src/mcp/tools/listActivitiesDueForRecheck.ts`
- Create: `src/mcp/tools/listActivitiesDueForRecheck.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/mcp/tools/listActivitiesDueForRecheck.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { Activity } from '../../modules/activities/domain/Activity';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../../modules/activities/domain/IActivityIngestionRepository';
import type { City } from '../../modules/activities/domain/City';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import {
  listActivitiesDueForRecheck,
  listActivitiesDueForRecheckInputSchema,
} from './listActivitiesDueForRecheck';

const NOW = new Date('2026-05-23T12:00:00.000Z');
const VERIFIED = new Date('2026-02-22T12:00:00.000Z');

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

function dueActivity(): Activity {
  return {
    ...({} as Activity),
    id: 'activity_1',
    title: 'St-Viateur Bagel',
    kind: 'PLACE',
    address: '263 Rue Saint-Viateur O',
    latitude: 45.5227,
    longitude: -73.6016,
    externalUrl: 'https://www.stviateurbagel.com/',
    lastVerifiedAt: VERIFIED,
  } as Activity;
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

class FakeIngestion implements IActivityIngestionRepository {
  readonly calls: Array<{ cityId: string; now: Date; limit?: number }> = [];
  constructor(private readonly due: Activity[]) {}
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return null;
  }
  async refreshFreshness(_id: string, _update: FreshnessUpdate): Promise<void> {}
  async findDueForRecheck(cityId: string, now: Date, limit?: number): Promise<Activity[]> {
    this.calls.push({ cityId, now, limit });
    return this.due;
  }
  async archive(): Promise<void> {}
}

describe('listActivitiesDueForRecheck handler', () => {
  it('resolves the city, forwards now + limit, and maps rows to the recheck shape (ISO dates)', async () => {
    const ingestion = new FakeIngestion([dueActivity()]);
    const deps = { cities: new FakeCityRepository([MONTREAL]), ingestion, now: () => NOW };

    const result = await listActivitiesDueForRecheck(deps, { citySlug: 'montreal', limit: 5 });

    expect(ingestion.calls).toEqual([{ cityId: 'city_mtl', now: NOW, limit: 5 }]);
    expect(result).toEqual([
      {
        id: 'activity_1',
        title: 'St-Viateur Bagel',
        kind: 'PLACE',
        address: '263 Rue Saint-Viateur O',
        latitude: 45.5227,
        longitude: -73.6016,
        externalUrl: 'https://www.stviateurbagel.com/',
        lastVerifiedAt: '2026-02-22T12:00:00.000Z',
      },
    ]);
  });

  it('passes limit undefined when omitted', async () => {
    const ingestion = new FakeIngestion([]);
    const deps = { cities: new FakeCityRepository([MONTREAL]), ingestion, now: () => NOW };

    await listActivitiesDueForRecheck(deps, { citySlug: 'montreal' });

    expect(ingestion.calls[0].limit).toBeUndefined();
  });

  it('throws a tool error for an unknown city', async () => {
    const ingestion = new FakeIngestion([]);
    const deps = { cities: new FakeCityRepository([]), ingestion, now: () => NOW };

    await expect(
      listActivitiesDueForRecheck(deps, { citySlug: 'atlantis' }),
    ).rejects.toThrow('Unknown city: atlantis');
  });

  it('Layer A: rejects a non-positive / non-integer limit', () => {
    expect(
      listActivitiesDueForRecheckInputSchema.safeParse({ citySlug: 'montreal', limit: 0 }).success,
    ).toBe(false);
    expect(
      listActivitiesDueForRecheckInputSchema.safeParse({ citySlug: 'montreal', limit: 2.5 }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/mcp/tools/listActivitiesDueForRecheck.test.ts`
Expected: FAIL — cannot find module `./listActivitiesDueForRecheck`.

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/listActivitiesDueForRecheck.ts`:

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { ActivityKind } from '../../modules/activities/domain/Activity';
import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import type { ICityRepository } from '../../modules/activities/domain/ICityRepository';
import { runTool } from '../runTool';

export const listActivitiesDueForRecheckInputSchema = z.object({
  citySlug: z.string().min(1),
  limit: z.number().int().positive().optional(),
});

export type ListActivitiesDueForRecheckInput = z.infer<
  typeof listActivitiesDueForRecheckInputSchema
>;

// lastVerifiedAt is Date | null on the domain entity; we surface it as a
// nullable ISO string rather than asserting non-null.
export type RecheckListItem = {
  id: string;
  title: string;
  kind: ActivityKind;
  address: string;
  latitude: number;
  longitude: number;
  externalUrl: string | null;
  lastVerifiedAt: string | null;
};

export type ListActivitiesDueForRecheckDeps = {
  cities: ICityRepository;
  ingestion: IActivityIngestionRepository;
  now: () => Date;
};

export async function listActivitiesDueForRecheck(
  deps: ListActivitiesDueForRecheckDeps,
  input: ListActivitiesDueForRecheckInput,
): Promise<RecheckListItem[]> {
  const city = await deps.cities.findBySlug(input.citySlug);
  if (!city) {
    // No `outcome` contract here — an unknown city is a malformed call.
    throw new Error(`Unknown city: ${input.citySlug}`);
  }

  const activities = await deps.ingestion.findDueForRecheck(city.id, deps.now(), input.limit);
  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    kind: a.kind,
    address: a.address,
    latitude: a.latitude,
    longitude: a.longitude,
    externalUrl: a.externalUrl,
    lastVerifiedAt: a.lastVerifiedAt ? a.lastVerifiedAt.toISOString() : null,
  }));
}

export const listActivitiesDueForRecheckDescription = [
  'Renvoie jusqu’à limit activités d’une ville dont l’échéance de re-vérification est passée, échéance la plus ancienne d’abord. Appelle-le une seule fois par run de recheck et fige (snapshot) le résultat ; ne le rappelle pas pendant que des sous-agents décident — confirmer repousse les échéances, donc un nouvel appel chevaucherait ou sauterait des items. Découpe toi-même les IDs renvoyés en lots disjoints.',
  'Ne renvoie que des PLACE : les EVENT expirent via leur date de fin et ne sont jamais re-vérifiés par cet outil.',
  '- citySlug — slug de la ville ; ville inconnue → erreur.',
  '- limit (optionnel) — nombre max d’items (entier > 0) ; omis = toutes les activités dues.',
  '- Retour : id, title, kind, address, latitude, longitude, externalUrl, lastVerifiedAt — de quoi re-trouver chaque activité sur le web.',
].join('\n');

export function registerListActivitiesDueForRecheck(
  server: McpServer,
  deps: ListActivitiesDueForRecheckDeps,
  logger: Logger,
): void {
  server.registerTool(
    'listActivitiesDueForRecheck',
    {
      description: listActivitiesDueForRecheckDescription,
      inputSchema: listActivitiesDueForRecheckInputSchema.shape,
    },
    (args) => {
      const input = args as ListActivitiesDueForRecheckInput;
      return runTool(
        logger,
        'listActivitiesDueForRecheck',
        () => listActivitiesDueForRecheck(deps, input),
        (items) => ({
          level: 'info',
          fields: { citySlug: input.citySlug, count: items.length, limit: input.limit ?? null },
        }),
      );
    },
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/mcp/tools/listActivitiesDueForRecheck.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mcp/tools/listActivitiesDueForRecheck.ts src/mcp/tools/listActivitiesDueForRecheck.test.ts
git commit -m "feat(mcp): listActivitiesDueForRecheck tool (snapshot list, ISO mapping)"
```

---

## Task 8: `confirmActivity` tool

**Files:**
- Create: `src/mcp/tools/confirmActivity.ts`
- Create: `src/mcp/tools/confirmActivity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/mcp/tools/confirmActivity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { ConfirmActivityUseCase } from '../../modules/activities/application/ConfirmActivityUseCase';
import type { Activity } from '../../modules/activities/domain/Activity';
import type {
  FreshnessUpdate,
  IActivityIngestionRepository,
} from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import { confirmActivity } from './confirmActivity';

const NOW = new Date('2026-05-23T12:00:00.000Z');

function activity(id: string, kind: Activity['kind']): Activity {
  return { ...({} as Activity), id, kind } as Activity;
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
  const confirm = new ConfirmActivityUseCase(
    new FakeActivities(map) as unknown as IActivityRepository,
    ingestion,
  );
  return { deps: { confirm, now: () => NOW }, ingestion };
}

describe('confirmActivity handler', () => {
  it('returns the id and the next recheckAfter as ISO for a PLACE', async () => {
    const { deps } = build(new Map([['a', activity('a', 'PLACE')]]));

    const result = await confirmActivity(deps, { activityId: 'a' });

    expect(result).toEqual({ id: 'a', recheckAfter: '2026-08-21T12:00:00.000Z' });
  });

  it('returns recheckAfter null for an EVENT', async () => {
    const { deps } = build(new Map([['e', activity('e', 'EVENT')]]));

    const result = await confirmActivity(deps, { activityId: 'e' });

    expect(result).toEqual({ id: 'e', recheckAfter: null });
  });

  it('throws a tool error when the activity does not exist', async () => {
    const { deps } = build(new Map());

    await expect(confirmActivity(deps, { activityId: 'missing' })).rejects.toThrow(/not found/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/mcp/tools/confirmActivity.test.ts`
Expected: FAIL — cannot find module `./confirmActivity`.

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/confirmActivity.ts`:

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { ConfirmActivityUseCase } from '../../modules/activities/application/ConfirmActivityUseCase';
import { runTool } from '../runTool';

export const confirmActivityInputSchema = z.object({
  activityId: z.string().min(1),
});

export type ConfirmActivityInput = z.infer<typeof confirmActivityInputSchema>;

export type ConfirmActivityResult = { id: string; recheckAfter: string | null };

export type ConfirmActivityDeps = {
  confirm: ConfirmActivityUseCase;
  now: () => Date;
};

export async function confirmActivity(
  deps: ConfirmActivityDeps,
  input: ConfirmActivityInput,
): Promise<ConfirmActivityResult> {
  // Throws "Activity <id> not found." when missing → mapped to a tool error.
  const { recheckAfter } = await deps.confirm.execute({
    activityId: input.activityId,
    now: deps.now(),
  });
  return {
    id: input.activityId,
    recheckAfter: recheckAfter ? recheckAfter.toISOString() : null,
  };
}

export const confirmActivityDescription = [
  'Enregistre qu’une activité existe encore / est toujours pertinente (tu l’as vérifié via le web). Rafraîchit ses timestamps de fraîcheur et repousse la prochaine échéance de recheck. Exactement une décision confirmActivity/archiveActivity par activité et par run.',
  '- activityId — un id issu de listActivitiesDueForRecheck.',
  '- Retour : id, recheckAfter (prochaine échéance ; null pour les EVENT).',
].join('\n');

export function registerConfirmActivity(
  server: McpServer,
  deps: ConfirmActivityDeps,
  logger: Logger,
): void {
  server.registerTool(
    'confirmActivity',
    { description: confirmActivityDescription, inputSchema: confirmActivityInputSchema.shape },
    (args) => {
      const input = args as ConfirmActivityInput;
      return runTool(
        logger,
        'confirmActivity',
        () => confirmActivity(deps, input),
        (result) => ({ level: 'info', fields: { activityId: input.activityId, result } }),
      );
    },
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/mcp/tools/confirmActivity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mcp/tools/confirmActivity.ts src/mcp/tools/confirmActivity.test.ts
git commit -m "feat(mcp): confirmActivity tool (refresh freshness, return next recheckAfter)"
```

---

## Task 9: `archiveActivity` tool

**Files:**
- Create: `src/mcp/tools/archiveActivity.ts`
- Create: `src/mcp/tools/archiveActivity.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/mcp/tools/archiveActivity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { Activity } from '../../modules/activities/domain/Activity';
import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import { archiveActivity } from './archiveActivity';

class FakeActivities {
  constructor(private readonly known: Set<string>) {}
  async findById(id: string): Promise<Activity | null> {
    return this.known.has(id) ? ({ ...({} as Activity), id } as Activity) : null;
  }
}

class FakeIngestion implements IActivityIngestionRepository {
  readonly archived: string[] = [];
  async findByCityAndDedupeKey(): Promise<Activity | null> {
    return null;
  }
  async refreshFreshness(): Promise<void> {}
  async findDueForRecheck(): Promise<Activity[]> {
    return [];
  }
  async archive(id: string): Promise<void> {
    this.archived.push(id);
  }
}

describe('archiveActivity handler', () => {
  it('archives an existing activity and returns { id, status: ARCHIVED }', async () => {
    const ingestion = new FakeIngestion();
    const deps = { activities: new FakeActivities(new Set(['a'])), ingestion };

    const result = await archiveActivity(deps, { activityId: 'a' });

    expect(result).toEqual({ id: 'a', status: 'ARCHIVED' });
    expect(ingestion.archived).toEqual(['a']);
  });

  it('throws a tool error and never archives when the activity does not exist', async () => {
    const ingestion = new FakeIngestion();
    const deps = { activities: new FakeActivities(new Set()), ingestion };

    await expect(archiveActivity(deps, { activityId: 'missing' })).rejects.toThrow(/not found/);
    expect(ingestion.archived).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/mcp/tools/archiveActivity.test.ts`
Expected: FAIL — cannot find module `./archiveActivity`.

- [ ] **Step 3: Implement the tool**

Create `src/mcp/tools/archiveActivity.ts`:

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from 'pino';
import { z } from 'zod';

import type { IActivityIngestionRepository } from '../../modules/activities/domain/IActivityIngestionRepository';
import type { IActivityRepository } from '../../modules/activities/domain/IActivityRepository';
import { runTool } from '../runTool';

export const archiveActivityInputSchema = z.object({
  activityId: z.string().min(1),
});

export type ArchiveActivityInput = z.infer<typeof archiveActivityInputSchema>;

export type ArchiveActivityResult = { id: string; status: 'ARCHIVED' };

export type ArchiveActivityDeps = {
  activities: Pick<IActivityRepository, 'findById'>;
  ingestion: IActivityIngestionRepository;
};

export async function archiveActivity(
  deps: ArchiveActivityDeps,
  input: ArchiveActivityInput,
): Promise<ArchiveActivityResult> {
  // Pre-check for a clear, agent-actionable error (consistent with confirmActivity)
  // rather than leaking Prisma's generic P2025 message. No status guard: any
  // existing activity goes PUBLISHED → ARCHIVED.
  const activity = await deps.activities.findById(input.activityId);
  if (!activity) {
    throw new Error(`Activity ${input.activityId} not found.`);
  }
  await deps.ingestion.archive(input.activityId);
  return { id: input.activityId, status: 'ARCHIVED' };
}

export const archiveActivityDescription = [
  'Enregistre qu’une activité a fermé / disparu / n’est plus pertinente. Passe son statut PUBLISHED → ARCHIVED pour la sortir du feed. Exactement une décision confirmActivity/archiveActivity par activité et par run. N’archive que sur preuve web claire.',
  '- activityId — un id issu de listActivitiesDueForRecheck.',
  "- Retour : id, status ('ARCHIVED').",
].join('\n');

export function registerArchiveActivity(
  server: McpServer,
  deps: ArchiveActivityDeps,
  logger: Logger,
): void {
  server.registerTool(
    'archiveActivity',
    { description: archiveActivityDescription, inputSchema: archiveActivityInputSchema.shape },
    (args) => {
      const input = args as ArchiveActivityInput;
      return runTool(
        logger,
        'archiveActivity',
        () => archiveActivity(deps, input),
        (result) => ({ level: 'info', fields: { activityId: input.activityId, result } }),
      );
    },
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/mcp/tools/archiveActivity.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mcp/tools/archiveActivity.ts src/mcp/tools/archiveActivity.test.ts
git commit -m "feat(mcp): archiveActivity tool (PUBLISHED -> ARCHIVED)"
```

---

## Task 10: `src/mcp/deps.ts` — build the dependency bundles once

**Files:**
- Create: `src/mcp/deps.ts`
- Create: `src/mcp/deps.test.ts`

- [ ] **Step 1: Write the failing test**

The constructors only store the `PrismaClient`; they make no calls, so a bare cast object is a safe stand-in. This test guards the wiring (constructor arg order for `PromoteCandidateUseCase`/`ConfirmActivityUseCase`) and the bundle shape — without a database.

Create `src/mcp/deps.test.ts`:

```ts
import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { createDeps } from './deps';

describe('createDeps', () => {
  it('builds the four tool bundles with a defaulted now provider', () => {
    const deps = createDeps({} as PrismaClient);

    expect(Object.keys(deps).sort()).toEqual(['archive', 'confirm', 'ingest', 'list']);
    expect(deps.ingest.now()).toBeInstanceOf(Date);
    expect(deps.list.now()).toBeInstanceOf(Date);
    expect(deps.confirm.now()).toBeInstanceOf(Date);
  });

  it('uses the injected clock so callers can drive time deterministically', () => {
    const fixed = new Date('2026-05-23T12:00:00.000Z');
    const deps = createDeps({} as PrismaClient, () => fixed);

    expect(deps.ingest.now()).toBe(fixed);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/mcp/deps.test.ts`
Expected: FAIL — cannot find module `./deps`.

- [ ] **Step 3: Implement `createDeps`**

`PrismaActivityRepository` implements both `IActivityRepository` and `IActivityIngestionRepository`, so the same instance fills both constructor slots of `PromoteCandidateUseCase` (`activities`, `ingestion`, …) and `ConfirmActivityUseCase`.

Create `src/mcp/deps.ts`:

```ts
import type { PrismaClient } from '@prisma/client';

import { ConfirmActivityUseCase } from '../modules/activities/application/ConfirmActivityUseCase';
import { PromoteCandidateUseCase } from '../modules/activities/application/PromoteCandidateUseCase';
import { PrismaActivityRepository } from '../modules/activities/infra/PrismaActivityRepository';
import { PrismaCandidateRepository } from '../modules/activities/infra/PrismaCandidateRepository';
import { PrismaCityRepository } from '../modules/activities/infra/PrismaCityRepository';
import type { ArchiveActivityDeps } from './tools/archiveActivity';
import type { ConfirmActivityDeps } from './tools/confirmActivity';
import type { IngestActivityDeps } from './tools/ingestActivity';
import type { ListActivitiesDueForRecheckDeps } from './tools/listActivitiesDueForRecheck';

export type ToolDeps = {
  ingest: IngestActivityDeps;
  list: ListActivitiesDueForRecheckDeps;
  confirm: ConfirmActivityDeps;
  archive: ArchiveActivityDeps;
};

/**
 * Composition root for the MCP tools. Instantiates the Prisma repos once and
 * wires the foundation use cases. `now` is server-provided (spec Q10) and not
 * overridable by the agent; tests inject a fixed clock.
 */
export function createDeps(prisma: PrismaClient, now: () => Date = () => new Date()): ToolDeps {
  const activities = new PrismaActivityRepository(prisma);
  const candidates = new PrismaCandidateRepository(prisma);
  const cities = new PrismaCityRepository(prisma);
  const promote = new PromoteCandidateUseCase(activities, activities, candidates, cities);
  const confirm = new ConfirmActivityUseCase(activities, activities);

  return {
    ingest: { cities, candidates, promote, now },
    list: { cities, ingestion: activities, now },
    confirm: { confirm, now },
    archive: { activities, ingestion: activities },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run src/mcp/deps.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/mcp/deps.ts src/mcp/deps.test.ts
git commit -m "feat(mcp): createDeps composition root wiring repos + use cases"
```

---

## Task 11: `src/mcp/server.ts` — stdio bootstrap

**Files:**
- Create: `src/mcp/db.ts`
- Create: `src/mcp/server.ts`

- [ ] **Step 1: Create the dedicated Prisma client (logs → stderr)**

Prisma's string-form `log` (as in the shared `src/shared/db/prisma.ts`) writes `warn`/`error` to **stdout**, which would corrupt the JSON-RPC stream on stdio. So the MCP process uses its **own** client that emits those as events forwarded to the stderr pino logger. It reads `DATABASE_URL` itself (like any `PrismaClient`) and never imports `src/shared/config/env.ts` (that module validates `ADMIN_TOKEN`/`SEED_*` and would throw — the MCP server needs only `DATABASE_URL` + optional `LOG_LEVEL`).

Create `src/mcp/db.ts`:

```ts
import { PrismaClient } from '@prisma/client';

import { logger } from './logger';

// Dedicated client for the MCP process. We do NOT reuse src/shared/db/prisma.ts:
// its string-form log (['warn','error']) writes to stdout, which corrupts the
// stdio JSON-RPC stream. Event-based logging keeps every Prisma line on stderr.
export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('warn', (event) => logger.warn({ prisma: event.message }));
prisma.$on('error', (event) => logger.error({ prisma: event.message }));
```

- [ ] **Step 2: Create the server entrypoint**

Fails fast (Decision: §6) if Postgres is unreachable, so the operator sees a clear stderr message instead of the agent hitting cryptic per-call connection errors mid-run.

Create `src/mcp/server.ts`:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { prisma } from './db';
import { createDeps } from './deps';
import { logger } from './logger';
import { registerArchiveActivity } from './tools/archiveActivity';
import { registerConfirmActivity } from './tools/confirmActivity';
import { registerIngestActivity } from './tools/ingestActivity';
import { registerListActivitiesDueForRecheck } from './tools/listActivitiesDueForRecheck';

async function main(): Promise<void> {
  // Fail fast with a clear stderr message if the DB is unreachable — an
  // ingestion server with no database is non-functional.
  try {
    await prisma.$connect();
    logger.info({ msg: 'database connected' });
  } catch (error) {
    logger.error({
      msg: 'database unreachable — aborting startup',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }

  const deps = createDeps(prisma);
  const server = new McpServer({ name: 'wandr-ingestion', version: '0.1.0' });

  registerIngestActivity(server, deps.ingest, logger);
  registerListActivitiesDueForRecheck(server, deps.list, logger);
  registerConfirmActivity(server, deps.confirm, logger);
  registerArchiveActivity(server, deps.archive, logger);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info({ msg: 'wandr-ingestion MCP server ready (stdio)' });
}

main().catch((error) => {
  logger.error({ msg: 'fatal', error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
```

- [ ] **Step 3: Type-check the whole project**

Run: `pnpm type-check`
Expected: PASS. (If `tsc` flags the `args` parameter in any `register*` callback as not assignable, change that callback's first line from `const input = args as XInput;` to `const input = args as unknown as XInput;` — the SDK delivers the Zod-parsed object at runtime, so the cast is sound.)

- [ ] **Step 4: Commit**

```bash
git add src/mcp/db.ts src/mcp/server.ts
git commit -m "feat(mcp): wandr-ingestion stdio server bootstrap (dedicated client, fail-fast DB)"
```

---

## Task 12: Register the server, fix lint/orphan rules, record deferrals

**Files:**
- Create: `.mcp.json`
- Modify: `.dependency-cruiser.cjs`
- Modify: `tbd.md`

- [ ] **Step 1: Create `.mcp.json`**

Loads `.env` via `tsx --env-file` so `DATABASE_URL` (and optional `LOG_LEVEL`) reach the process without committing a secret — better than the spec's inline `DATABASE_URL` example. The `cmd /c` wrapper is required on Windows (this machine) so `pnpm` resolves; on POSIX, drop `"cmd", "/c",` and set `"command": "pnpm"`.

Create `.mcp.json`:

```json
{
  "mcpServers": {
    "wandr-ingestion": {
      "command": "cmd",
      "args": ["/c", "pnpm", "tsx", "--env-file=.env", "src/mcp/server.ts"]
    }
  }
}
```

- [ ] **Step 2: Exempt the server entrypoint from `no-orphans`**

In `.dependency-cruiser.cjs`, in the `no-orphans` rule's `from.pathNot` array, add the entrypoint line after `'\\.test\\.(?:ts|tsx)$',`:

```js
        pathNot: [
          '(^|/)\\.[^/]+\\.(?:js|cjs|mjs|ts|tsx)$',
          '\\.d\\.ts$',
          '^src/app/',
          '\\.test\\.(?:ts|tsx)$',
          '^src/mcp/server\\.ts$',
        ],
```

(`server.ts` is a process entrypoint — nothing imports it — so it would otherwise warn as an orphan. All other `src/mcp/*` files are imported by `server.ts` or by tests.)

- [ ] **Step 3: Run dependency-cruiser to confirm no violations**

Run: `pnpm dep:check`
Expected: PASS — no `error`-severity violations and no orphan `warn` for `src/mcp/`. (No rule constrains `^src/mcp`, so importing `application` + `infra` from `src/mcp` is allowed, exactly as `modules/*/web` route handlers do.)

- [ ] **Step 4: Record the deferrals in `tbd.md`**

In `tbd.md`, under `## Assumptions`, add:

```md
- **No authorization on the ingestion MCP server.** stdio = OS-process isolation, no network surface to protect (spec plan-2 Q4). Revisit (bearer token) only if the server is ever exposed over HTTP/remote. — `src/mcp/server.ts`.
```

```md
- **Dedicated Prisma client in `src/mcp/db.ts`.** The MCP process does not reuse the shared `src/shared/db/prisma.ts` singleton because its string-form `log` writes to stdout (corrupts JSON-RPC). Reconcile the two clients if/when the `apps/web` + `apps/mcp` split happens. — `src/mcp/db.ts`, spec plan-2 §3.
```

Under `## Hardcoded`, add:

```md
- **`STAGED_DEDUPE_KEY = 'pending-promotion'`** written by `ingestActivity` as the candidate's staging dedupeKey; the authoritative key is recomputed inside `PromoteCandidateUseCase` (cannot be computed at staging — `computeDedupeKey` throws for an EVENT without dateStart). — `src/mcp/tools/ingestActivity.ts`, spec plan-2 §8.
- **`.mcp.json` uses a Windows `cmd /c pnpm` launcher.** On POSIX, drop `"cmd", "/c"` and set `"command": "pnpm"`. — `.mcp.json`.
```

Then replace the existing `## Future changes` bullet that reads `- **Ingestion MCP server** (agent-facing tools wrapping the use cases). — plan: ...design.md.` with:

```md
- **Split monorepo `apps/web` + `apps/mcp`.** The ingestion MCP server ships in `src/mcp/` for now (spec plan-2 Q2); reconcile with `CLAUDE.md` §4's `apps/web` naming when a real second deploy target exists. — `src/mcp/`.
- **Rename `listActivitiesDueForRecheck` → `listPlacesDueForRecheck`.** Today it only ever returns PLACEs (EVENTs have no `recheckAfter`); keep the generic name unless EVENT re-verification is ever added, then rename for clarity. — `src/mcp/tools/listActivitiesDueForRecheck.ts`.
- **Return `structuredContent` from the MCP tools.** Currently tools return JSON in a text content block (uniform across tools; the array-returning `listActivitiesDueForRecheck` would otherwise need an `{items:[]}` wrapper). Add `structuredContent` + `outputSchema` if a client benefits from typed structured output. — `src/mcp/runTool.ts`.
```

- [ ] **Step 5: Commit**

```bash
git add .mcp.json .dependency-cruiser.cjs tbd.md
git commit -m "chore(mcp): register server in .mcp.json, exempt entrypoint from no-orphans, record deferrals"
```

---

## Task 13: MCP tools integration test (ingestion + recheck flows)

**Files:**
- Create: `src/mcp/mcp-tools.integration.test.ts`

Drives the real handlers against the real Prisma adapters and Postgres, in an isolated test city (so its `(cityId, dedupeKey)` space and feed are untouched by seed data). Uses a mutable clock so the recheck flow can fast-forward past `recheckAfter` without sleeping.

- [ ] **Step 1: Write the failing integration test**

Create `src/mcp/mcp-tools.integration.test.ts`:

```ts
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { ExtractedActivityPayload } from '../modules/activities/domain/RawActivityCandidate';
import { prisma } from '../shared/db/prisma';
import { createDeps } from './deps';
import { confirmActivity } from './tools/confirmActivity';
import { ingestActivity } from './tools/ingestActivity';
import { listActivitiesDueForRecheck } from './tools/listActivitiesDueForRecheck';

const DAY = 24 * 60 * 60 * 1000;
const CITY_SLUG = 'mcp-it-tools';
const AGENT = 'mcp-it-tools-agent';

let cityId: string;
// Mutable clock shared by all four bundles; advancing it lets us cross recheck
// deadlines deterministically (createDeps reads it lazily per call).
let clock = new Date('2026-05-23T12:00:00.000Z');
const deps = createDeps(prisma, () => clock);

function payload(overrides: Partial<ExtractedActivityPayload> = {}): ExtractedActivityPayload {
  return {
    title: 'IT Bagel',
    description: 'Test bagels.',
    imageUrl: 'https://example.com/bagel.jpg',
    imageCredit: null,
    kind: 'PLACE',
    category: 'FOOD',
    address: '1 Rue Test, Montreal, QC',
    neighborhood: 'Mile End',
    latitude: 45.5227,
    longitude: -73.6016,
    dateStart: null,
    dateEnd: null,
    priceMinCents: 200,
    priceMaxCents: null,
    externalUrl: 'https://example.com/it-bagel',
    indoor: true,
    outdoor: false,
    tags: ['FOOD'],
    ...overrides,
  };
}

function meta() {
  return {
    agentName: AGENT,
    searchQuery: 'best bagels montreal',
    sourceUrl: 'https://example.com/article',
    rawExcerpt: 'IT Bagel is a test fixture...',
    category: 'FOOD' as const,
  };
}

beforeAll(async () => {
  const city = await prisma.city.upsert({
    where: { slug: CITY_SLUG },
    update: {},
    create: {
      slug: CITY_SLUG,
      name: 'MCP IT Tools City',
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
  cityId = city.id;

  // Defensive: clear any rows a previous crashed run left in this isolated city.
  await prisma.rawActivityCandidate.deleteMany({ where: { cityId } });
  await prisma.activity.deleteMany({ where: { cityId } });
});

afterEach(async () => {
  clock = new Date('2026-05-23T12:00:00.000Z');
  await prisma.rawActivityCandidate.deleteMany({ where: { cityId } });
  await prisma.activity.deleteMany({ where: { cityId } });
});

afterAll(async () => {
  await prisma.source.deleteMany({ where: { name: AGENT } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  await prisma.$disconnect();
});

describe('MCP ingestion flow (integration)', () => {
  it('PROMOTED on first ingest, DUPLICATE (same activity) on re-ingest of the same payload', async () => {
    const first = await ingestActivity(deps.ingest, {
      citySlug: CITY_SLUG,
      payload: payload(),
      meta: meta(),
    });
    expect(first.outcome).toBe('PROMOTED');
    expect(first.activityId).not.toBeNull();

    const second = await ingestActivity(deps.ingest, {
      citySlug: CITY_SLUG,
      payload: payload(),
      meta: meta(),
    });
    expect(second.outcome).toBe('DUPLICATE');
    expect(second.activityId).toBe(first.activityId);

    const rows = await prisma.activity.count({ where: { cityId } });
    expect(rows).toBe(1);
  });
});

describe('MCP recheck flow (integration)', () => {
  it('lists due (ordered, bounded), confirm pushes recheckAfter so a re-list does not overlap', async () => {
    // Three distinct PLACEs ingested at the same clock → identical recheckAfter,
    // so list ordering falls to the id tiebreaker; we assert on membership.
    const ids: string[] = [];
    for (const title of ['IT Bagel A', 'IT Bagel B', 'IT Bagel C']) {
      const r = await ingestActivity(deps.ingest, {
        citySlug: CITY_SLUG,
        payload: payload({ title, externalUrl: `https://example.com/${title}` }),
        meta: meta(),
      });
      expect(r.outcome).toBe('PROMOTED');
      ids.push(r.activityId as string);
    }

    // Nothing is due yet (recheckAfter = now + 90d).
    expect(await listActivitiesDueForRecheck(deps.list, { citySlug: CITY_SLUG })).toHaveLength(0);

    // Fast-forward past the 90-day PLACE deadline.
    clock = new Date(clock.getTime() + 100 * DAY);

    const dueLimited = await listActivitiesDueForRecheck(deps.list, {
      citySlug: CITY_SLUG,
      limit: 2,
    });
    expect(dueLimited).toHaveLength(2);
    expect(dueLimited[0]).toHaveProperty('lastVerifiedAt');
    expect(typeof dueLimited[0].lastVerifiedAt).toBe('string');

    const dueAll = await listActivitiesDueForRecheck(deps.list, { citySlug: CITY_SLUG });
    expect(dueAll.map((d) => d.id).sort()).toEqual([...ids].sort());

    // Confirm one; its deadline moves to clock + 90d (future relative to clock).
    const confirmed = await confirmActivity(deps.confirm, { activityId: ids[0] });
    expect(confirmed.recheckAfter).not.toBeNull();

    // A fresh list at the same clock must NOT include the confirmed id (no overlap).
    const dueAfter = await listActivitiesDueForRecheck(deps.list, { citySlug: CITY_SLUG });
    expect(dueAfter.map((d) => d.id)).not.toContain(ids[0]);
    expect(dueAfter.map((d) => d.id).sort()).toEqual([ids[1], ids[2]].sort());
  });
});
```

- [ ] **Step 2: Run the integration test to verify it passes**

Run: `pnpm test:integration`
Expected: PASS — the adapter test from Task 3 plus these two flows (3 integration tests total). Requires `DATABASE_URL` in `.env` and a reachable Postgres.

> If `pnpm test:integration` is run before Task 3's adapter behavior exists, the recheck flow would fail on ordering/limit. Since Task 3 already shipped, both files pass together here.

- [ ] **Step 3: Commit**

```bash
git add src/mcp/mcp-tools.integration.test.ts
git commit -m "test(mcp): end-to-end ingestion + recheck integration coverage"
```

---

## Task 14: Full verification + server smoke test

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

Run: `pnpm type-check`
Expected: PASS (no errors).

Run: `pnpm lint`
Expected: PASS (no errors).

Run: `pnpm dep:check`
Expected: PASS (no `error` violations, no `warn` orphans).

- [ ] **Step 2: Unit test suite (no DB)**

Run: `pnpm test`
Expected: PASS — includes the new `runTool`, four tool handler suites, `deps`, and the amended `ConfirmActivityUseCase` tests. No `*.integration.test.ts` runs.

- [ ] **Step 3: Integration suite (requires DB)**

Run: `pnpm test:integration`
Expected: PASS — `findDueForRecheck` adapter test + the two MCP flow tests. Test rows are cleaned up (no `mcp-it-*` city/source/activity rows remain).

- [ ] **Step 4: Server smoke test (real stdio handshake)**

Verifies the bootstrap, the fail-fast DB connect, tool registration, and the stdout/stderr discipline. Postgres must be **up** (the server exits if `$connect()` fails). Closing stdin (EOF) makes the server exit; run via the Bash tool with a ~20s timeout so a hang is caught rather than blocking.

Run (Bash tool, `timeout: 20000`):

```bash
printf '%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | pnpm tsx --env-file=.env src/mcp/server.ts
```

Expected: stdout contains JSON-RPC responses; the `id:2` response lists all four tools — grep for `ingestActivity`, `listActivitiesDueForRecheck`, `confirmActivity`, `archiveActivity`. The `database connected` and `ready (stdio)` lines appear on **stderr** only (never interleaved into the stdout JSON). The process exits on EOF. If the DB is down, expect the `database unreachable — aborting startup` line on stderr and a non-zero exit.

- [ ] **Step 5: Final commit (if any verification fix was needed)**

Only if a check above required an edit:

```bash
git add -A
git commit -m "chore(mcp): verification fixes"
```

---

## Spec coverage (self-review)

| Spec section | Covered by |
|---|---|
| §1 four tools | Tasks 6–9 |
| §2 Q1 stdio / launch | Task 11 (`StdioServerTransport`), Task 12 (`.mcp.json`) |
| §2 Q2 `src/mcp/` location | Tasks 4–11 |
| §2 Q4 no auth | Task 12 (`tbd.md`) |
| §2 Q9 pino → stderr, one line/call | Task 4, `runTool` log + per-tool `logLine` (Tasks 5–9) |
| §2 Q10 server-provided `now`, non-overridable | `now` in deps (not in any input schema); Task 10 |
| §3 layering, no `env.ts`, dep-cruiser orphan (dedicated Prisma client instead of the stdout-logging singleton — deviation noted in `tbd.md`) | Task 11, Task 12 |
| §4.1 two-layer validation (Zod → tool error; domain → REJECTED) | Task 5 (`runTool`), Task 6 (REJECTED vs throw), Task 7 (throw) |
| §4.2 contracts (each tool's composition + output) | Tasks 6–9; `findBySlug`→REJECTED (ingest) vs throw (list); `PromoteCandidateUseCase(activityRepo, activityRepo, …)` wiring in Task 10 |
| §4.3 tool descriptions | `*Description` consts in Tasks 6–9 |
| §5 `findDueForRecheck` limit + ordering | Task 3 |
| §5 `ConfirmActivityUseCase` returns `{ recheckAfter }` | Task 2 |
| §6 observability + bootstrap | Tasks 4, 5, 11 |
| §7 unit tests (every branch) | Tasks 5–10 |
| §7 integration (ingestion + recheck flows) | Task 13 |
| §8 deferrals (`tbd.md`) | Task 12 |

