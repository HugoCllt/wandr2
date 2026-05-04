# STEP_ZERO.md — Bootstrap to a Running App

**Outcome:** `pnpm install && pnpm db:up && pnpm db:migrate && pnpm db:seed && pnpm dev` opens a Next.js app at `http://localhost:3000` with 30 seeded activities visible. Layer rules enforced. Schema validated. Type-safe.

**Wall time:** ~90 minutes the first time, ~15 minutes thereafter.

**Prereqs:** Node 20 LTS, pnpm 9, Docker.

This file is executable bottom-up: every command should work as written. If a step fails, fix the step before continuing — do not paper over it.

---

## 0. Repo layout we are about to create

```
wandr2/
├── apps/web/                       # the only app (POC)
│   ├── prisma/
│   ├── src/
│   │   ├── app/                    # Next.js routes
│   │   ├── modules/                # capability modules
│   │   └── shared/
│   ├── .dependency-cruiser.cjs
│   ├── eslint.config.mjs
│   ├── next.config.mjs
│   ├── package.json
│   └── tsconfig.json
├── .editorconfig
├── .gitignore
├── .nvmrc
├── .npmrc
├── .env.example
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json
```

No `packages/*`. No domain/application/infrastructure workspace packages. Modules are folders inside `apps/web/src/modules/`.

---

