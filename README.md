# Wandr

Personal POC — Next.js 14 + Prisma + PostgreSQL.

## Prerequisites

- Node.js 20+
- pnpm 10 (`corepack enable`)
- PostgreSQL 15+ running locally

## Setup

```sh
# 1. Install deps
pnpm install

# 2. Configure env
cp .env.example .env   # then edit DATABASE_URL to match your local Postgres

# 3. Create the database
createdb -U postgres wandr

# 4. Push schema and seed
pnpm db:push
pnpm db:seed
```

## Run

```sh
pnpm dev          # http://localhost:3000
```

Pages: `/` (home), `/activity/[slug]`, `/favorites`, `/calendar`.

## Common scripts

```sh
pnpm build        # production build
pnpm test         # vitest
pnpm type-check   # tsc --noEmit
pnpm lint         # eslint
pnpm dep:check    # enforce layer DAG
```

## Reset DB

```sh
dropdb -U postgres wandr && createdb -U postgres wandr
pnpm db:push && pnpm db:seed
```

See `db_setup.md` for details, `ARCHITECTURE.md` and `CLAUDE.md` for engineering rules.
