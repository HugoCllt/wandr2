# Wandr Architecture Design — Monorepo + Modular Monolith + Feed Engine Central

**Architecture Pattern:**
- **Monorepo:** Turborepo for managing multiple packages
- **Modular Monolith:** Clear module boundaries within packages
- **Feed Engine Central:** Reusable, pluggable feed system used by all pages
- **Presets per Page:** Configuration-driven per-page behavior
- **Shared Contracts:** Central interface definitions
- **Hexagonal (Selective):** Ports & adapters only for modules with external dependencies (Search, Map, Chat, LLM)

---

## Proposed Work Tree

```
wandr/
│
├── 📦 packages/
│   │
│   ├─ 🔧 core/                                # Core, non-feature packages
│   │  │
│   │  ├─ feed-engine/
│   │  │  ├─ src/
│   │  │  │  ├─ types.ts                       # Feed query, filter, sorter types
│   │  │  │  ├─ feed.service.ts                # Core feed logic (pluggable)
│   │  │  │  ├─ pipeline.ts                    # Filter → Sort → Rank → Paginate
│   │  │  │  ├─ index.ts                       # Public interface
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ shared-contracts/                    # Shared types & interfaces
│   │  │  ├─ src/
│   │  │  │  ├─ index.ts
│   │  │  │  ├─ activity.contract.ts           # Activity type (single source of truth)
│   │  │  │  ├─ feed.contract.ts               # Feed query/result contracts
│   │  │  │  ├─ page.contract.ts               # Page preset contracts
│   │  │  │  ├─ errors.ts                      # Shared error types
│   │  │  │  └─ events.ts                      # Shared event types (optional: event-driven)
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ database/
│   │  │  ├─ src/
│   │  │  │  ├─ prisma/
│   │  │  │  │  └─ schema.prisma               # Single source of truth for DB
│   │  │  │  ├─ migrations/
│   │  │  │  ├─ client.ts                      # PrismaClient singleton
│   │  │  │  └─ index.ts
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ logger/
│   │  │  ├─ src/
│   │  │  │  └─ logger.ts
│   │  │  └─ package.json
│   │  │
│   │  └─ config/
│   │     ├─ src/
│   │     │  ├─ index.ts
│   │     │  └─ constants.ts
│   │     └─ package.json
│   │
│   ├─ 📚 modules/                             # Feature modules (modular monolith)
│   │  │
│   │  ├─ catalog/
│   │  │  ├─ src/
│   │  │  │  ├─ ports/                         # Hexagonal: Ports (interfaces)
│   │  │  │  │  ├─ activity-repository.port.ts
│   │  │  │  │  └─ cache.port.ts
│   │  │  │  ├─ adapters/                      # Hexagonal: Adapters (implementations)
│   │  │  │  │  ├─ prisma-activity.adapter.ts
│   │  │  │  │  └─ redis-cache.adapter.ts
│   │  │  │  ├─ services/
│   │  │  │  │  └─ catalog.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ errors.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ filters/
│   │  │  ├─ src/
│   │  │  │  ├─ filter.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ search/
│   │  │  ├─ src/
│   │  │  │  ├─ ports/                         # Hexagonal: Search provider abstraction
│   │  │  │  │  └─ search-provider.port.ts
│   │  │  │  ├─ adapters/                      # Implementations: Elasticsearch, Meilisearch, etc.
│   │  │  │  │  ├─ elasticsearch.adapter.ts
│   │  │  │  │  └─ naive-parser.adapter.ts
│   │  │  │  ├─ services/
│   │  │  │  │  └─ search.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ map/
│   │  │  ├─ src/
│   │  │  │  ├─ ports/                         # Hexagonal: Map provider abstraction
│   │  │  │  │  └─ map-provider.port.ts
│   │  │  │  ├─ adapters/                      # Implementations: Mapbox, Google Maps
│   │  │  │  │  ├─ mapbox.adapter.ts
│   │  │  │  │  └─ google-maps.adapter.ts
│   │  │  │  ├─ services/
│   │  │  │  │  └─ map.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ favorites/
│   │  │  ├─ src/
│   │  │  │  ├─ services/
│   │  │  │  │  └─ favorite.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ detail/
│   │  │  ├─ src/
│   │  │  │  ├─ services/
│   │  │  │  │  └─ detail.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ carousel/
│   │  │  ├─ src/
│   │  │  │  ├─ carousel.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ flame/ (Phase 2)
│   │  │  ├─ src/
│   │  │  │  ├─ flame.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ profile/ (Phase 2)
│   │  │  ├─ src/
│   │  │  │  ├─ services/
│   │  │  │  │  └─ profile.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ chat/ (Phase 3)
│   │  │  ├─ src/
│   │  │  │  ├─ ports/                         # Hexagonal: LLM provider abstraction
│   │  │  │  │  └─ llm-provider.port.ts
│   │  │  │  ├─ adapters/                      # Implementations: OpenAI, Anthropic
│   │  │  │  │  ├─ openai.adapter.ts
│   │  │  │  │  └─ anthropic.adapter.ts
│   │  │  │  ├─ services/
│   │  │  │  │  └─ chat.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ personalization/ (Phase 3)
│   │  │  ├─ src/
│   │  │  │  ├─ ports/                         # Hexagonal: ML provider abstraction
│   │  │  │  │  └─ ml-provider.port.ts
│   │  │  │  ├─ adapters/                      # Implementations: TensorFlow, etc.
│   │  │  │  │  └─ local-ml.adapter.ts
│   │  │  │  ├─ services/
│   │  │  │  │  └─ personalization.service.ts
│   │  │  │  ├─ types.ts
│   │  │  │  ├─ index.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  └─ recommendations/ (Phase 3)
│   │     ├─ src/
│   │     │  ├─ services/
│   │     │  │  └─ recommendation.service.ts
│   │     │  ├─ types.ts
│   │     │  ├─ index.ts
│   │     │  └─ __tests__/
│   │     ├─ package.json
│   │     └─ README.md
│   │
│   ├─ 🖥️ pages/                               # Page packages with preset configs
│   │  │
│   │  ├─ home/
│   │  │  ├─ src/
│   │  │  │  ├─ presets/
│   │  │  │  │  └─ home.preset.ts              # Home page configuration
│   │  │  │  │     # Includes: default filters, sort, display options
│   │  │  │  ├─ components/
│   │  │  │  │  ├─ hero-carousel.tsx
│   │  │  │  │  ├─ discovery-feed.tsx
│   │  │  │  │  ├─ map-section.tsx
│   │  │  │  │  └─ sidebar.tsx
│   │  │  │  ├─ hooks/
│   │  │  │  │  └─ use-home-feed.ts
│   │  │  │  ├─ page.tsx                       # Next.js page component
│   │  │  │  ├─ types.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ sport/
│   │  │  ├─ src/
│   │  │  │  ├─ presets/
│   │  │  │  │  └─ sport.preset.ts             # Sport page configuration
│   │  │  │  ├─ components/
│   │  │  │  │  ├─ sport-feed.tsx
│   │  │  │  │  ├─ sport-filters.tsx
│   │  │  │  │  └─ sport-sections.tsx
│   │  │  │  ├─ hooks/
│   │  │  │  │  └─ use-sport-feed.ts
│   │  │  │  ├─ page.tsx
│   │  │  │  ├─ types.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  ├─ chat/
│   │  │  ├─ src/
│   │  │  │  ├─ presets/
│   │  │  │  │  └─ chat.preset.ts              # Chat page configuration
│   │  │  │  ├─ components/
│   │  │  │  │  ├─ chat-interface.tsx
│   │  │  │  │  ├─ prompt-suggestions.tsx
│   │  │  │  │  └─ response-cards.tsx
│   │  │  │  ├─ hooks/
│   │  │  │  │  └─ use-chat.ts
│   │  │  │  ├─ page.tsx
│   │  │  │  ├─ types.ts
│   │  │  │  └─ __tests__/
│   │  │  ├─ package.json
│   │  │  └─ README.md
│   │  │
│   │  └─ profile/
│   │     ├─ src/
│   │     │  ├─ presets/
│   │     │  │  └─ profile.preset.ts           # Profile page configuration
│   │     │  ├─ components/
│   │     │  │  ├─ profile-header.tsx
│   │     │  │  ├─ stats-section.tsx
│   │     │  │  └─ quick-actions.tsx
│   │     │  ├─ hooks/
│   │     │  │  └─ use-profile.ts
│   │     │  ├─ page.tsx
│   │     │  ├─ types.ts
│   │     │  └─ __tests__/
│   │     ├─ package.json
│   │     └─ README.md
│   │
│   ├─ 🌐 web/
│   │  ├─ app/                                 # Next.js App Router
│   │  │  ├─ (home)/
│   │  │  │  └─ page.tsx                       # Routes to home package
│   │  │  ├─ sport/
│   │  │  │  └─ page.tsx
│   │  │  ├─ chat/
│   │  │  │  └─ page.tsx
│   │  │  ├─ profile/
│   │  │  │  └─ page.tsx
│   │  │  ├─ api/
│   │  │  │  ├─ activities/
│   │  │  │  │  ├─ route.ts
│   │  │  │  │  └─ [...slug].ts
│   │  │  │  ├─ favorites/
│   │  │  │  │  └─ route.ts
│   │  │  │  ├─ search/
│   │  │  │  │  └─ route.ts
│   │  │  │  └─ chat/
│   │  │  │     └─ route.ts
│   │  │  ├─ layout.tsx
│   │  │  └─ globals.css
│   │  │
│   │  ├─ components/
│   │  │  ├─ layout/
│   │  │  │  ├─ navbar.tsx
│   │  │  │  ├─ footer.tsx
│   │  │  │  └─ layout.tsx
│   │  │  ├─ common/
│   │  │  │  ├─ activity-card.tsx
│   │  │  │  ├─ loading-skeleton.tsx
│   │  │  │  └─ error-boundary.tsx
│   │  │  └─ ui/                               # Shadcn/ui or custom design system
│   │  │     ├─ button.tsx
│   │  │     ├─ input.tsx
│   │  │     └─ ...
│   │  │
│   │  ├─ lib/
│   │  │  ├─ api-client.ts
│   │  │  ├─ hooks.ts
│   │  │  └─ utils.ts
│   │  │
│   │  ├─ package.json
│   │  ├─ tsconfig.json
│   │  ├─ next.config.js
│   │  ├─ tailwind.config.js
│   │  └─ README.md
│   │
│   └─ 🔌 api/ (Optional separate package for API logic)
│      ├─ src/
│      │  ├─ routes/
│      │  │  ├─ activities.route.ts
│      │  │  ├─ favorites.route.ts
│      │  │  ├─ search.route.ts
│      │  │  └─ chat.route.ts
│      │  ├─ middleware/
│      │  │  ├─ error-handler.ts
│      │  │  ├─ auth.ts
│      │  │  └─ logging.ts
│      │  └─ index.ts
│      ├─ package.json
│      └─ README.md
│
├─ 📋 Root Files
│  ├─ turbo.json                               # Turborepo config
│  ├─ tsconfig.json                           # Root TypeScript config
│  ├─ package.json                            # Root package.json (workspaces)
│  ├─ pnpm-workspace.yaml                     # pnpm workspaces (alternative to npm workspaces)
│  ├─ .github/
│  │  └─ workflows/
│  │     ├─ test.yml
│  │     ├─ lint.yml
│  │     └─ build.yml
│  ├─ CLAUDE.md                               # Architecture rules (updated)
│  ├─ STEP_ZERO.md                            # Setup guide (updated)
│  ├─ PRD_Phase1.md
│  ├─ PRD_Phase2.md
│  ├─ PRD_Phase3.md
│  ├─ design.md
│  ├─ spec.md
│  └─ ARCHITECTURE.md                         # Monorepo + modular structure guide
│
└─ 📖 Documentation
   ├─ docs/
   │  ├─ architecture/
   │  │  ├─ monorepo.md                       # Monorepo structure & patterns
   │  │  ├─ feed-engine.md                    # Feed engine architecture
   │  │  ├─ presets.md                        # Preset system
   │  │  ├─ hexagonal.md                      # Hexagonal pattern (selective)
   │  │  └─ module-contracts.md               # Shared contracts
   │  ├─ guides/
   │  │  ├─ adding-a-module.md
   │  │  ├─ adding-a-page.md
   │  │  └─ adding-external-adapter.md
   │  └─ examples/
   │     ├─ feed-usage.md
   │     └─ preset-usage.md
```

