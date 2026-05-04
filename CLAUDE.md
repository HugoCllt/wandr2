# CLAUDE.md — Wandr Modular Monolith Architecture Rules

This document defines architectural rules and guardrails for Wandr development. All code changes must follow these principles to maintain a clean, modular, monolithic codebase.

---

## Architecture Vision

**Wandr is a modular monolith:**
- Single Next.js codebase (frontend + API routes)
- Single PostgreSQL database
- Modules with clear boundaries and stable interfaces
- Modules communicate via typed contracts, not direct imports
- No circular dependencies
- Each module is independently testable

**Goal:** Keep the codebase organized, maintainable, and ready for extraction to microservices if needed in the future.

---

## Module Structure

### Directory Layout

```
src/
├── modules/                    # Core domain modules
│   ├── catalog/                # Activity Catalog Module
│   │   ├── index.ts            # Public interface
│   │   ├── types.ts            # Module types
│   │   ├── service.ts          # Business logic
│   │   ├── queries.ts          # Database queries (Prisma)
│   │   └── __tests__/          # Unit tests for module
│   ├── filters/                # Filter Engine Module
│   ├── search/                 # Smart Search Parser Module
│   ├── map/                    # Map Adapter Module
│   ├── favorites/              # Favorites Store Module
│   ├── detail/                 # Activity Detail Renderer Module
│   ├── carousel/               # Carousel Controller Module
│   ├── flame/                  # Trend Flame Scorer Module (Phase 2+)
│   ├── profile/                # Profile & Stats Aggregator Module (Phase 2+)
│   ├── chat/                   # Chat Orchestrator Module (Phase 3+)
│   ├── personalization/        # Personalization Engine Module (Phase 3+)
│   ├── recommendations/        # Recommendation Ranker Module (Phase 3+)
│   └── shared/                 # Shared utilities, types, and constants
│       ├── types.ts            # Cross-module types
│       ├── constants.ts        # Global constants
│       ├── utils.ts            # Utility functions
│       └── errors.ts           # Error definitions
├── pages/api/                  # Next.js API routes (dispatch to modules)
├── components/                 # UI components (organized by feature)
└── lib/                        # Shared frontend utilities

```

### Module Anatomy (Template)

Each module should follow this structure:

```
src/modules/[module-name]/
├── index.ts                    # MANDATORY: Public interface (exports only)
├── types.ts                    # MANDATORY: TypeScript types (no implementation)
├── service.ts                  # MANDATORY: Business logic (pure functions where possible)
├── queries.ts                  # Database queries (Prisma client calls)
├── api.ts                      # (Optional) API endpoint handlers that delegate to service
├── __tests__/
│   ├── service.test.ts         # Unit tests for service (pure functions)
│   ├── integration.test.ts     # Integration tests
│   └── fixtures.ts             # Test data
└── README.md                   # Module documentation

```

---

## Module Interface Rules

### Rule 1: Public Interface Only

**Every module MUST have an `index.ts` that exports its public interface.**

```typescript
// src/modules/catalog/index.ts
export type { Activity, ActivityQuery, ActivityFilter } from './types'
export { CatalogService } from './service'
export { CatalogError } from './errors'
```

**DO NOT import from internal files directly.** Always import from the module root:

```typescript
// ✅ GOOD
import { CatalogService } from '@/modules/catalog'

// ❌ BAD
import { CatalogService } from '@/modules/catalog/service'
```

---

### Rule 2: Clear Type Boundaries

**Module types go in `types.ts`. No business logic in types.**

```typescript
// src/modules/catalog/types.ts
export type Activity = {
  id: UUID
  title: string
  category: ActivityCategory
  location: Location
  price: PriceRange
  // ... other fields
}

export type ActivityQuery = {
  filters: ActivityFilter[]
  sort: 'relevance' | 'popularity' | 'price' | 'date'
  cursor?: string
  limit: number
}

export type ActivityFilter = 
  | { type: 'category'; value: ActivityCategory }
  | { type: 'price'; min: number; max: number }
  // ... other filter types
```

---

### Rule 3: Service Layer is the Module's Brain

**All business logic lives in the service. Services are pure when possible.**

```typescript
// src/modules/catalog/service.ts
export class CatalogService {
  constructor(private db: PrismaClient) {}

  async query(q: ActivityQuery): Promise<{ activities: Activity[]; nextCursor?: string }> {
    // Business logic here
    // Call queries layer for DB access
    const activities = await this.queries.getActivities(q)
    return { activities, nextCursor: activities[activities.length - 1]?.id }
  }

  scoreRelevance(activity: Activity, query: ActivityQuery): number {
    // Pure function: same input → same output
    // No side effects
    return activity.views * 0.4 + activity.saves * 0.6
  }
}
```

