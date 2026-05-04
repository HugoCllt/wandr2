# Wandr Architecture v1 — Clean Monorepo

**Pattern:** Domain-Driven Design + Clean Architecture + Selective Hexagonal

---

## Work Tree

```
wandr/
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── app/
│   │   │   ├── (home)/page.tsx
│   │   │   ├── sport/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── activities/route.ts
│   │   │   │   ├── search/route.ts
│   │   │   │   ├── chat/route.ts
│   │   │   │   └── favorites/route.ts
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   └── (page compositions, minimal logic)
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   ├── api/                          # (Optional) Separate API if needed
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   └── package.json
│   │
│   └── mobile/                       # (Future) Native mobile app
│
├── packages/
│   │
│   ├── domain/                       # Business logic (pure, no frameworks)
│   │   ├── activities/
│   │   │   ├── src/
│   │   │   │   ├── activity.entity.ts         # Domain model
│   │   │   │   ├── activity.repository.ts     # Port interface
│   │   │   │   ├── activity.errors.ts
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   └── README.md
│   │   │
│   │   ├── feed/
│   │   │   ├── src/
│   │   │   │   ├── feed.entity.ts             # FeedQuery, FeedResult entities
│   │   │   │   ├── feed.repository.ts         # Port: IActivityRepository
│   │   │   │   ├── feed.sorter.ts             # Port: ISorter (pluggable)
│   │   │   │   ├── feed.ranker.ts             # Port: IRanker (pluggable)
│   │   │   │   ├── feed.errors.ts
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   └── README.md
│   │   │
│   │   ├── favorites/
│   │   │   ├── src/
│   │   │   │   ├── favorite.entity.ts
│   │   │   │   ├── favorite.repository.ts     # Port
│   │   │   │   ├── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── personalization/
│   │   │   ├── src/
│   │   │   │   ├── affinity.entity.ts
│   │   │   │   ├── affinity.calculator.ts     # Port: IAffinityCalculator
│   │   │   │   ├── index.ts
│   │   │   └── package.json
│   │   │
│   │   └── chatbot/
│   │       ├── src/
│   │       │   ├── conversation.entity.ts
│   │       │   ├── intent-parser.ts            # Port: IIntentParser
│   │       │   ├── index.ts
│   │       └── package.json
│   │
│   ├── application/                  # Use cases & orchestration
│   │   ├── activities/
│   │   │   ├── src/
│   │   │   │   ├── get-activity.usecase.ts
│   │   │   │   ├── search-activities.usecase.ts
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── feed/
│   │   │   ├── src/
│   │   │   │   ├── get-feed.usecase.ts         # Core feed orchestration
│   │   │   │   │   # Merges: preset + filters + ranking + pagination
│   │   │   │   ├── feed.pipeline.ts            # Filter → Sort → Rank → Paginate
│   │   │   │   ├── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── search/
│   │   │   ├── src/
│   │   │   │   ├── search-activities.usecase.ts
│   │   │   │   ├── intent.parser.ts            # Calls domain port
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── chat/
│   │   │   ├── src/
│   │   │   │   ├── chat-with-activities.usecase.ts
│   │   │   │   ├── index.ts
│   │   │   └── package.json
│   │   │
│   │   └── favorites/
│   │       ├── src/
│   │       │   ├── add-favorite.usecase.ts
│   │       │   ├── list-favorites.usecase.ts
│   │       │   └── index.ts
│   │       └── package.json
│   │
│   ├── infrastructure/                # External adapters (Hexagonal)
│   │   ├── database/
│   │   │   ├── src/
│   │   │   │   ├── prisma/
│   │   │   │   │   └── schema.prisma
│   │   │   │   ├── activity.repository.ts      # Implements IActivityRepository
│   │   │   │   ├── favorite.repository.ts      # Implements IFavoriteRepository
│   │   │   │   ├── client.ts                   # PrismaClient factory
│   │   │   │   └── index.ts
│   │   │   ├── package.json
│   │   │   └── README.md
│   │   │
│   │   ├── search/
│   │   │   ├── src/
│   │   │   │   ├── elasticsearch.adapter.ts    # Implements ISearchProvider
│   │   │   │   ├── meilisearch.adapter.ts
│   │   │   │   ├── naive.adapter.ts            # Fallback parser
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── map/
│   │   │   ├── src/
│   │   │   │   ├── mapbox.adapter.ts           # Implements IMapProvider
│   │   │   │   ├── google-maps.adapter.ts
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   │
│   │   ├── llm/
│   │   │   ├── src/
│   │   │   │   ├── openai.adapter.ts           # Implements ILLMProvider
│   │   │   │   ├── anthropic.adapter.ts
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   │
│   │   └── cache/
│   │       ├── src/
│   │       │   ├── redis.adapter.ts            # Implements ICache
│   │       │   ├── memory.adapter.ts
│   │       │   └── index.ts
│   │       └── package.json
│   │
│   ├── contracts/                    # Transport & boundary types
│   │   ├── src/
│   │   │   ├── activity.contract.ts            # ActivityDTO, ActivitySummaryDTO
│   │   │   ├── feed.contract.ts                # FeedQueryDTO, FeedResultDTO
│   │   │   ├── page.contract.ts                # PagePresetDTO
│   │   │   ├── chatbot.contract.ts             # ChatMessageDTO, IntentDTO
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── presets/                      # Page configurations
│   │   ├── src/
│   │   │   ├── home.preset.ts
│   │   │   │   # {
│   │   │   │   #   filters: ['price', 'distance', 'date', 'category'],
│   │   │   │   #   defaultSort: 'relevance',
│   │   │   │   #   sections: { carousel: true, map: true, grid: true },
│   │   │   │   # }
│   │   │   │
│   │   │   ├── sport.preset.ts
│   │   │   ├── romantic.preset.ts
│   │   │   ├── food.preset.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── ui/                           # React components (UI-only)
│       ├── src/
│       │   ├── activity-card/
│       │   │   ├── ActivityCard.tsx            # Accepts Activity DTO, renders
│       │   │   ├── activity-card.stories.tsx
│       │   │   └── package.json
│       │   │
│       │   ├── filter-bar/
│       │   │   ├── FilterBar.tsx
│       │   │   └── package.json
│       │   │
│       │   ├── feed-header/
│       │   │   ├── FeedHeader.tsx
│       │   │   └── package.json
│       │   │
│       │   └── sections/
│       │       ├── hero-carousel/
│       │       ├── discovery-grid/
│       │       ├── map-section/
│       │       └── package.json
│       │
│       ├── package.json
│       └── tailwind.config.js
│
├── turbo.json
├── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
└── .github/workflows/
    ├── test.yml
    ├── lint.yml
    └── build.yml
```

