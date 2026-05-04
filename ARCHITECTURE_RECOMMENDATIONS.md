# Architecture Recommendations & Gaps

After reviewing PRD + ARCHITECTURE.md, here are concrete recommendations to strengthen both.

---

## 🎯 High-Priority Recommendations

### 1. Search Architecture — Needs Clarity

**Current state:** PRD mentions "Smart Search Parser" but architecture doesn't detail search flow.

**Issue:** Search spans multiple layers (parsing, querying, ranking) and needs clear separation.

**Recommendation:**

```
User Query
  ↓
application/search/search-activities.usecase.ts
  ↓
domain/activities/search.port.ts (ISearchProvider port)
  ↓
infrastructure/search/elasticsearch.adapter.ts
  ↓
Results ranked by domain/feed/feed.ranker.ts
  ↓
Return ActivityDTO[]
```

**Action items:**
- Add `packages/domain/search/` with intent parsing (port)
- Add `packages/application/search/` with SearchActivitiesUseCase
- Clarify: does search use feed engine or separate?
- **My take:** Search should use feed engine with special filters, not a parallel path

---

### 2. Error Handling & HTTP Mapping — Not Formalized

**Current state:** Architecture mentions domain errors, but no cross-layer error mapping.

**Issue:** Domain errors (ActivityNotFoundError) must map to HTTP status codes, but no clear contract.

**Recommendation:**

Add `packages/contracts/errors.contract.ts`:

```typescript
// Domain errors (domain/)
export class ActivityNotFoundError extends Error {}
export class UnauthorizedError extends Error {}

// HTTP mapping (in apps/web/app/api/)
const ERROR_MAP: Record<string, number> = {
  ActivityNotFoundError: 404,
  UnauthorizedError: 401,
  ValidationError: 400,
  RateLimitError: 429,
}

export function handleError(error: Error): NextResponse {
  const status = ERROR_MAP[error.constructor.name] || 500
  return NextResponse.json(
    { error: error.message, code: error.constructor.name },
    { status }
  )
}
```

**Action items:**
- Formalize error hierarchy in contracts
- Create error mapper middleware in web/
- Document which exceptions each use case can throw

---

### 3. Authentication & Authorization — Missing Entirely

**Current state:** User entity in PRD, but no auth architecture.

**Issue:** This is a critical cross-cutting concern not addressed.

**Recommendation:**

Create separate layer:

```
packages/
├── application/
│   ├── auth/
│   │   ├── login.usecase.ts
│   │   ├── verify-session.usecase.ts
│   │   └── index.ts
│   └── ...
├── infrastructure/
│   ├── auth/
│   │   ├── jwt.adapter.ts        # Implements IAuthProvider
│   │   ├── session.adapter.ts
│   │   └── index.ts
│   └── ...
```

Middleware in `apps/web/middleware.ts`:

```typescript
// Validate JWT on every request
export function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')
  if (!token) return NextResponse.redirect('/login')
  // Verify & attach to context
}
```

**Action items:**
- Add auth use cases (login, register, verify)
- Add session/JWT infrastructure adapters
- Add auth middleware to API routes
- Define auth contracts (LoginRequestDTO, SessionDTO)

---

### 4. Caching Strategy — Too Vague

**Current state:** Infrastructure has cache package, but PRD & architecture don't define what to cache.

**Issue:** No clear guidance on caching layers, TTLs, invalidation.

**Recommendation:**

Document caching tiers:

```
Layer 1: HTTP Cache (Vercel CDN, browser)
- GET /api/activities → Cache-Control: public, max-age=300
- GET /api/activities/:id → Cache-Control: public, max-age=3600

Layer 2: Application Cache (Redis in infrastructure/)
- Feed results: 5 min TTL
- Activity detail: 1 hour TTL
- User stats: 24 hour TTL

Layer 3: Query-level Cache (in database adapters)
- Frequently accessed queries cached in Redis
- Invalidate on updates
```