---

### Rule 4: Stable, Narrow Interfaces

**Services expose a small, stable interface. Hide complexity inside.**

```typescript
// ✅ GOOD: Narrow, stable interface
export class CatalogService {
  async query(q: ActivityQuery): Promise<QueryResult>
  async getById(id: UUID): Promise<Activity>
}

// ❌ BAD: Leaky, unstable
export class CatalogService {
  async rawQuery(sql: string): any  // Exposes SQL
  async getCatalogInternalState(): any  // Exposes internals
  async querySlow(...manyOverloadedParams): any  // Too many signatures
}
```

---

### Rule 5: No Cross-Module Imports (Except via Public Interface)

**Modules MUST NOT import from internal files of other modules.**

```typescript
// ✅ GOOD: Import via public interface
import { CatalogService, Activity } from '@/modules/catalog'

// ❌ BAD: Importing internal files
import { CatalogService } from '@/modules/catalog/service'
import { queries } from '@/modules/catalog/queries'
```

---

### Rule 6: Module Dependencies Must Be Explicit

**Modules that depend on other modules must declare it in their `index.ts` comments and accept injected dependencies.**

```typescript
// src/modules/filters/index.ts
/**
 * Filter Engine Module
 * 
 * Dependencies: Catalog (for filtering activity queries)
 * Public Interface: FilterService
 */
export { FilterService } from './service'

// src/modules/filters/service.ts
export class FilterService {
  constructor(
    private catalogService: CatalogService,  // Injected
  ) {}

  async applyFilter(filter: Filter): Promise<Activity[]> {
    // Delegates to Catalog, doesn't duplicate logic
    const query = this.buildQuery(filter)
    return this.catalogService.query(query)
  }
}
```

---

### Rule 7: Errors Are Module-Scoped

**Each module defines its own error types. Errors are exported from `index.ts`.**

```typescript
// src/modules/catalog/errors.ts
export class CatalogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogError'
  }
}

export class ActivityNotFoundError extends CatalogError {}

// src/modules/catalog/index.ts
export { CatalogError, ActivityNotFoundError } from './errors'
```

**API handlers catch module errors and translate to HTTP responses:**

```typescript
// src/pages/api/activities/[id].ts
try {
  const activity = await catalogService.getById(id)
  res.json(activity)
} catch (error) {
  if (error instanceof ActivityNotFoundError) {
    res.status(404).json({ error: 'Activity not found' })
  } else if (error instanceof CatalogError) {
    res.status(400).json({ error: error.message })
  } else {
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

---

### Rule 8: Database Queries in Queries Layer

**All Prisma calls go in `queries.ts`. Services call queries, never Prisma directly.**

```typescript
// src/modules/catalog/queries.ts
export class CatalogQueries {
  constructor(private db: PrismaClient) {}

  async getActivities(q: ActivityQuery): Promise<Activity[]> {
    const where = this.buildWhereClause(q.filters)
    return this.db.activity.findMany({
      where,
      orderBy: this.buildOrderBy(q.sort),
      take: q.limit,
      skip: q.cursor ? 1 : 0,
      cursor: q.cursor ? { id: q.cursor } : undefined,
    })
  }

  private buildWhereClause(filters: ActivityFilter[]): Prisma.ActivityWhereInput {
    // Query building logic
  }
}

// src/modules/catalog/service.ts
export class CatalogService {
  constructor(
    private queries: CatalogQueries,
  ) {}

