# CLAUDE.md — Wandr Architecture Guardrails

**Pattern:** Domain-Driven Design + Clean Architecture + Selective Hexagonal

AI agents building Wandr must enforce these boundaries. Violations compound; early enforcement prevents refactoring debt.

---

## Fundamental Rules

### 1. Strict Layer Isolation

```
Allowed Dependencies (upward only):
  web/ → application/ → domain/
  infrastructure/ → domain/ (implements ports)
  contracts/ → (no deps, shared at boundaries)
  
Forbidden (violations cause tight coupling):
  ❌ domain/ → application/
  ❌ domain/ → infrastructure/
  ❌ web/ → infrastructure/ directly
  ❌ application/ → web/
```

**Enforcement:** TypeScript paths must prevent sideways/downward imports. Use linting rules.

---

### 2. Domain Layer — Pure Business Logic

**Scope:** Entities, value objects, ports, business rules. No frameworks, no side effects.

**What belongs:**
- `Activity`, `User`, `Favorite` entities
- `FeedQuery`, `FeedResult` value objects
- Port interfaces: `IActivityRepository`, `ISearchProvider`, `ILLMProvider`
- Business rules: `Activity.isAvailable()`, scoring logic
- Domain errors: `ActivityNotFoundError`

**What does NOT:**
- Prisma, HTTP, React, framework-specific code
- Transport DTOs (those are in contracts/)
- Infrastructure details

**Example:**
```typescript
// ✅ GOOD: Pure domain
export class Activity {
  constructor(
    readonly id: UUID,
    readonly title: string,
    readonly category: ActivityCategory,
  ) {}
  
  isAvailable(): boolean {
    // Pure function, testable in isolation
    return true
  }
}

// ❌ BAD: Infrastructure leaking into domain
export class Activity {
  async save(): Promise<void> {
    await prisma.activity.update(...)  // Domain shouldn't know Prisma exists
  }
}
```

**Test:** Unit tests only, no mocks, pure assertions.

---

### 3. Application Layer — Use Case Orchestration

**Scope:** Implement use cases, compose domain + infrastructure, handle errors.

**What belongs:**
- `GetFeedUseCase`, `SearchActivitiesUseCase`, `ChatWithActivitiesUseCase`
- Orchestration: fetch from repo, apply ranking, paginate
- Error mapping: domain errors → application exceptions
- Dependency injection wiring