## 1. Root files

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
```

`.nvmrc`:
```
20
```

`.npmrc`:
```
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
```

`.gitignore`:
```
node_modules/
.next/
dist/
.env
.env.local
*.log
.turbo/
.vercel/
coverage/
playwright-report/
test-results/
```

`.editorconfig`:
```
root = true
[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

`.env.example`:
```
DATABASE_URL=postgresql://wandr:wandr@localhost:5432/wandr_dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAPBOX_TOKEN=
DEV_USER_ID=usr_dev_seed
LOG_LEVEL=debug
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": false,
    "jsx": "preserve"
  }
}
```

Root `package.json`:
```json
{
  "name": "wandr",
  "private": true,
  "version": "0.0.0",
  "engines": { "node": ">=20.0.0", "pnpm": ">=9.0.0" },
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "start": "pnpm --filter web start",
    "type-check": "pnpm --filter web type-check",
    "lint": "pnpm --filter web lint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "pnpm --filter web test",
    "test:e2e": "pnpm --filter web test:e2e",
    "dep:check": "pnpm --filter web dep:check",
    "db:up": "docker compose up -d postgres",
    "db:down": "docker compose down",
    "db:migrate": "pnpm --filter web prisma migrate dev",
    "db:reset": "pnpm --filter web prisma migrate reset --force",
    "db:seed": "pnpm --filter web prisma db seed",
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.3.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,mjs,cjs}": ["prettier --write", "eslint --fix"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

`docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: wandr_dev
      POSTGRES_USER: wandr
      POSTGRES_PASSWORD: wandr
    ports: ["5432:5432"]
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wandr -d wandr_dev"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  postgres_data:
```

`turbo.json` (kept minimal — we have one app, but we want caching working when modules grow):
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env", "tsconfig.base.json"],
  "tasks": {
    "dev":        { "cache": false, "persistent": true },
    "build":      { "outputs": [".next/**", "!.next/cache/**"], "dependsOn": ["^build"] },
    "type-check": { "outputs": [] },
    "lint":       { "outputs": [] },
    "dep:check":  { "outputs": [] },
    "test":       { "outputs": ["coverage/**"] },
    "test:e2e":   { "outputs": ["playwright-report/**"] }
  }
}
```

Husky:
```bash
pnpm dlx husky init
echo 'pnpm lint-staged' > .husky/pre-commit
echo 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

`commitlint.config.cjs`:
```js
module.exports = { extends: ['@commitlint/config-conventional'] }
```

---

## 2. The app — `apps/web`

```bash
mkdir -p apps/web/{src/{app,modules,shared},prisma}
```

`apps/web/package.json`:
```json
{
  "name": "web",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "dep:check": "depcruise --config .dependency-cruiser.cjs src",
    "prisma": "prisma"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^5.18.0",
    "next": "^14.2.0",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "dependency-cruiser": "^16.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^14.2.0",
    "prisma": "^5.18.0",
    "tsx": "^4.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": { "@/*": ["./*"] },
    "plugins": [{ "name": "next" }],
    "incremental": true
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts", "prisma/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
}
```

`apps/web/eslint.config.mjs` (flat config):
```js
import next from 'eslint-config-next'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'playwright-report/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsparser, parserOptions: { project: './tsconfig.json' } },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  ...next,
]
```

### Layer enforcement — `apps/web/.dependency-cruiser.cjs`

```js
module.exports = {
  forbidden: [
    {
      name: 'no-cycles',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-stays-pure',
      severity: 'error',
      comment: 'domain must not import application/infra/web or React/Next/Prisma',
      from: { path: '^src/modules/[^/]+/domain' },
      to: {
        pathNot: '^src/modules/[^/]+/domain',
        path: [
          '^src/modules/[^/]+/(application|infra|web)',
          '^src/app',
          '^src/shared/(ui|db)',
          'node_modules/(react|next|@prisma/client|prisma)',
        ],
      },
    },
    {
      name: 'application-no-infra-or-web',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application' },
      to:   { path: '^src/modules/[^/]+/(infra|web)|^src/app' },
    },
    {
      name: 'infra-no-web-or-application',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/infra' },
      to:   { path: '^src/modules/[^/]+/(web|application)|^src/app' },
    },
    {
      name: 'web-no-direct-infra',
      severity: 'error',
      comment: 'route handlers must go through application',
      from: { path: '^src/app' },
      to:   { path: '^src/modules/[^/]+/infra' },
    },
    {
      name: 'feed-must-not-depend-on-chat',
      severity: 'error',
      comment: 'chat consumes feed; the inverse is forbidden',
      from: { path: '^src/modules/feed' },
      to:   { path: '^src/modules/chat' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
  },
}
```

### Module skeleton — `activities` (the reference)

```ts
// src/modules/activities/domain/activity.entity.ts
export type ActivityId = string & { readonly __brand: 'ActivityId' }

export class Activity {
  constructor(
    readonly id: ActivityId,
    readonly slug: string,
    readonly title: string,
    readonly category: string,
    readonly priceCents: number,
    readonly currency: string,
    readonly dateStart: Date,
    readonly dateEnd: Date | null,
    readonly featured: boolean,
  ) {
    if (priceCents < 0) throw new Error('priceCents must be ≥ 0')
    if (dateEnd && dateEnd < dateStart) throw new Error('dateEnd must be ≥ dateStart')
  }
}
```

```ts
// src/modules/activities/domain/activity.repository.ts
import type { Activity, ActivityId } from './activity.entity'
import type { FeedQuery } from '@/modules/feed/domain/feed.query'

export interface IActivityRepository {
  findById(id: ActivityId): Promise<Activity | null>
  findMany(query: FeedQuery): Promise<{ items: Activity[]; nextCursor: string | null; total: number }>
}
```

```ts
// src/modules/activities/infra/prisma-activity.repository.ts
import type { IActivityRepository } from '../domain/activity.repository'
import type { Activity, ActivityId } from '../domain/activity.entity'
import type { FeedQuery } from '@/modules/feed/domain/feed.query'
import { prisma } from '@/shared/db/client'

export class PrismaActivityRepository implements IActivityRepository {
  async findById(id: ActivityId): Promise<Activity | null> {
    const row = await prisma.activity.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }
  async findMany(query: FeedQuery) {
    // TODO: translate FeedQuery → Prisma where/orderBy/take. P1 implementation.
    throw new Error('not implemented')
  }
  private toDomain(/* row */): Activity { throw new Error('not implemented') }
}
```

`feed`, `filters`, `favorites`, `search`, `map` ship as folders with `domain/index.ts` placeholders so `dep:check` has something to enforce.

### `shared/db/client.ts`

```ts
import { PrismaClient } from '@prisma/client'

declare global { var __prisma: PrismaClient | undefined } // eslint-disable-line no-var

export const prisma = global.__prisma ?? new PrismaClient({ log: ['warn', 'error'] })
if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
```

### `shared/config/env.ts`

```ts
import { z } from 'zod'

const Env = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  DEV_USER_ID: z.string().min(1),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})
export const env = Env.parse(process.env)
```

### `shared/obs/logger.ts`

```ts
import pino from 'pino'
import { env } from '@/shared/config/env'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: 'wandr' },
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})
```

### Initial route — `app/page.tsx`

```tsx
import { prisma } from '@/shared/db/client'