**Action items:**
- Add caching strategy doc
- Add cache layer in repository adapters
- Define TTL per query type
- Define cache invalidation triggers (on favorite add/remove, etc.)

---

### 5. Real-Time Features for Chat — Not Addressed

**Current state:** Chat page in Phase 3, but no mention of WebSockets/SSE.

**Issue:** Chat responses could be streamed; architecture is synchronous.

**Recommendation:**

Add real-time adapter:

```
packages/infrastructure/streaming/
├── sse.adapter.ts              # Server-Sent Events
├── websocket.adapter.ts        # Optional for true bidirectional
└── index.ts
```

For Phase 3 Chat:
- Use SSE for LLM streaming (OpenAI, Anthropic both support streaming)
- Keep application layer sync, but add streaming adapter

```typescript
// application/chat/stream-chat-response.usecase.ts
export class StreamChatResponseUseCase {
  async *execute(query: string): AsyncGenerator<string> {
    const intent = this.parseIntent(query)
    const activities = await this.catalogRepository.findMany(...)
    
    // Stream LLM response token-by-token
    for await (const chunk of this.llmProvider.streamResponse(...)) {
      yield chunk
    }
  }
}
```

**Action items:**
- Add streaming adapter to infrastructure
- Update Chat usecase to support streaming
- Add SSE route in apps/web/app/api/chat/stream

---

### 6. Testing Strategy per Layer — Vague in Both Docs

**Current state:** PRD mentions testing pyramid, architecture silent on structure.

**Issue:** Tests should mirror layer structure (unit → integration → e2e).

**Recommendation:**

Formalize test structure:

```
packages/
├── domain/
│   └── activities/
│       ├── src/
│       ├── __tests__/
│       │   ├── activity.entity.test.ts      # Unit: pure logic
│       │   └── activity.repository.port.test.ts
│       └── package.json
│
├── application/
│   └── feed/
│       ├── src/
│       ├── __tests__/
│       │   ├── get-feed.usecase.test.ts     # Integration: with mocked repos
│       │   └── fixtures.ts
│       └── package.json
│
└── infrastructure/
    └── database/
        ├── src/
        ├── __tests__/
        │   ├── activity.repository.test.ts  # Integration: with real DB (test container)
        │   └── setup.ts
        └── package.json

apps/web/
├── app/
├── __tests__/
│   ├── e2e/
│   │   ├── discover-activity.e2e.test.ts    # E2E: full flow
│   │   └── chat-to-booking.e2e.test.ts
│   └── integration/
│       └── api-contracts.test.ts
└── package.json
```

**Testing rules:**
- Domain tests: Pure functions, no mocks needed
- Application tests: Mock repositories, test orchestration
- Infrastructure tests: Real database (via testcontainers), real search client
- E2E tests: Real API, real database, browser automation (Playwright)

**Action items:**
- Add test structure guide
- Define which packages run what tests
- Add CI matrix (test all layers in parallel via Turborepo)
- Add coverage targets per layer (domain 90%, application 80%, infrastructure 70%)

---

### 7. Database Schema Organization — Where Does It Live?

**Current state:** `packages/infrastructure/database/prisma/schema.prisma` but unclear if schema mirrors domain.

**Issue:** Schema should reflect domain entities but live in infrastructure. Need guidance.

**Recommendation:**