---

## Layer Responsibilities

### **Domain** (`packages/domain/*`)
**Purpose:** Business logic, pure, no frameworks, no side effects

**Contains:**
- Entities (Activity, Feed, Favorite, Conversation)
- Value objects (Location, PriceRange)
- Port interfaces (IActivityRepository, ISearchProvider, ILLMProvider)
- Business rules & validation
- Errors (ActivityNotFoundError, etc.)

**Does NOT contain:**
- Database calls (Prisma)
- HTTP requests
- React components
- Framework-specific code

**Example:** `packages/domain/activities/activity.entity.ts`
```typescript
export class Activity {
  constructor(
    readonly id: UUID,
    readonly title: string,
    readonly category: ActivityCategory,
    readonly location: Location,
    readonly price: PriceRange,
  ) {}

  isAvailable(): boolean {
    // Business rule: pure function
    return true
  }
}

// Port interface (domain knows about this)
export interface IActivityRepository {
  findById(id: UUID): Promise<Activity>
  findMany(query: FeedQuery): Promise<Activity[]>
}
```

---

### **Application** (`packages/application/*`)
**Purpose:** Use cases & orchestration, thin layer, delegates to domain & infrastructure

**Contains:**
- Use case classes (GetActivityUseCase, GetFeedUseCase, ChatWithActivitiesUseCase)
- Orchestration logic (feed pipeline, service composition)
- Error handling & mapping
- Dependency injection setup

**Does NOT contain:**
- Business logic (belongs in domain)
- Database/HTTP details (belongs in infrastructure)
- UI logic (belongs in web/components)

**Example:** `packages/application/feed/get-feed.usecase.ts`
```typescript
export class GetFeedUseCase {
  constructor(
    private repository: IActivityRepository,  // Injected port
    private sorter: ISorter,                  // Injected port
    private ranker: IRanker,                  // Injected port
  ) {}

  async execute(query: FeedQuery): Promise<FeedResult> {
    // 1. Fetch activities
    const activities = await this.repository.findMany(query.filters)
    
    // 2. Apply ranking
    const ranked = await this.ranker.rank(activities, query.context)
    
    // 3. Paginate
    return this.paginate(ranked, query.cursor, query.limit)
  }
}
```

