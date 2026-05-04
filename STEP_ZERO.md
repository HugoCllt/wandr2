# Step Zero: Build the Modular Monolith Skeleton

This document describes how to initialize the Wandr project with the modular monolith architecture defined in `CLAUDE.md`.

**Objective:** After Step Zero, you have:
- A Next.js 14 project with TypeScript and Tailwind
- PostgreSQL + Prisma + PostGIS set up
- Module directory structure scaffolded (Phase 1)
- Shared types and utilities in place
- Development environment ready
- CI/CD pipeline configured

**Duration:** ~4 hours (including waiting for initial builds)

---

## Phase 1 Modules to Scaffold

Based on PRD Phase 1, scaffold these modules:

```
Core Modules:
├── catalog      # Activity Catalog
├── filters      # Filter Engine
├── search       # Smart Search Parser
├── map          # Map Adapter
├── favorites    # Favorites Store
├── detail       # Activity Detail Renderer
├── carousel     # Carousel Controller
└── shared       # Shared types, utilities, constants
```

**Phase 2 & 3 modules are scaffolded but disabled until those phases.**

---

## Step 0.1: Initialize Next.js 14 Project

### 0.1.1 Create Next.js app

```bash
cd /home/user/wandr2
npx create-next-app@14 . \
  --typescript \
  --tailwind \
  --eslint \
  --no-git \
  --no-src-dir \
  --import-alias '@/*'
```

**Options:**
- TypeScript: Yes
- Tailwind CSS: Yes
- ESLint: Yes
- Src directory: No (we'll use custom structure)
- Import alias: Yes, use `@/*`

### 0.1.2 Verify structure

```
/home/user/wandr2/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── public/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
└── ...
```

---

## Step 0.2: Configure TypeScript Strict Mode

### 0.2.1 Update tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // Strict mode - MANDATORY
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    // Module resolution
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## Step 0.3: Install Dependencies

### 0.3.1 Core dependencies

```bash
npm install \
  prisma @prisma/client \
  react-query @tanstack/react-query \
  react-hook-form \
  zod \
  lodash-es \
  uuid \
  mapbox-gl \
  next-auth

npm install -D \
  @types/uuid \
  @types/lodash-es \
  @types/node \
  jest @testing-library/react @testing-library/jest-dom \
  @types/jest \
  ts-jest \
  vitest \
  @vitest/ui
```

### 0.3.2 Verify installations

```bash
npm list prisma react-hook-form zod
```

---

## Step 0.4: Set Up Prisma & Database

### 0.4.1 Initialize Prisma

```bash
npx prisma init
```

This creates:
- `.env.local` (update with your database URL)
- `prisma/schema.prisma`

### 0.4.2 Configure `.env.local`

```env
# Database
DATABASE_URL="postgresql://wandr:wandr@localhost:5432/wandr_dev?schema=public"

# Next.js
NEXT_PUBLIC_MAPBOX_TOKEN="your_mapbox_token_here"

# LLM (for Phase 3)
OPENAI_API_KEY="your_openai_key_here"
```

### 0.4.3 Create initial Prisma schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// User model
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  favorites Favorite[]
  profile   Profile?
}

// Activity model (core for Phase 1)
model Activity {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  category    String   // Phase 1: simple enum string
  images      String[] // JSON array of URLs
  
  location    Location @relation(fields: [locationId], references: [id])
  locationId  String

  price       Float
  dateStart   DateTime
  dateEnd     DateTime?
  bookingUrl  String?
  capacity    Int?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  favorites  Favorite[]
  
  @@index([category])
  @@index([dateStart])
}

// Location model (PostGIS integration later)
model Location {
  id            String   @id @default(cuid())
  address       String
  neighborhood  String
  latitude      Float
  longitude     Float
  
  activities Activity[]
  
  @@index([latitude, longitude])
}

// Favorite model
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityId String
  activity  Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())

  @@unique([userId, activityId])
  @@index([userId])
}

