# Step Zero: Initialize Monorepo + Clean Architecture

**Objective:** Production-ready monorepo with domain/application/infrastructure layers, Phase 1 packages scaffolded, zero to `pnpm dev` in ~2 hours.

---

## Prerequisites

- Node 18+
- pnpm 8+
- Docker (for Postgres, Redis)

---

## 0.1 — Initialize Root

```bash
cd /home/user/wandr2

# Create root package.json with workspaces
cat > package.json << 'EOF'
{
  "name": "wandr",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@8.0.0",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:setup": "pnpm --filter @wandr/database migrate:dev"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  },
  "pnpm": {
    "overrides": {
      "typescript": "^5.0.0"
    }
  },
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
EOF

# Create root tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "baseUrl": ".",
    "paths": {
      "@wandr/domain/*": ["packages/domain/*/src"],
      "@wandr/application/*": ["packages/application/*/src"],
      "@wandr/infrastructure/*": ["packages/infrastructure/*/src"],
      "@wandr/contracts": ["packages/contracts/src"],
      "@wandr/presets": ["packages/presets/src"],
      "@wandr/ui": ["packages/ui/src"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["**/node_modules", "**/dist"]
}
EOF

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "globalDependencies": ["tsconfig.json"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "outputs": ["dist/**"],
      "cache": true,
      "dependsOn": ["^build"]
    },
    "test": {
      "cache": false,
      "dependsOn": ["^build"]
    },
    "lint": {
      "cache": true
    },
    "type-check": {
      "cache": true
    }
  }
}
EOF
```

---

## 0.2 — Create Monorepo Structure

```bash
# Directories
mkdir -p apps/web apps/api
mkdir -p packages/domain/{activities,feed,favorites,personalization,chatbot}
mkdir -p packages/application/{activities,feed,search,chat,favorites}
mkdir -p packages/infrastructure/{database,search,map,llm,cache}
mkdir -p packages/contracts packages/presets packages/ui
```

---

## 0.3 — Initialize Database Package

```bash
mkdir -p packages/infrastructure/database/{src,prisma}

cat > packages/infrastructure/database/package.json << 'EOF'
{
  "name": "@wandr/database",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "generate": "prisma generate",
    "seed": "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
EOF

cat > packages/infrastructure/database/prisma/schema.prisma << 'EOF'
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id    String  @id @default(cuid())
  email String  @unique
  name  String?
  
  favorites Favorite[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Activity {
  id          String  @id @default(cuid())
  title       String
  description String  @db.Text
  category    String
  price       Float
  
  locationId  String
  location    Location @relation(fields: [locationId], references: [id])
  
  dateStart   DateTime
  dateEnd     DateTime?
  bookingUrl  String?
  capacity    Int?
  
  images      String[]
  
  viewCount   Int @default(0)
  saveCount   Int @default(0)
  
  favorites  Favorite[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([category])
  @@index([dateStart])
}

model Location {
  id           String  @id @default(cuid())
  address      String
  neighborhood String
  latitude     Float
  longitude    Float
  
  activities Activity[]
  
  @@index([latitude, longitude])
}

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
EOF

cat > packages/infrastructure/database/src/client.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

let client: PrismaClient

export function getClient(): PrismaClient {
  if (!client) {
    client = new PrismaClient()
  }
  return client
}
EOF

cat > packages/infrastructure/database/src/index.ts << 'EOF'
export { getClient } from './client'
EOF
```

---

## 0.4 — Initialize Domain Packages (Phase 1)

```bash
# activities domain
cat > packages/domain/activities/package.json << 'EOF'
{
  "name": "@wandr/domain-activities",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "test": "vitest",
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^0.34.0"
  }
}
EOF

cat > packages/domain/activities/src/activity.entity.ts << 'EOF'
export type UUID = string & { readonly __brand: 'UUID' }

export class Activity {
  constructor(
    readonly id: UUID,
    readonly title: string,
    readonly category: string,
    readonly price: number,
  ) {}
}
EOF

cat > packages/domain/activities/src/activity.repository.ts << 'EOF'
import { Activity } from './activity.entity'

export interface IActivityRepository {
  findById(id: string): Promise<Activity | null>
  findMany(filters: any[]): Promise<Activity[]>
}
EOF

cat > packages/domain/activities/src/index.ts << 'EOF'
export { Activity } from './activity.entity'
export type { IActivityRepository } from './activity.repository'
EOF

# feed domain (similar pattern)
cat > packages/domain/feed/package.json << 'EOF'
{
  "name": "@wandr/domain-feed",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@wandr/domain-activities": "workspace:*"
  }
}
EOF

cat > packages/domain/feed/src/feed.entity.ts << 'EOF'
import { Activity } from '@wandr/domain-activities'

export type FeedQuery = {
  filters: any[]
  sort: 'relevance' | 'popularity' | 'price' | 'date'
  cursor?: string
  limit: number
}

export type FeedResult = {
  items: Activity[]
  nextCursor?: string
  totalCount: number
}
EOF

cat > packages/domain/feed/src/index.ts << 'EOF'
export type { FeedQuery, FeedResult } from './feed.entity'
EOF
```

---

## 0.5 — Initialize Application Packages (Phase 1)