  async query(q: ActivityQuery): Promise<QueryResult> {
    return this.queries.getActivities(q)
  }
}
```

---

## API Endpoint Rules

### Rule 9: API Routes Delegate to Services

**API routes (`src/pages/api/`) are thin adapters. They parse requests, call services, and format responses.**

```typescript
// src/pages/api/activities/index.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { CatalogService } from '@/modules/catalog'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Parse request
  const { filters, sort, cursor, limit } = req.query

  // Validate
  if (!limit || limit > 100) {
    return res.status(400).json({ error: 'Invalid limit' })
  }

  // Delegate to service
  try {
    const result = await catalogService.query({
      filters: parseFilters(filters),
      sort: sort as any,
      cursor: cursor as string,
      limit: parseInt(limit as string),
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

**NOT:**

```typescript
// ❌ BAD: Business logic in API route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const activities = await db.activity.findMany(...)
  const filtered = activities.filter(...)
  const sorted = filtered.sort(...)
  res.json(sorted)
}
```

---

### Rule 10: API Contracts Are Defined

**Every API endpoint has a documented contract (request/response types).**

```typescript
// src/modules/catalog/types.ts
export type ActivityQueryRequest = {
  filters?: ActivityFilter[]
  sort?: 'relevance' | 'popularity' | 'price' | 'date'
  cursor?: string
  limit: number
}

export type ActivityQueryResponse = {
  activities: Activity[]
  nextCursor?: string
  totalCount: number
}

// src/pages/api/activities/index.ts
// GET /api/activities
// Request: query params matching ActivityQueryRequest
// Response: ActivityQueryResponse
```

---

## Testing Rules

### Rule 11: Unit Tests for Services

**Services are pure functions (or pure-ish). Unit tests verify business logic in isolation.**

```typescript
// src/modules/catalog/__tests__/service.test.ts
describe('CatalogService', () => {
  let service: CatalogService
  let mockQueries: jest.Mocked<CatalogQueries>

  beforeEach(() => {
    mockQueries = createMockQueries()
    service = new CatalogService(mockQueries)
  })

  describe('scoreRelevance', () => {
    it('weights views 40% and saves 60%', () => {
      const activity = { views: 100, saves: 100, ... }
      const score = service.scoreRelevance(activity)
      expect(score).toBe(100 * 0.4 + 100 * 0.6)
    })
  })

  describe('query', () => {
    it('calls queries.getActivities with correct filter', async () => {
      await service.query({ filters: [...], sort: 'popularity', limit: 10 })
      expect(mockQueries.getActivities).toHaveBeenCalledWith(...)
    })
  })
})
```

### Rule 12: Integration Tests for Compositions

**Integration tests verify that modules work together correctly.**

```typescript
// src/modules/filters/__tests__/integration.test.ts
describe('Filters + Catalog Integration', () => {
  let filterService: FilterService
  let catalogService: CatalogService
  let db: PrismaClient

  beforeEach(async () => {
    db = new PrismaClient()
    catalogService = new CatalogService(new CatalogQueries(db))
    filterService = new FilterService(catalogService)
  })

  it('applies filters correctly', async () => {
    const results = await filterService.applyFilter({
      type: 'category',
      value: 'Sports',
    })
    expect(results.every(a => a.category === 'Sports')).toBe(true)
  })
})
```

---

## Shared Code Rules

### Rule 13: Shared Code in `shared/` Module

**Code used by multiple modules goes in `src/modules/shared/`.**

```typescript
// src/modules/shared/types.ts
export type UUID = string & { readonly __brand: 'UUID' }
export type Location = { lat: number; lng: number; address: string }
export type ActivityCategory = 'Sports' | 'Dining' | 'Culture' | ...

// src/modules/catalog/types.ts
import { UUID, ActivityCategory } from '@/modules/shared/types'

export type Activity = {
  id: UUID
  category: ActivityCategory
  ...
}
```

---

### Rule 14: No Shared Business Logic Across Modules

**Each module owns its business logic. Don't create shared "utils" for logic.**

```typescript
// ❌ BAD: Shared business logic utility
// src/modules/shared/scoring.ts
export function scoreActivity(activity: Activity): number {
  // This is Catalog business logic, not shared
  return activity.views * 0.4 + activity.saves * 0.6
}

// ✅ GOOD: Business logic in its owning module
// src/modules/catalog/service.ts
export class CatalogService {
  scoreRelevance(activity: Activity): number {
    return activity.views * 0.4 + activity.saves * 0.6
  }
}
```

---

## Dependency Injection

### Rule 15: Constructor Injection, Not Service Locator

**Modules are initialized with dependencies injected via constructor.**

```typescript
// ✅ GOOD: Constructor injection
const catalogQueries = new CatalogQueries(prismaClient)
const catalogService = new CatalogService(catalogQueries)
const filterService = new FilterService(catalogService)

// ❌ BAD: Service locator / global state
// src/modules/filters/service.ts
const catalogService = getServiceFromGlobalRegistry('catalog')
```

**Setup in a root service factory:**

```typescript
// src/lib/services.ts
export function initializeServices(db: PrismaClient) {
  // Layer 1: Queries
  const catalogQueries = new CatalogQueries(db)
  const favoriteQueries = new FavoriteQueries(db)

  // Layer 2: Services that only depend on queries
  const catalogService = new CatalogService(catalogQueries)
  const favoriteService = new FavoriteService(favoriteQueries)

  // Layer 3: Services that depend on other services
  const filterService = new FilterService(catalogService)
  const detailService = new DetailService(catalogService, favoriteService)

  return {
    catalog: catalogService,
    favorites: favoriteService,
    filters: filterService,
    detail: detailService,
  }
}

// src/pages/api/[...route].ts
const services = initializeServices(prisma)
export default async function handler(req, res) {
  // Use services.catalog, services.filters, etc.
}
```

---

## Phase-Based Module Activation

### Rule 16: Modules Aligned to Phases

**Modules are organized by PRD phase. Disable Phase 2/3 modules in Phase 1 deployments.**

```
Phase 1 Modules (Active):
├── catalog
├── filters
├── search
├── map
├── favorites
├── detail
├── carousel
└── shared

Phase 2 Modules (Inactive in Phase 1):
├── flame        // Commented out until Phase 2
├── profile      // Commented out until Phase 2
└── ...

Phase 3 Modules (Inactive in Phase 1/2):
├── chat         // Commented out until Phase 3
├── personalization
├── recommendations
└── ...
```

**In `src/lib/services.ts`:**

```typescript
export function initializeServices(db: PrismaClient, phase: 'phase1' | 'phase2' | 'phase3') {
  // Core modules (always active)
  const catalogService = new CatalogService(...)
  const filterService = new FilterService(...)

  // Phase 2+ modules
  const flameService = phase >= 'phase2' 
    ? new FlameService(...)
    : null

  // Phase 3+ modules
  const chatService = phase >= 'phase3'
    ? new ChatService(...)
    : null

  return { catalogService, filterService, flameService, chatService, ... }
}
```

---

## Code Style & Conventions

### Rule 17: Consistent File Naming

```
service.ts          # Service class
queries.ts          # Database query class
types.ts            # TypeScript types only
errors.ts           # Error definitions
index.ts            # Public interface
api.ts              # API endpoint handlers (optional)
__tests__/          # All test files
```

### Rule 18: TypeScript Strict Mode

**All files compile with `strict: true`.**

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Rule 19: ESLint & Prettier

**All code formatted by Prettier, linted by ESLint.**

- No import loops (eslint-plugin-import)
- No unused variables
- Consistent indentation (2 spaces)
- Semicolons required
- Single quotes for strings

---

## Documentation Rules

### Rule 20: Module Documentation

**Every module has a `README.md`:**

```markdown
# Catalog Module

## Purpose
Single source of truth for activities. Handles fetching, filtering, sorting, caching.

## Public Interface
- `CatalogService.query(q: ActivityQuery) → QueryResult`
- `CatalogService.getById(id: UUID) → Activity`

## Dependencies
None (only depends on Prisma)

## Design Notes
- Geo-distance computed in the database (PostGIS)
- Results are paginated via cursor (not offset)

## Testing
- Unit tests verify scoring logic
- Integration tests verify pagination
```

---

## Guardrails for AI Agents

### Rule 21: Enforce Module Boundaries

**When implementing a feature:**

1. ✅ **DO:** Create a new module in `src/modules/[name]/`
2. ✅ **DO:** Export types and service from `index.ts`
3. ✅ **DO:** Write unit tests in `__tests__/`
4. ✅ **DO:** Depend on other modules via their public interfaces only
5. ✅ **DO:** Inject dependencies in constructor
6. ✅ **DO:** Keep services pure when possible

**DO NOT:**

- ❌ Mutate state across modules
- ❌ Import from internal files (`/service.ts`, `/queries.ts`)
- ❌ Create circular dependencies
- ❌ Store logic in shared "utils"
- ❌ Access another module's database directly
- ❌ Hardcode dependencies (use injection)
- ❌ Expose module internals in public API

### Rule 22: Code Review Checklist (for AI)

Before submitting code, verify:

- [ ] Module has `index.ts` exporting public interface
- [ ] No imports from internal module files elsewhere
- [ ] Service class is testable in isolation
- [ ] Unit tests exist for pure functions
- [ ] Errors are module-scoped and exported
- [ ] Dependencies are injected, not hardcoded
- [ ] TypeScript compiles with `strict: true`
- [ ] ESLint passes, Prettier formatted
- [ ] No console.log (use logger instead)
- [ ] No TODO comments without issues
- [ ] Module documentation (README.md) is complete

---

## Summary

**Modular Monolith Principles:**

1. **Clear Boundaries** — Modules are isolated by directory and public interface
2. **Stable Interfaces** — Small, versioned, rarely-changing public APIs
3. **No Coupling** — Modules depend on abstractions, not implementations
4. **Testability** — Each module is unit-testable in isolation
5. **Scalability** — Modules can be extracted to microservices if needed
6. **Single Deployment** — One codebase, one deployment artifact
7. **Team Independence** — Teams can work on different modules without merge conflicts

---

**Last Updated:** 2026-05-04  
**Architecture Version:** Modular Monolith v1  
**Applies to:** Phase 1, Phase 2, Phase 3