// Profile model (Phase 2+)
model Profile {
  id       String @id @default(cuid())
  userId   String @unique
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  avatar   String?
  vibeLine String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 0.4.4 Create migrations

```bash
npx prisma migrate dev --name init
```

This creates the first migration and syncs your local database.

---

## Step 0.5: Create Directory Structure

### 0.5.1 Scaffold module directories

```bash
# Create modules directory
mkdir -p src/modules

# Phase 1 modules
mkdir -p src/modules/{catalog,filters,search,map,favorites,detail,carousel,shared}

# Phase 2 modules (scaffolded, disabled)
mkdir -p src/modules/{flame,profile}

# Phase 3 modules (scaffolded, disabled)
mkdir -p src/modules/{chat,personalization,recommendations}

# Shared subdirectories
mkdir -p src/modules/shared/{types,utils,constants,errors}

# API routes
mkdir -p app/api/activities app/api/favorites app/api/search

# Components
mkdir -p components/home components/common components/activity-detail

# Lib
mkdir -p lib/services lib/db
```

### 0.5.2 Create test directories

```bash
for module in catalog filters search map favorites detail carousel; do
  mkdir -p src/modules/$module/__tests__
done
```

---

## Step 0.6: Create Shared Module

### 0.6.1 Shared types

Create `src/modules/shared/types.ts`:

```typescript
// UUID branded type
export type UUID = string & { readonly __brand: 'UUID' }
export function createUUID(id: string): UUID {
  return id as UUID
}

// Activity types
export type ActivityCategory = 
  | 'Sports' | 'Dining' | 'Culture' | 'Music' 
  | 'Entertainment' | 'Nightlife' | 'Outdoor'

export type Location = {
  address: string
  neighborhood: string
  latitude: number
  longitude: number
}

export type PriceRange = {
  min: number
  max: number
  currency: string
}

// Activity filter types
export type ActivityFilter = 
  | { type: 'category'; value: ActivityCategory }
  | { type: 'price'; min: number; max: number }
  | { type: 'distance'; max: number }
  | { type: 'date'; start: Date; end: Date }
  | { type: 'indoorOutdoor'; value: 'indoor' | 'outdoor' }
  | { type: 'free'; value: boolean }

// Query types
export type ActivitySort = 'relevance' | 'popularity' | 'price' | 'date'

export type ActivityQuery = {
  filters: ActivityFilter[]
  sort: ActivitySort
  cursor?: string
  limit: number
}
```

### 0.6.2 Shared errors

Create `src/modules/shared/errors.ts`:

```typescript
export class WandrError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'WandrError'
  }
}

export class ValidationError extends WandrError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends WandrError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND')
  }
}
```

### 0.6.3 Shared index

Create `src/modules/shared/index.ts`:

```typescript
export * from './types'
export * from './errors'
```

---

## Step 0.7: Scaffold Phase 1 Modules

### 0.7.1 Catalog Module

Create `src/modules/catalog/types.ts`:

```typescript
import { ActivityQuery, ActivitySort, ActivityFilter } from '@/modules/shared'

export type Activity = {
  id: string
  title: string
  description: string
  category: string
  location: {
    address: string
    neighborhood: string
    lat: number
    lng: number
  }
  price: { min: number; max: number }
  dateStart: Date
  dateEnd?: Date
  bookingUrl?: string
  images: string[]
  capacity?: number
}

export type CatalogQuery = ActivityQuery

export type CatalogQueryResult = {
  activities: Activity[]
  nextCursor?: string
  totalCount: number
}
```

Create `src/modules/catalog/service.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { Activity, CatalogQuery, CatalogQueryResult } from './types'

export class CatalogService {
  constructor(private db: PrismaClient) {}

  async query(q: CatalogQuery): Promise<CatalogQueryResult> {
    // Placeholder: Phase 1 implementation
    const activities = await this.db.activity.findMany({
      take: q.limit,
      skip: q.cursor ? 1 : 0,
    })

    return {
      activities: activities as unknown as Activity[],
      totalCount: activities.length,
    }
  }

  async getById(id: string): Promise<Activity | null> {
    const activity = await this.db.activity.findUnique({
      where: { id },
    })
    return activity as unknown as Activity | null
  }
}
```

Create `src/modules/catalog/index.ts`:

```typescript
export type { Activity, CatalogQuery, CatalogQueryResult } from './types'
export { CatalogService } from './service'
```

### 0.7.2 Repeat for other Phase 1 modules

Create similar scaffolds for:
- `filters/` (FilterService)
- `search/` (SearchService)
- `map/` (MapService)
- `favorites/` (FavoriteService)
- `detail/` (DetailService)
- `carousel/` (CarouselService)

Each module follows the same pattern:
- `types.ts` (types only)
- `service.ts` (business logic)
- `index.ts` (public interface)

---

## Step 0.8: Create Service Factory

Create `lib/services.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import { CatalogService } from '@/modules/catalog'
import { FilterService } from '@/modules/filters'
import { SearchService } from '@/modules/search'
import { FavoriteService } from '@/modules/favorites'
// ... import other services

export type Phase = 'phase1' | 'phase2' | 'phase3'

export interface Services {
  catalog: CatalogService
  filters: FilterService
  search: SearchService
  favorites: FavoriteService
  // Phase 2+
  flame?: any
  profile?: any
  // Phase 3+
  chat?: any
  recommendations?: any
}

export function initializeServices(db: PrismaClient, phase: Phase = 'phase1'): Services {
  // Phase 1: Core modules
  const catalogService = new CatalogService(db)
  const filterService = new FilterService(catalogService)
  const searchService = new SearchService(catalogService)
  const favoriteService = new FavoriteService(db, catalogService)

  const services: Services = {
    catalog: catalogService,
    filters: filterService,
    search: searchService,
    favorites: favoriteService,
  }

  // Phase 2+ modules would be added here
  if (phase >= 'phase2') {
    // services.flame = new FlameService(...)
  }

  return services
}

// Singleton instance
let services: Services | null = null

export function getServices(): Services {
  if (!services) {
    const db = new PrismaClient()
    services = initializeServices(db)
  }
  return services
}
```

---

## Step 0.9: Create Example API Route

Create `app/api/activities/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServices } from '@/lib/services'
import { ValidationError } from '@/modules/shared'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const cursor = searchParams.get('cursor') || undefined

    const services = getServices()
    const result = await services.catalog.query({
      filters: [],
      sort: 'relevance',
      cursor,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Step 0.10: Configure ESLint

Update `.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": "warn",
    "prefer-const": "error"
  }
}
```

---

## Step 0.11: Configure Testing

### 0.11.1 Create vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

### 0.11.2 Create example test

Create `src/modules/catalog/__tests__/service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { CatalogService } from '../service'
import { PrismaClient } from '@prisma/client'