```bash
cat > packages/application/feed/package.json << 'EOF'
{
  "name": "@wandr/application-feed",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@wandr/domain-feed": "workspace:*",
    "@wandr/domain-activities": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^0.34.0"
  }
}
EOF

cat > packages/application/feed/src/get-feed.usecase.ts << 'EOF'
import { FeedQuery, FeedResult } from '@wandr/domain-feed'
import { IActivityRepository } from '@wandr/domain-activities'

export class GetFeedUseCase {
  constructor(private repository: IActivityRepository) {}

  async execute(query: FeedQuery): Promise<FeedResult> {
    const activities = await this.repository.findMany(query.filters)
    
    // TODO: Apply sorting, ranking, pagination
    
    return {
      items: activities,
      totalCount: activities.length,
    }
  }
}
EOF

cat > packages/application/feed/src/index.ts << 'EOF'
export { GetFeedUseCase } from './get-feed.usecase'
EOF
```

---

## 0.6 — Initialize Contracts Package

```bash
cat > packages/contracts/package.json << 'EOF'
{
  "name": "@wandr/contracts",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js"
}
EOF

cat > packages/contracts/src/activity.contract.ts << 'EOF'
export type ActivityDTO = {
  id: string
  title: string
  category: string
  price: number
  location: string
  imageUrl?: string
}

export type ActivityCardVM = {
  id: string
  title: string
  priceDisplay: string
  distance: string
  isFavorited: boolean
}
EOF

cat > packages/contracts/src/feed.contract.ts << 'EOF'
import { ActivityDTO } from './activity.contract'

export type FeedQueryDTO = {
  filters?: any[]
  sort?: string
  cursor?: string
  limit: number
}

export type FeedResultDTO = {
  items: ActivityDTO[]
  nextCursor?: string
  totalCount: number
}
EOF

cat > packages/contracts/src/index.ts << 'EOF'
export type { ActivityDTO, ActivityCardVM } from './activity.contract'
export type { FeedQueryDTO, FeedResultDTO } from './feed.contract'
EOF
```

---

## 0.7 — Initialize Presets Package

```bash
cat > packages/presets/package.json << 'EOF'
{
  "name": "@wandr/presets",
  "version": "0.1.0",
  "private": true
}
EOF

cat > packages/presets/src/home.preset.ts << 'EOF'
export type PagePreset = {
  name: string
  feed: {
    filters: string[]
    defaultSort: string
    enableInfiniteScroll: boolean
  }
  sections: Record<string, any>
}

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
}
EOF

cat > packages/presets/src/index.ts << 'EOF'
export type { PagePreset } from './home.preset'
export { HOME_PRESET } from './home.preset'
EOF

cat > packages/presets/package.json << 'EOF'
{
  "name": "@wandr/presets",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts"
}
EOF
```

---

## 0.8 — Initialize Web App

```bash
cat > apps/web/package.json << 'EOF'
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@wandr/application-feed": "workspace:*",
    "@wandr/contracts": "workspace:*",
    "@wandr/presets": "workspace:*",
    "@wandr/database": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0"
  }
}
EOF

cat > apps/web/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@wandr/domain-activities',
    '@wandr/domain-feed',
    '@wandr/application-feed',
    '@wandr/contracts',
    '@wandr/presets',
  ],
}

module.exports = nextConfig
EOF

cat > apps/web/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

mkdir -p apps/web/app
cat > apps/web/app/layout.tsx << 'EOF'
export const metadata = {
  title: 'Wandr',
  description: 'Discover activities in Montreal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF

cat > apps/web/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main>
      <h1>Wandr</h1>
      <p>Discover activities in Montreal</p>
    </main>
  )
}
EOF
```

---

## 0.9 — Environment Setup

```bash
cat > .env.local << 'EOF'
# Database
DATABASE_URL="postgresql://wandr:wandr@localhost:5432/wandr_dev"

# App
NEXT_PUBLIC_API_URL="http://localhost:3000"
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: wandr_dev
      POSTGRES_USER: wandr
      POSTGRES_PASSWORD: wandr
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF
```

---

## 0.10 — Install & Verify

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:setup

# Start dev server
pnpm dev

# In another terminal, verify web is running
open http://localhost:3000
```

---

## 0.11 — Type Check & Lint

```bash
# TypeScript
pnpm type-check

# ESLint (after setup)
pnpm lint

# Both should pass
```

---

## 0.12 — Commit Skeleton

```bash
git add -A
git commit -m "Step Zero: Initialize clean architecture monorepo

- Root package.json with workspaces
- Turborepo configuration
- Domain packages: activities, feed, favorites
- Application packages: feed, activities, search
- Infrastructure packages: database (Prisma)
- Contracts, presets, UI packages
- Next.js web app with transpilation
- Docker Compose for local Postgres/Redis
- TypeScript strict mode, ESLint ready

Ready for Phase 1 implementation."
```

---

## Key Points

1. **Workspaces:** Monorepo with single node_modules, shared config
2. **Layer separation:** Domain has no deps. Application depends on domain. Infrastructure implements domain ports.
3. **Contracts:** DTOs in separate package, shared at boundaries
4. **Presets:** Configuration-driven pages, no per-page packages
5. **Database:** Infrastructure layer, accessed via repositories
6. **Transpilation:** Web app transpiles workspace packages for Next.js

**Next:** STEP_ONE.md — Phase 1 implementation (catalog, filters, search, feed engine)

---

**Duration:** ~2 hours  
**Result:** Production-ready monorepo, zero runtime errors, ready for feature work