**What does NOT:**
- Business logic (belongs in domain)
- Direct database calls (call repos via ports)
- HTTP handling (that's web's job)
- UI rendering (that's web/components)

**Example:**
```typescript
// ✅ GOOD: Application orchestration
export class GetFeedUseCase {
  constructor(
    private activityRepo: IActivityRepository,  // Port, not implementation
    private ranker: IRanker,
  ) {}
  
  async execute(query: FeedQuery): Promise<FeedResult> {
    const activities = await this.activityRepo.findMany(query.filters)
    const ranked = await this.ranker.rank(activities)
    return this.paginate(ranked, query.cursor, query.limit)
  }
}

// ❌ BAD: Application doing infrastructure work
export class GetFeedUseCase {
  async execute(query: FeedQuery) {
    const result = await prisma.activity.findMany(...)  // Direct DB access
    return result
  }
}
```

**Test:** Integration tests with mocked ports.

---

### 4. Infrastructure Layer — Adapter Implementations

**Scope:** Implement ports, external integrations (DB, search, LLM, cache).

**What belongs:**
- `PrismaActivityRepository` implements `IActivityRepository`
- `ElasticsearchAdapter` implements `ISearchProvider`
- `MapboxAdapter` implements `IMapProvider`
- `OpenAIAdapter` implements `ILLMProvider`
- `RedisCache` implements `ICache`

**What does NOT:**
- Business logic
- Orchestration
- API routing
- UI logic

**Example:**
```typescript
// ✅ GOOD: Infrastructure adapter
export class PrismaActivityRepository implements IActivityRepository {
  constructor(private db: PrismaClient) {}
  
  async findMany(filters: Filter[]): Promise<Activity[]> {
    const records = await this.db.activity.findMany({
      where: this.buildWhere(filters),
    })
    // Convert DB record → Domain entity
    return records.map(r => new Activity(r.id, r.title, ...))
  }
}

// ❌ BAD: Exposing infrastructure details
export class ActivityRepository {
  async findMany(): Promise<PrismaActivity[]> {
    // Returns Prisma type, not domain entity
    return this.db.activity.findMany(...)
  }
}
```

**Test:** Integration tests with real/containerized services (testcontainers).

---

### 5. Contracts — Transport-Safe Types

**Scope:** DTOs, view models, API shapes. Single source of truth for boundaries.

**What belongs:**
- `ActivityDTO` — for API transport
- `ActivityCardVM` — for UI rendering
- `FeedQueryDTO` — request shape
- `FeedResultDTO` — response shape
- Error contracts: `{ error: string; code: string }`

**What does NOT:**
- Domain entity classes (those are in domain/)
- Infrastructure details
- Business logic

**Separation principle:**
```typescript
// Three separate shapes, same source data:

// Domain (in packages/domain/)
export class Activity {
  id: UUID
  title: string
  category: ActivityCategory
  // ... pure business
}

// API DTO (in packages/contracts/)
export type ActivityDTO = {
  id: string
  title: string
  category: string
  // ... transport-safe
}

// UI View Model (in packages/contracts/)
export type ActivityCardVM = {
  id: string
  title: string
  priceDisplay: string  // Formatted for UI
  distanceDisplay: string
}
```

**Test:** Contract tests validate mapping between shapes.

---

### 6. Error Handling — Cross-Layer Responsibility

**Domain errors** → **Application mapping** → **HTTP response**

```typescript
// Domain (packages/domain/activities/)
export class ActivityNotFoundError extends Error {
  constructor(id: UUID) {
    super(`Activity ${id} not found`)
  }
}

// Application (packages/application/activities/)
export class GetActivityUseCase {
  async execute(id: UUID): Promise<ActivityDTO> {
    try {
      const activity = await this.repo.findById(id)
      return this.map(activity)  // Domain → DTO
    } catch (error) {
      if (error instanceof ActivityNotFoundError) {
        throw new NotFoundException(error.message)  // Application exception
      }
      throw error
    }
  }
}

// Web (apps/web/app/api/activities/[id]/route.ts)
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const dto = await useCase.execute(params.id)
    return NextResponse.json(dto)
  } catch (error) {
    return handleError(error)  // Application exception → HTTP
  }
}

// Middleware (apps/web/lib/error-handler.ts)
function handleError(error: Error): NextResponse {
  if (error instanceof NotFoundException) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
```

---

### 7. Ports & Adapters (Selective Hexagonal)

**Apply hexagonal (ports + adapters) ONLY to modules with external dependencies:**

**Use ports for:**
- Database (IActivityRepository, IUserRepository)
- Search (ISearchProvider)
- Map (IMapProvider)
- LLM (ILLMProvider)
- Cache (ICache)

**Skip ports for:**
- Filters, sorting, ranking (pure domain logic)
- Favorites, detail, carousel (not external deps)

**Port definition pattern:**
```typescript
// In domain/
export interface IActivityRepository {
  findById(id: UUID): Promise<Activity>
  findMany(filters: Filter[]): Promise<Activity[]>
}

// In infrastructure/database/
export class PrismaActivityRepository implements IActivityRepository {
  // Implementation
}

// In infrastructure/search/ (alternative provider)
export class ElasticsearchRepository implements IActivityRepository {
  // Different implementation, same interface
}
```

---

### 8. Module Dependency Rules

**Dependencies form a DAG (directed acyclic graph). No cycles.**

```
Valid: A → B → C (straight line)
Invalid: A → B → C → A (cycle)

Check: packages/domain/* have zero dependencies on other packages
Check: packages/application/* depend only on domain/
Check: packages/infrastructure/* depend only on domain/
Check: apps/web depends on application/ and contracts/
```

**Enforcement:** Use `madge` or ESLint to detect cycles.

---

### 9. Feed Engine — Application Orchestration Only

**The feed engine is NOT a framework. It is the GetFeedUseCase.**

**Its job:**
- Merge preset + user filters
- Query repository
- Apply rankers (trending, personalization)
- Paginate
- Return DTO

**NOT its job:**
- Section rendering
- Layout logic
- Search parsing
- Chat prompt generation
- Map clustering

**Example:**
```typescript
// ✅ GOOD: Focused orchestration
export class GetFeedUseCase {
  async execute(query: FeedQuery): Promise<FeedResult> {
    const activities = await this.repository.findMany(query.filters)
    const ranked = await this.ranker.rank(activities, query.context)
    return this.paginate(ranked, query.cursor, query.limit)
  }
}

// ❌ BAD: God module
export class FeedEngine {
  parseSearch() { }
  generateChatPrompt() { }
  renderSections() { }
  clusterMapPins() { }
  // ... 50 other methods
}
```

---

### 10. Presets — Configuration, Not Code

**Presets define page behavior, they do NOT contain logic.**

```typescript
// ✅ GOOD: Pure configuration
export const HOME_PRESET: PagePreset = {
  name: 'home',
  feed: {
    filters: ['price', 'distance', 'date', 'category'],
    defaultSort: 'relevance',
    enableInfiniteScroll: true,
  },
  sections: {
    carousel: { enabled: true, count: 5 },
    mapSection: { enabled: true },
    discoveryGrid: { enabled: true },
  },
}

// ❌ BAD: Preset with logic
export const HOME_PRESET = {
  getActivities: async () => {
    // Logic here; breaks the pattern
    return db.activity.findMany(...)
  },
}
```

---

### 11. Testing — Layer-Specific Strategy

| Layer | Scope | Approach | Mocks |
|-------|-------|----------|-------|
| **Domain** | Pure functions, entities | Unit tests | None |
| **Application** | Orchestration | Integration tests | Port mocks |
| **Infrastructure** | Adapters | Integration tests | Real/containerized services |
| **Web** | Pages, hooks, API routes | E2E tests | Real backend |

**Coverage targets:**
- Domain: 90%+
- Application: 80%+
- Infrastructure: 70%+
- E2E: Critical paths only

---

### 12. Naming Conventions

**Consistency prevents confusion.**

```
Entities:        Activity, User, Favorite (nouns, singular)
Repositories:    IActivityRepository, IUserRepository (port interface)
Adapters:        PrismaActivityRepository, ElasticsearchRepository
Use Cases:       GetActivityUseCase, SearchActivitiesUseCase
Services:        NOT used; use use cases + adapters
DTOs:            ActivityDTO, FeedQueryDTO (suffixed with DTO or Request/Response)
View Models:     ActivityCardVM (suffixed with VM)
Presets:         HOME_PRESET, SPORT_PRESET (CONSTANT_CASE)
Errors:          ActivityNotFoundError (extends Error, suffixed with Error)
```

---

### 13. Code Review Checklist (AI Agent)

Before proposing code:

**Domain:**
- [ ] No framework imports (Prisma, HTTP, React)
- [ ] Pure functions where possible
- [ ] Domain errors defined, not generic exceptions
- [ ] Unit tests exist, no mocks

**Application:**
- [ ] Uses ports, not direct infrastructure
- [ ] Orchestrates domain + infrastructure
- [ ] Maps errors appropriately
- [ ] Integration tests with mocked ports

**Infrastructure:**
- [ ] Implements one port, does one job
- [ ] Converts between DTO ↔ Entity
- [ ] No business logic
- [ ] Integration tests with real service

**Web:**
- [ ] Components are presentational (accept DTOs/VMs)
- [ ] Hooks call use cases
- [ ] No business logic
- [ ] API routes are thin adapters

**Contracts:**
- [ ] Separate shapes: DTO, VM, domain model
- [ ] No business logic
- [ ] Types are transport-safe (no classes, no methods)

---

## Violations & Their Consequences

| Violation | Consequence | Fix |
|-----------|-------------|-----|
| Domain imports Prisma | Can't unit test domain | Move to infrastructure adapter |
| Application imports web/ | Circular dependency risk | Pass dependency via constructor |
| Infrastructure duplicates business logic | Multiple sources of truth | Move logic to domain |
| Web calls infrastructure directly | Tightly coupled, hard to test | Call use case, which calls repo |
| Contracts contain methods | Type inflation, can't serialize | Use pure types, helper functions in app/ |
| Feed engine grows to 1000 lines | Becomes unmaintainable, hard to test | Split into smaller use cases |

---

## Summary

**The architecture works because:**

1. Domain has zero dependencies → testable in isolation
2. Application orchestrates domain + infrastructure → logic is clear
3. Infrastructure is replaceable → swap Postgres for MongoDB without touching logic
4. Web is thin → almost no business logic, just routing + rendering
5. Contracts are clear → APIs are self-documenting

**Guard these principles.** They compound in value as the codebase grows.

---

**Last Updated:** 2026-05-04  
**Version:** Clean Architecture v1  
**Authority:** Domain-Driven Design, Clean Architecture (Martin, Evans)