---

## Key Architecture Decisions

### 1. Feed Engine Central

**File:** `packages/core/feed-engine/src/feed.service.ts`

```typescript
// Core feed service used by ALL pages
export class FeedService {
  // Generic pipeline: filters → sorters → rankers → pagination
  async getFeed(query: FeedQuery): Promise<FeedResult> {
    // 1. Apply filters
    const filtered = await this.applyFilters(query.filters)
    
    // 2. Apply sorters (pluggable)
    const sorted = await this.applysorters(filtered, query.sorters)
    
    // 3. Apply rankers (ML, trends, personalization)
    const ranked = await this.applyRankers(sorted, query.rankers)
    
    // 4. Paginate
    return this.paginate(ranked, query.cursor, query.limit)
  }
}
```

**Usage in pages:**
- Home page uses Feed Engine with default preset
- Sport page uses Feed Engine with sports-specific preset
- Chat page uses Feed Engine with chat-generated query
- Profile page uses Feed Engine for "history" tab

---

### 2. Presets per Page

**File:** `packages/pages/home/src/presets/home.preset.ts`

```typescript
// Home page preset configuration
export const HOME_PRESET: PagePreset = {
  name: 'home',
  description: 'Home page discovery',
  
  feed: {
    defaultFilters: [],
    defaultSort: 'relevance',
    defaultLimit: 20,
    enableInfiniteScroll: true,
  },
  
  sections: {
    carousel: {
      enabled: true,
      count: 5,
      sort: 'popularity',
    },
    mapSection: {
      enabled: true,
      maxPins: 50,
    },
    discoveryGrid: {
      enabled: true,
      cardVariants: ['hero-horizontal', 'standard-vertical', 'compact-row'],
    },
  },
  
  filters: {
    enabled: true,
    position: 'sticky-left',
    categories: ['price', 'distance', 'date', 'indoorOutdoor', 'category'],
  },
}
```

