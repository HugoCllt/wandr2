# SCHEMA.md — Wandr Database

**Engine:** PostgreSQL 16 + PostGIS 3.4
**ORM:** Prisma
**Location:** `apps/web/prisma/schema.prisma`

Every block in this document passes `prisma format && prisma validate`. If you edit a snippet, re-run the check before committing.

---

## 1. Conventions

- **IDs:** `cuid()` everywhere. Distributed-friendly, sortable enough.
- **Money:** `Decimal @db.Decimal(10, 2)`. Never `Float`. Always paired with a `currency` field.
- **Time:** `DateTime` is UTC at the column level. Activities carry their own `timezone` for local-time semantics ("doors at 8pm" stays 8pm regardless of viewer).
- **Enums:** Prisma `enum` for any constrained string. No magic strings in the schema.
- **JSON:** `Json` for unstructured payloads (`parsedIntent`, `eventPayload`). Never stringified JSON in a `String` column.
- **Geo:** PostGIS `geography(Point, 4326)` via Prisma `Unsupported`. Index is GIST, declared in a raw migration (Prisma cannot author it).
- **Cascade:** declared explicitly on every relation. No "default" cascade behavior left implicit.
- **Provenance:** every Activity has a `(sourceId, externalId)` unique pair to prevent duplicate ingestion.

PostGIS is enabled in the initial migration:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 2. Enums

```prisma
enum ActivityStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  EXPIRED
  CANCELLED
}

enum ActivityCategory {
  SPORT
  DINING
  CULTURE
  MUSIC
  NIGHTLIFE
  OUTDOOR
  WELLNESS
  FAMILY
  FESTIVAL
  ROMANTIC
}

enum Recurrence {
  ONE_OFF
  DAILY
  WEEKLY
  MONTHLY
}

enum DealKind {
  PERCENT_OFF
  TWO_FOR_ONE
  LIMITED_SPOTS
  EARLY_BIRD
  FREE
}

enum SportLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  ALL_LEVELS
}

enum FlameLevel {
  LOW
  MEDIUM
  FULL
  SUPER
}

enum EngagementEventType {
  VIEWED
  CLICKED
  SAVED
  UNSAVED
  SHARED
  SEARCHED
  FILTERED
  BOOKED_OUT
}

enum SourceKind {
  MANUAL
  EVENTBRITE
  TICKETMASTER
  SCRAPER
  PARTNER_API
}

enum IngestionJobStatus {
  QUEUED
  RUNNING
  SUCCEEDED
  FAILED
}
```

---

## 3. Core models

