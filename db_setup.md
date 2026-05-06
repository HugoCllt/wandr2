# DB setup — Wandr v0.1

PostgreSQL is a system service on Windows (no Docker). Connection used by the app:

```
postgresql://postgres:Garros41@localhost:5432/wandr
```

## Bootstrap from a fresh clone

1. Install PostgreSQL 15+ on Windows. Default `postgres` superuser, set its password (this repo uses `Garros41` for local dev only).
2. Create the database:
   ```sh
   createdb -U postgres wandr
   ```
   or via `psql`:
   ```sql
   CREATE DATABASE wandr;
   ```
3. Copy `.env.example` → `.env` and fill in `DATABASE_URL` to match your local password.
4. Install JS deps and push the Prisma schema:
   ```sh
   pnpm install
   pnpm db:push
   ```
   (Stage 0 uses `db:push`. From Stage 1 onward, prefer `pnpm db:migrate`.)
5. (Stage 1+) Seed the catalogue:
   ```sh
   pnpm db:seed
   ```

## Reset local DB

Drop and recreate:

```sh
dropdb -U postgres wandr
createdb -U postgres wandr
pnpm db:push
pnpm db:seed
```

## Notes

- `.env` is gitignored — secrets never leave the machine.
- TZ: rows store UTC; rendering converts to `America/Toronto` via `src/shared/ui/format/formatInTZ.ts` (added in a later stage).