---

### 3. Shared Contracts

**File:** `packages/core/shared-contracts/src/feed.contract.ts`

```typescript
// Single source of truth for feed contracts
export interface FeedQuery {
  filters: Filter[]
  sorters: Sorter[]
  rankers?: Ranker[]
  cursor?: string
  limit: number
}

export interface FeedResult {
  items: Activity[]
  nextCursor?: string
  totalCount: number
}

export interface Sorter {
  type: 'relevance' | 'popularity' | 'price' | 'date'
  direction: 'asc' | 'desc'
}

export interface Ranker {
  type: 'trending' | 'personalized' | 'recency'
  weight: number
}
```

---

### 4. Hexagonal Architecture (Selective)

**Only in modules with external dependencies:**

#### Map Module (Mapbox/Google Maps)

```typescript
// ports/map-provider.port.ts — Interface
export interface IMapProvider {
  render(container: string, pins: Pin[]): Promise<void>
  onPinClick(handler: (pinId: string) => void): void
  cluster(pins: Pin[], zoomLevel: number): ClusteredPin[]
}

// adapters/mapbox.adapter.ts — Implementation
export class MapboxAdapter implements IMapProvider {
  // Concrete Mapbox implementation
}

// adapters/google-maps.adapter.ts — Implementation
export class GoogleMapsAdapter implements IMapProvider {
  // Concrete Google Maps implementation
}
```