---

### **Infrastructure** (`packages/infrastructure/*`)
**Purpose:** Implementations of ports, external dependencies, hexagonal adapters

**Contains:**
- Database adapters (Prisma repositories)
- Search adapters (Elasticsearch, Meilisearch)
- Map adapters (Mapbox, Google Maps)
- LLM adapters (OpenAI, Anthropic)
- Cache adapters (Redis, in-memory)

**Does NOT contain:**
- Business logic
- Domain entities directly (converts to/from them)

**Example:** `packages/infrastructure/database/activity.repository.ts`
```typescript
export class PrismaActivityRepository implements IActivityRepository {
  constructor(private db: PrismaClient) {}

  async findMany(query: FeedQuery): Promise<Activity[]> {
    const records = await this.db.activity.findMany({
      where: this.buildWhere(query.filters),
      orderBy: this.buildOrderBy(query.sort),
      take: query.limit,
    })
    
    // Convert DB record → Domain entity
    return records.map(r => new Activity(r.id, r.title, ...))
  }
}
```

---

### **Contracts** (`packages/contracts/*`)
**Purpose:** Shared types at boundaries (API, UI, external systems)

**Contains:**
- DTOs (ActivityDTO, FeedQueryDTO, ChatMessageDTO)
- View models (ActivityCardVM for UI)
- API request/response shapes
- Enums shared across layers

**Does NOT contain:**
- Business logic
- Entity classes (belongs in domain)

**Principle:** Separate shapes by purpose
- Domain model (Activity entity)
- Transport DTO (ActivityDTO for API)
- UI view model (ActivityCardVM for React)

**Example:** `packages/contracts/activity.contract.ts`
```typescript
// For API transport
export type ActivityDTO = {
  id: string
  title: string
  price: { min: number; max: number }
  location: string
  imageUrl: string
}

// For UI rendering
export type ActivityCardVM = {
  id: string
  title: string
  price: string  // Formatted
  distance: string
  isFavorited: boolean
}
```

---

### **Presets** (`packages/presets/*`)
**Purpose:** Configuration per page, not code

**Contains:**
- Page preset objects (HOME_PRESET, SPORT_PRESET, etc.)
- Filter definitions
- Section visibility
- Default sorting & ranking strategies
- Layout configuration

**Does NOT contain:**
- Business logic
- UI components
- Data fetching

**Example:** `packages/presets/home.preset.ts`
```typescript
export const HOME_PRESET: PagePreset = {
  name: 'home',
  feed: {
    filters: ['price', 'distance', 'date', 'category', 'indoorOutdoor'],
    defaultSort: 'relevance',
    enableInfiniteScroll: true,
  },
  sections: {
    carousel: { enabled: true, count: 5 },
    mapSection: { enabled: true, maxPins: 50 },
    discoveryGrid: { enabled: true },
  },
  ranking: {
    strategies: ['trending', 'personalization'],
    weights: { trending: 0.4, personalization: 0.6 },
  },
}
```

---

### **UI** (`packages/ui/*`)
**Purpose:** React components, presentation only

**Contains:**
- Presentational components (ActivityCard, FilterBar, etc.)
- Component stories (Storybook)
- Styling (Tailwind, CSS modules)
- Props interfaces matching DTOs

**Does NOT contain:**
- Data fetching
- Business logic
- Hooks with side effects (those go in apps/web)

**Example:** `packages/ui/activity-card/ActivityCard.tsx`
```typescript
interface Props {
  activity: ActivityDTO  // Contract type, not domain entity
  onFavorite?: () => void
}

export function ActivityCard({ activity, onFavorite }: Props) {
  return (
    <div>
      <h2>{activity.title}</h2>
      <p>${activity.price.min}</p>
      <button onClick={onFavorite}>Save</button>
    </div>
  )
}
```

---

### **Web** (`apps/web/*`)
**Purpose:** Next.js application, page composition, hooks

**Contains:**
- Page components (Home, Sport, Chat, Profile)
- API routes
- Custom hooks (useHomeFeed, useChatWithActivities)
- Page layouts
- Global styles