export default async function HomePage() {
  const activities = await prisma.activity.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ featured: 'desc' }, { dateStart: 'asc' }],
    take: 24,
  })
  return (
    <main>
      <h1>Wandr — Montréal</h1>
      <ul>
        {activities.map(a => <li key={a.id}>{a.title}</li>)}
      </ul>
    </main>
  )
}
```

This is intentionally minimal. The shared `<PageShell preset={…} />` arrives in M3 (see TODO.md).

---

## 3. Prisma

`apps/web/prisma/schema.prisma` is the schema described in `SCHEMA.md`. Generator and datasource at the top:

```prisma
generator client { provider = "prisma-client-js" }
datasource db    { provider = "postgresql"; url = env("DATABASE_URL") }
```

Initial migration plus PostGIS bootstrap:

```bash
pnpm --filter web prisma migrate dev --name init --create-only
```

Then prepend the generated migration with:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

And append the GIST index for `Location.geom` (see `SCHEMA.md` §3 "Location" companion migration).

Apply:

```bash
pnpm --filter web prisma migrate dev
```

`prisma/seed.ts` (sketch — fill in 30 hand-curated activities):

```ts
import { PrismaClient, ActivityCategory, ActivityStatus, Recurrence, SourceKind } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const source = await prisma.source.upsert({
    where: { name: 'manual' },
    update: {},
    create: { name: 'manual', kind: SourceKind.MANUAL },
  })
  const user = await prisma.user.upsert({
    where: { id: 'usr_dev_seed' },
    update: {},
    create: { id: 'usr_dev_seed', email: 'dev@wandr.local', name: 'Dev' },
  })
  const oldMtl = await prisma.location.upsert({
    where: { id: 'loc_old_mtl' },
    update: {},
    create: { id: 'loc_old_mtl', address: 'Place Jacques-Cartier', neighborhood: 'Old Montréal', latitude: 45.5076, longitude: -73.5532 },
  })
  await prisma.activity.upsert({
    where: { slug: 'jazz-night-old-mtl' },
    update: {},
    create: {
      slug: 'jazz-night-old-mtl', title: 'Jazz Night — Old Montréal',
      description: 'Live trio under the stars.', category: ActivityCategory.MUSIC,
      status: ActivityStatus.PUBLISHED, price: '15.00', currency: 'CAD',
      dateStart: new Date('2026-06-01T20:00:00-04:00'), recurrence: Recurrence.WEEKLY,
      featured: true, images: [], sourceId: source.id, locationId: oldMtl.id,
    },
  })
  // …29 more
}

main().finally(() => prisma.$disconnect())
```

---

## 4. Boot sequence

```bash
pnpm install
cp .env.example .env
pnpm db:up                     # postgres+postgis container
pnpm db:migrate                # applies init migration with PostGIS bootstrap
pnpm db:seed                   # inserts 30 activities + 1 user
pnpm dev                       # http://localhost:3000
```

---

## 5. Verification (must pass before declaring "done")

Run each command. All must succeed.

| # | Command | Expected |
|---|---|---|
| 1 | `pnpm install` | no peer-dep errors |
| 2 | `pnpm prisma validate --schema apps/web/prisma/schema.prisma` | `Schema is valid` |
| 3 | `pnpm db:migrate` | `Database is now in sync` |
| 4 | `pnpm db:seed` | exits 0, 30 activities upserted |
| 5 | `pnpm type-check` | exits 0 |
| 6 | `pnpm dep:check` | exits 0 |
| 7 | `pnpm dev` then `curl -s http://localhost:3000` | HTML body contains `Jazz Night` |
| 8 | Add `import { PrismaClient } from '@prisma/client'` inside `src/modules/activities/domain/activity.entity.ts`, rerun `pnpm dep:check` | exits non-zero with `domain-stays-pure` violation. Revert. |

If 1–7 pass and 8 correctly fails, STEP_ZERO is done. Commit:

```bash
git add -A
git commit -m "chore: bootstrap modular monolith (STEP_ZERO)"
```

---

## 6. What is intentionally absent

- No `next-intl`, no locale routing.
- No Auth.js / NextAuth scaffolding.
- No Sentry / OTEL.
- No Redis (the in-process LRU is enough until P2).
- No CI workflow file. Add when there is a remote that runs it.

These are documented in CLAUDE.md §9 and ARCHITECTURE.md §13. Do not add scaffolding for them in this step.