#### Chat Module (OpenAI/Anthropic)

```typescript
// ports/llm-provider.port.ts — Interface
export interface ILLMProvider {
  parseIntent(query: string): Promise<Intent>
  generateResponse(intent: Intent): Promise<string>
}

// adapters/openai.adapter.ts — Implementation
export class OpenAIAdapter implements ILLMProvider {
  // OpenAI implementation
}

// adapters/anthropic.adapter.ts — Implementation
export class AnthropicAdapter implements ILLMProvider {
  // Anthropic implementation
}
```

**Simple modules (no external deps) skip hexagonal:**
- Filters, Carousel, Favorites, Detail — just service + types

---

### 5. Monorepo Benefits

**Workspace structure** (in `package.json`):

```json
{
  "workspaces": [
    "packages/core/*",
    "packages/modules/*",
    "packages/pages/*",
    "packages/web",
    "packages/api"
  ]
}
```

**Benefits:**
- Single `node_modules` (faster installs, less disk)
- Cross-package imports via `@wandr/catalog`, `@wandr/filters`, etc.
- Shared TypeScript config
- Single CI/CD pipeline via Turborepo caching
- Easy to extract a package to separate repo later

---

## Data Flow Example (Home Page)

```
Home Page Component
  ↓
home.preset.ts (config)
  ↓
FeedService (packages/core/feed-engine)
  ↓
Apply Filters (FilterService)
  ↓
Apply Sorters (CatalogService scoring)
  ↓
Apply Rankers (FlameService, PersonalizationService)
  ↓
Paginate
  ↓
Activity[] returned to component
  ↓
Render via activity-card.tsx
```