### User (POC: single seeded dev user)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  favorites        Favorite[]
  engagementEvents EngagementEvent[]
  reviews          Review[]
  conversations    Conversation[]
  affinities       UserCategoryAffinity[]
}
```

P1 reads identity from a request header and resolves to the seeded user. Real auth tables (Auth.js compatible) are explicitly **not** declared until that capability is in scope.

### Activity

```prisma
model Activity {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String   @db.Text

  category    ActivityCategory
  status      ActivityStatus   @default(DRAFT)

  // Pricing
  price       Decimal  @db.Decimal(10, 2)
  currency    String   @default("CAD")
  isFree      Boolean  @default(false)

  // Capacity
  capacity       Int?
  capacityFilled Int       @default(0)

  // Scheduling — UTC timestamps; local semantics via timezone
  dateStart   DateTime
  dateEnd     DateTime?
  timezone    String   @default("America/Montreal")
  recurrence  Recurrence @default(ONE_OFF)

  // Location
  locationId  String
  location    Location @relation(fields: [locationId], references: [id], onDelete: Restrict)

  // Media
  images      Json     // [{ url, alt, width, height }]
  bookingUrl  String?

  // Sport-specific (P2)
  sportType   String?
  sportLevel  SportLevel?

  // Deal (P2)
  dealKind     DealKind?
  dealDiscount Decimal? @db.Decimal(5, 2) // percent for PERCENT_OFF

  // Engagement counters (denormalized for speed; reconciled nightly)
  viewCount   Int      @default(0)
  saveCount   Int      @default(0)

  // Ranking signals
  featured    Boolean  @default(false) // P1 sort signal
  flameLevel  FlameLevel? // P2
  flameScore  Decimal? @db.Decimal(6, 4) // P2
  flameComputedAt DateTime?

  // Provenance
  sourceId    String
  source      Source   @relation(fields: [sourceId], references: [id], onDelete: Restrict)
  externalId  String?  // ID in the upstream system, null for MANUAL

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  favorites        Favorite[]
  engagementEvents EngagementEvent[]
  reviews          Review[]
  tags             ActivityTag[]
  conversationLinks ConversationActivity[]

  @@unique([sourceId, externalId])
  @@index([status, dateStart])
  @@index([category, status])
  @@index([featured, dateStart])
  @@index([flameLevel])
  @@index([sportType])
}
```

### Location

```prisma
model Location {
  id           String  @id @default(cuid())
  address      String
  neighborhood String

  latitude     Float
  longitude    Float

  // PostGIS column. Prisma cannot author the GIST index — it lives in a raw migration.
  geom         Unsupported("geography(Point, 4326)")?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  activities   Activity[]

  @@index([neighborhood])
}
```

Companion migration (excerpt) — applied alongside the Prisma migration that introduces `Location`:

```sql
ALTER TABLE "Location"
  ADD COLUMN IF NOT EXISTS geom geography(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;

CREATE INDEX IF NOT EXISTS location_geom_gix ON "Location" USING GIST (geom);
```

`geom` is generated from `latitude/longitude`, so writes stay simple and the GIST index is real.

### Favorite

```prisma
model Favorite {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityId String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([userId, activityId])
  @@index([userId, createdAt])
}
```

### Source / IngestionJob

```prisma
model Source {
  id          String     @id @default(cuid())
  kind        SourceKind
  name        String     @unique // e.g. "manual", "eventbrite-mtl"
  config      Json?      // adapter-specific settings
  enabled     Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  activities  Activity[]
  jobs        IngestionJob[]
}

model IngestionJob {
  id          String              @id @default(cuid())
  sourceId    String
  source      Source              @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  status      IngestionJobStatus  @default(QUEUED)
  startedAt   DateTime?
  finishedAt  DateTime?
  inserted    Int                 @default(0)
  updated     Int                 @default(0)
  failed      Int                 @default(0)
  error       String?             @db.Text
  createdAt   DateTime            @default(now())

  @@index([sourceId, createdAt])
  @@index([status])
}
```

### Review

```prisma
model Review {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activityId String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  rating     Int      // 1..5, validated in domain
  body       String?  @db.Text
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([userId, activityId])
  @@index([activityId, rating])
}
```

### Tag / ActivityTag

```prisma
model Tag {
  id    String        @id @default(cuid())
  slug  String        @unique
  label String

  activities ActivityTag[]
}

model ActivityTag {
  activityId String
  tagId      String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([activityId, tagId])
  @@index([tagId])
}
```

### EngagementEvent

```prisma
model EngagementEvent {
  id           String              @id @default(cuid())
  userId       String?
  user         User?               @relation(fields: [userId], references: [id], onDelete: SetNull)
  activityId   String?
  activity     Activity?           @relation(fields: [activityId], references: [id], onDelete: SetNull)
  type         EngagementEventType
  payload      Json?               // event-specific properties (search query, filter set, dwell ms, …)
  createdAt    DateTime            @default(now())

  @@index([userId, createdAt])
  @@index([activityId, type, createdAt])
  @@index([type, createdAt])
}
```

**Retention:** 90 days, enforced by a daily job (P2). Monthly partitioning on `createdAt` once the table exceeds ~10M rows.

### UserCategoryAffinity (P3)

```prisma
model UserCategoryAffinity {
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  category  ActivityCategory
  score     Decimal          @db.Decimal(6, 4) // 0..1
  updatedAt DateTime         @updatedAt

  @@id([userId, category])
}
```

Computed nightly from `EngagementEvent`. Adding a new category is a no-op — the schema does not change.

### Conversation / ConversationActivity (P3)

```prisma
model Conversation {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userMessage   String   @db.Text
  parsedIntent  Json     // IntentDTO
  explanation   String?  @db.Text
  modelVersion  String   // pin for reproducibility, e.g. "gpt-4o-mini-2024-07-18"
  inputTokens   Int      @default(0)
  outputTokens  Int      @default(0)
  costUsd       Decimal  @db.Decimal(10, 6) @default(0)
  createdAt     DateTime @default(now())

  activities    ConversationActivity[]

  @@index([userId, createdAt])
}

model ConversationActivity {
  conversationId String
  activityId     String
  rank           Int
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  activity       Activity     @relation(fields: [activityId], references: [id], onDelete: Cascade)

  @@id([conversationId, activityId])
  @@index([activityId])
}
```

Referential integrity replaces the old `String[]` of activity IDs.

---

## 4. Index plan

| Table | Index | Purpose |
|---|---|---|
| Activity | `(status, dateStart)` | Default feed scan |
| Activity | `(category, status)` | Category-filtered feed |
| Activity | `(featured, dateStart)` | P1 ranker |
| Activity | `flameLevel` | P2 filter |
| Activity | `sportType` | Sport preset |
| Activity | `(sourceId, externalId)` unique | Ingestion dedup |
| Location | `geom` (GIST, raw migration) | "nearby" queries |
| Location | `neighborhood` | Neighborhood filter |
| Favorite | `(userId, createdAt)` | List user favorites |
| Review | `(activityId, rating)` | Rating aggregations |
| EngagementEvent | `(userId, createdAt)` | Per-user history |
| EngagementEvent | `(activityId, type, createdAt)` | Per-activity engagement |
| Conversation | `(userId, createdAt)` | Recent chats |

---

## 5. What's in each phase

### P1 — required to ship the discovery feed

Activity, Location, Favorite, EngagementEvent, Source, IngestionJob, Review, Tag, ActivityTag, User. PostGIS extension + `geom` column + GIST index.

### P2 — engagement + sport vertical

Activity flame columns populated. EngagementEvent retention job. Sport preset uses `sportType`/`sportLevel` already in schema (no migration). Profile page uses pre-aggregated stats — add a `Profile` model only if we decide aggregations belong in a table rather than computed views.

### P3 — chat + personalization

Conversation, ConversationActivity, UserCategoryAffinity.

---

## 6. Constraints & assumptions

- All timestamps UTC; activities carry their own `timezone`.
- IDs are `cuid()`; never `uuid()` (longer, less sortable).
- `EngagementEvent` is append-only. No `updatedAt`.
- Prices are `Decimal(10,2)`. Anything claiming a "free" price MUST set `isFree=true` and `price=0`.
- `Activity.images` is structured JSON, validated at write time by zod (not by Prisma).
- POC has no `Account` / `Session` / `VerificationToken`. When auth lands, those are added without breaking changes — they only attach to `User` via FK.

---

## 7. Validation contract

Every PR that touches `schema.prisma` must:

1. Run `pnpm prisma format && pnpm prisma validate`.
2. Generate a migration named after the change (`pnpm prisma migrate dev --name <thing>`).
3. Update §3 above so the doc stays the source of truth.
4. Add or update an index in §4 if query patterns changed.