```
schema.prisma structure should mirror domain packages:

model Activity {
  id            String @id @default(cuid())
  title         String
  description   String
  category      String // ActivityCategory enum
  locationId    String
  location      Location @relation(...)
  
  // Engagement signals for domain/feed/flame
  viewCount     Int @default(0)
  saveCount     Int @default(0)
  trendFlame    String? // 'low' | 'medium' | 'full' | 'super'
  
  // Relations
  favorites     Favorite[]
}

model User {
  id            String @id @default(cuid())
  email         String @unique
  // Auth is infrastructure concern, but needed in schema
  passwordHash  String?
  sessionToken  String?
  
  // Relations
  favorites     Favorite[]
}

model Favorite {
  userId        String
  activityId    String
  user          User @relation(...)
  activity      Activity @relation(...)
  createdAt     DateTime @default(now())
  
  @@unique([userId, activityId])
}

// For search integration (Phase 2+)
model ActivitySearchIndex {
  id            String @id @default(cuid())
  activityId    String @unique
  activity      Activity @relation(...)
  title         String
  description   String
  category      String
  neighborhood  String
  updatedAt     DateTime @updatedAt
}
```

**Action items:**
- Add schema documentation
- Add migration guide (how to add new domain entity → schema)
- Add seeding script for development

---

### 8. API Contract Design — Scattered in PRD

**Current state:** PRD has API contracts, but no single source of truth.

**Issue:** Contracts are in module READMEs, not in `packages/contracts/`.

**Recommendation:**

Consolidate in `packages/contracts/`:

```
packages/contracts/src/
├── activity.contract.ts
│   # ActivityDTO, ActivitySummaryDTO, ActivityCardVM
│
├── feed.contract.ts
│   # FeedQueryDTO, FeedResultDTO, FeedRequestQuery
│
├── favorites.contract.ts
│   # AddFavoriteRequestDTO, FavoriteDTO
│
├── search.contract.ts
│   # SearchQueryDTO, SearchResultDTO, IntentDTO
│
├── chat.contract.ts
│   # ChatMessageDTO, ChatResponseDTO, IntentDTO
│
└── index.ts
```

Each contract file defines:
```typescript
// Request shape
export type GetFeedRequest = {
  filters?: ActivityFilter[]
  sort?: 'relevance' | 'popularity' | 'price' | 'date'
  cursor?: string
  limit: number
}

// Response shape
export type GetFeedResponse = {
  activities: ActivityDTO[]
  nextCursor?: string
  totalCount: number
}

// OpenAPI spec inline (optional)
export const GET_FEED_SPEC = {
  method: 'GET',
  path: '/api/activities',
  params: GetFeedRequest,
  response: GetFeedResponse,
}
```

Then generate OpenAPI schema from these contracts.

**Action items:**
- Consolidate all API contracts in packages/contracts/
- Add OpenAPI schema generation
- Use contracts to validate requests in API routes (zod or valibot)
- Generate client SDK from contracts (ts-rest, tRPC, or OpenAPI-codegen)

---

### 9. Logging & Observability — Completely Missing

**Current state:** No mention in PRD or architecture.

**Issue:** Production code needs structured logging, error tracking, performance monitoring.

**Recommendation:**

Add `packages/infrastructure/logging/`:

```typescript
// Structured logging
export const logger = {
  info: (msg: string, ctx?: Record<string, any>) => console.log({ level: 'INFO', msg, ...ctx }),
  error: (msg: string, error: Error, ctx?: Record<string, any>) => console.error({ level: 'ERROR', msg, error: error.message, ...ctx }),
  debug: (msg: string, ctx?: Record<string, any>) => console.log({ level: 'DEBUG', msg, ...ctx }),
}

// Usage in application/
export class GetFeedUseCase {
  async execute(query: FeedQuery) {
    logger.info('Getting feed', { filters: query.filters })
    try {
      const result = await this.repository.findMany(query)
      logger.info('Feed retrieved', { count: result.length })
      return result
    } catch (error) {
      logger.error('Failed to get feed', error, { filters: query.filters })
      throw error
    }
  }
}
```

For production:
- Use Winston, Pino, or Bunyan
- Ship logs to centralized service (Datadog, ELK, CloudWatch)
- Add distributed tracing (OpenTelemetry)
- Add error tracking (Sentry)

**Action items:**
- Add logging package
- Add structured logging to all application/ use cases
- Add error tracking integration
- Add performance monitoring (FCP, LCP metrics)