---

## Module Dependencies (DAG — No Circles)

```
shared-contracts (no deps)
  ↑
feed-engine (depends on shared-contracts)
  ↑
catalog (depends on shared-contracts)
↑
filters, search, map, etc. (depend on catalog, shared-contracts)
  ↑
pages (depend on modules + feed-engine)
  ↑
web (depends on pages)
```

---

## Key Files to Create/Update

1. **turbo.json** — Define build tasks, caching rules
2. **CLAUDE.md** — Update with monorepo + hexagonal rules
3. **STEP_ZERO.md** — Update with monorepo scaffolding steps
4. **ARCHITECTURE.md** — Detailed monorepo + feed engine design
5. **packages/core/feed-engine/README.md** — How to use the feed engine
6. **packages/pages/*/presets/*.preset.ts** — Page configurations

---

## Summary of Changes from Original

| Aspect | Original | New |
|--------|----------|-----|
| **Structure** | Single src/modules | Monorepo with packages/ |
| **Package Manager** | npm only | Turborepo + pnpm/npm |
| **Feed Logic** | Scattered in modules | Centralized FeedService |
| **Page Config** | Hardcoded in components | Preset system per page |
| **Contracts** | Per-module types | Shared contracts package |
| **External Deps** | Basic service pattern | Hexagonal (ports/adapters) in key modules |

---

## What This Enables

✅ **Scalability** — Easy to add new pages with new presets  
✅ **Reusability** — Feed engine used everywhere  
✅ **Testability** — Each package independently testable  
✅ **Swappability** — Drop in different LLM/Map providers via adapters  
✅ **Configuration-Driven** — Pages are mostly config + UI  
✅ **Team Autonomy** — Teams own packages, clear boundaries  

---

**Ready for feedback before implementing?**