**Does NOT contain:**
- Business logic (belongs in domain/application)
- Infrastructure details (belongs in packages/infrastructure)

**Dependency direction:** `web → application/contracts → domain → infrastructure`

**Example:** `apps/web/app/(home)/page.tsx`
```typescript
import { GetFeedUseCase } from '@wandr/application/feed'
import { HOME_PRESET } from '@wandr/presets'
import { useHomeFeed } from './hooks/use-home-feed'

export default function HomePage() {
  const { activities, loading } = useHomeFeed(HOME_PRESET)

  return (
    <div>
      <ActivityCarousel activities={activities.slice(0, 5)} />
      <DiscoveryGrid activities={activities} />
    </div>
  )
}
```

**Hook example:** `apps/web/hooks/use-home-feed.ts`
```typescript
export function useHomeFeed(preset: PagePreset) {
  const [activities, setActivities] = useState<ActivityDTO[]>([])

  useEffect(() => {
    // Call application use case
    getFeedUseCase
      .execute({
        filters: parsePresetFilters(preset),
        sort: preset.feed.defaultSort,
        limit: preset.feed.defaultLimit,
      })
      .then(result => setActivities(result.items))
  }, [preset])

  return { activities, loading: false }
}
```

---

## Dependency Rules

### ✅ Allowed
```
web/ → application/ → domain/
web/ → contracts/
web/ → presets/
web/ → ui/
application/ → domain/
infrastructure/ → domain/  (implements ports)
domain/ → nothing
```

### ❌ Forbidden
```
domain/ → application/
domain/ → infrastructure/
domain/ → web/
web/ → infrastructure/ (directly)
web/ → domain/ (directly)
application/ → web/
```

---

## Hexagonal Pattern (Selective)

**Apply hexagonal (ports + adapters) only to:**
- Database (packages/infrastructure/database)
- Search (packages/infrastructure/search)
- Map (packages/infrastructure/map)
- LLM (packages/infrastructure/llm)
- Cache (packages/infrastructure/cache)

**Skip hexagonal for:**
- Filters, sorting, ranking (domain/application logic)
- Favorites, activities, feed (not external dependencies)
- UI components (too simple)

**Port definition** (in domain):
```typescript
export interface IActivityRepository {
  findById(id: UUID): Promise<Activity>
  findMany(query: FeedQuery): Promise<Activity[]>
}
```

**Adapter implementation** (in infrastructure):
```typescript
export class PrismaActivityRepository implements IActivityRepository {
  // Implementation
}
```

---

## Package.json Workspace Setup

```json
{
  "workspaces": [
    "apps/*",
    "packages/domain/*",
    "packages/application/*",
    "packages/infrastructure/*",
    "packages/contracts",
    "packages/presets",
    "packages/ui"
  ]
}
```

---

## Monorepo Tooling

**Build & dependency management:**
- **Turborepo** for task orchestration & caching
- **pnpm** for fast, efficient package management
- **TypeScript** for all packages

**CI/CD:**
- Run tests in parallel across packages
- Build order: infrastructure → domain → application → apps
- Cache build artifacts

---

## Phase Activation

**Phase 1 (MVP):**
- domain/activities, domain/feed, domain/favorites
- application/activities, application/feed
- infrastructure/database, infrastructure/search
- apps/web (Home page only)

**Phase 2:**
- domain/personalization
- application/search
- packages/presets (expand to sport, romantic, food)
- apps/web (Sport page)

**Phase 3:**
- domain/chatbot
- application/chat
- infrastructure/llm
- apps/web (Chat page)

---

## Summary

| Layer | Purpose | Examples |
|-------|---------|----------|
| **Domain** | Business rules | Activity, Feed entities; ports |
| **Application** | Use cases | GetFeedUseCase, SearchActivitiesUseCase |
| **Infrastructure** | External adapters | PrismaActivityRepository, MapboxAdapter |
| **Contracts** | Boundary types | ActivityDTO, FeedQueryDTO |
| **Presets** | Configuration | HOME_PRESET, SPORT_PRESET |
| **UI** | React components | ActivityCard, FilterBar |
| **Web** | Pages & hooks | HomePage, useHomeFeed |

**Guiding principle:** Domain knows business. Application orchestrates. Infrastructure adapts. UI renders.

---

**Last Updated:** 2026-05-04  
**Status:** Production-Ready v1