---

### 10. Development Workflow & Local Setup — Vague

**Current state:** Architecture is clear, but no guidance on local development.

**Issue:** Monorepo can be complex for developers; need clear docs.

**Recommendation:**

Add `DEVELOPMENT.md`:

```markdown
# Development Setup

## Prerequisites
- Node 18+
- pnpm 8+
- Docker (for local Postgres, Redis, Elasticsearch)

## Setup
```bash
pnpm install
docker-compose up  # Start local services
pnpm dev            # Start web in watch mode
```

## Debugging
- Debug a specific package: `pnpm --filter @wandr/feed debug`
- Debug web app: `pnpm --filter web debug`
- Use VSCode debugger config

## Running Tests
```bash
pnpm test               # All tests
pnpm --filter @wandr/domain test  # Single package
pnpm test:e2e           # E2E only
```

## Adding a New Package
```bash
# 1. Create package
mkdir -p packages/domain/my-feature/src
# 2. Add package.json
# 3. Configure tsconfig.json paths
# 4. Reference in root tsconfig.json
# 5. Install deps: pnpm --filter @wandr/my-feature add dependency
```

## Monorepo Commands
```bash
pnpm build              # Build all packages in order
pnpm test               # Test all in parallel
pnpm lint               # Lint all
pnpm type-check         # TS check all
```
```

**Action items:**
- Write DEVELOPMENT.md with setup & common tasks
- Add docker-compose.yml for local services
- Add VSCode debugger configs
- Add scripts/ folder for common commands

---

## 📋 Recommended Updates to Existing Docs

### CLAUDE.md v2
Add rules for:
- Error handling across layers
- API contract ownership
- Caching strategy
- Testing per layer
- Logging standards

### STEP_ZERO v2
Include:
- Auth setup (JWT, session)
- Database schema seeding
- Cache setup (Redis)
- Logging setup (structured logs)
- Testing infrastructure (Vitest, testcontainers)

### New: DEVELOPMENT.md
- Local setup guide
- Debugging tips
- Common commands
- Contributing guidelines

### New: TESTING.md
- Test structure per layer
- How to write good tests per layer
- Test data fixtures
- CI test strategy

### New: API.md
- API contract design
- Request/response mapping
- Error responses
- Rate limiting
- Pagination

---

## 🎯 Priority Order

**Week 1 (Foundation):**
1. ✅ Architecture.md (done)
2. Auth & error handling design
3. Testing strategy per layer
4. API contract consolidation

**Week 2 (Production-Ready):**
5. Caching strategy
6. Logging & observability
7. Real-time features (SSE for chat)
8. Database schema docs

**Week 3 (Developer Experience):**
9. Development workflow guide
10. Local setup (docker-compose)
11. Contributing guidelines
12. Architecture decision records (ADRs)

---

## Summary

| Gap | Impact | Effort | Recommendation |
|-----|--------|--------|---|
| Auth | 🔴 Critical | Medium | Design auth layer, middleware, JWT adapter |
| Error handling | 🔴 Critical | Small | Formalize error → HTTP mapping |
| Testing strategy | 🟠 High | Medium | Add test structure per layer |
| API contracts | 🟠 High | Small | Consolidate in packages/contracts/ |
| Caching | 🟠 High | Small | Define cache tiers & TTLs |
| Search architecture | 🟠 High | Medium | Clarify search flow through layers |
| Real-time (Chat) | 🟡 Medium | Medium | Add SSE adapter for streaming |
| Logging | 🟡 Medium | Small | Add structured logging infra |
| Development docs | 🟡 Medium | Small | Write DEVELOPMENT.md, docker-compose |
| Database schema | 🟡 Medium | Small | Document schema design patterns |

**My recommendation:** Start with Auth + Error Handling (Week 1), then Testing & API Contracts. These unblock everything else.