describe('CatalogService', () => {
  let service: CatalogService
  let db: PrismaClient

  beforeEach(() => {
    db = new PrismaClient()
    service = new CatalogService(db)
  })

  it('should query activities', async () => {
    const result = await service.query({
      filters: [],
      sort: 'relevance',
      limit: 10,
    })
    expect(result).toHaveProperty('activities')
    expect(result).toHaveProperty('totalCount')
  })
})
```

---

## Step 0.12: Configure CI/CD

### 0.12.1 Create .github/workflows/test.yml

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: wandr_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/wandr_test
```

### 0.12.2 Add npm scripts to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate"
  }
}
```

---

## Step 0.13: Create Documentation

### 0.13.1 Create MODULE_TEMPLATE.md

This template is used when creating new modules:

```markdown
# [Module Name] Module

## Purpose
[What does this module do?]

## Public Interface
- [Method 1]: [Description]
- [Method 2]: [Description]

## Dependencies
- [Module 1]
- [Module 2]

## Data Models
[Any Prisma models or types specific to this module]

## Design Notes
[Implementation decisions, trade-offs, etc.]

## Testing
[Overview of test strategy for this module]
```

### 0.13.2 Create ARCHITECTURE.md

```markdown
# Wandr Architecture Overview

## Modular Monolith Structure

Wandr follows a modular monolith architecture with the following principles:

1. **Module Independence** — Each module is independently testable
2. **Clear Interfaces** — Modules communicate via typed contracts
3. **No Circular Dependencies** — Modules form a DAG (directed acyclic graph)
4. **Layered Services** — Queries → Services → API Routes

## Module Dependency Graph (Phase 1)

```
catalog ← filters, search, favorites, detail
↑
└── map, carousel (no dependencies)
```

## API Contracts

All API contracts are defined in module `types.ts` files and documented in `CLAUDE.md`.

See PRD_Phase1.md, PRD_Phase2.md, PRD_Phase3.md for full specifications.
```

---

## Step 0.14: Verify the Skeleton

### 0.14.1 Type check

```bash
npm run type-check
```

Expected: No errors

### 0.14.2 Run linter

```bash
npm run lint
```

Expected: No critical errors (warnings OK)

### 0.14.3 Start dev server

```bash
npm run dev
```

Expected: Server running at http://localhost:3000

### 0.14.4 Verify Prisma

```bash
npx prisma studio
```

Expected: Prisma Studio opens, showing your database

---

## Step 0.15: Commit Skeleton

```bash
git add -A
git commit -m "Step Zero: Create modular monolith skeleton

- Initialize Next.js 14 with TypeScript and Tailwind
- Set up Prisma + PostgreSQL schema
- Scaffold Phase 1 module directories (catalog, filters, search, map, favorites, detail, carousel)
- Create shared types and error definitions
- Set up service factory and dependency injection
- Configure ESLint, TypeScript strict mode
- Add Vitest configuration for unit testing
- Create CI/CD pipeline (GitHub Actions)
- Add example API route for activities

All Phase 1 modules have:
- types.ts (public types)
- service.ts (placeholder implementation)
- index.ts (public interface)
- __tests__/ directory

Next: Phase 1 Implementation (see STEP_ONE.md)

https://claude.ai/code/session_01WqRKUKgqhAKTWHeVjoa625"