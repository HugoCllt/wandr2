# Database Schema — Wandr

**Database:** PostgreSQL with PostGIS (for geospatial queries)  
**ORM:** Prisma  
**Location:** `packages/infrastructure/database/prisma/schema.prisma`

---

## Core Tables

### User
Authenticated user account.

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  
  // Auth (Phase 0: placeholder for auth module)
  passwordHash    String?
  sessionToken    String?   @unique
  
  // Profile (Phase 2)
  avatar          String?
  vibeLine        String?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  favorites       Favorite[]
  profile         Profile?
  engagementEvents EngagementEvent[]
}
```

**Indexes:**
- `email` (unique, auth lookups)
- `sessionToken` (unique, session lookups)

---

### Activity
Single activity/event in catalog.

```prisma
model Activity {
  id              String    @id @default(cuid())
  
  // Content
  title           String
  description     String    @db.Text
  category        String    // 'Sports', 'Dining', 'Culture', etc.
  images          String[]  // JSON array of URLs
  
  // Pricing & Availability
  price           Float
  capacity        Int?
  capacityFilled  Int       @default(0)
  
  // Scheduling
  dateStart       DateTime
  dateEnd         DateTime?
  recurring       String?   // 'daily', 'weekly', null if one-time
  
  // Location
  locationId      String
  location        Location  @relation(fields: [locationId], references: [id])
  
  // External Link
  bookingUrl      String?
  
  // Engagement Signals (Phase 1)
  viewCount       Int       @default(0)
  saveCount       Int       @default(0)
  
  // Trend Flame (Phase 2)
  trendFlameLevel String?   // 'low', 'medium', 'full', 'super'
  trendFlameScore Float     @default(0)
  trendFlameComputedAt DateTime?
  
  // Sports-specific (Phase 2)
  sportType       String?   // 'hockey', 'padel', 'yoga', etc.
  sportLevel      String?   // 'beginner', 'intermediate', 'advanced'
  
  // Deal badge (Phase 2)
  dealType        String?   // '20% Off', '2-for-1', 'Limited Spots'
  dealDiscount    Float?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  favorites       Favorite[]
  engagementEvents EngagementEvent[]
  searchIndex     ActivitySearchIndex?
  
  @@index([category])
  @@index([dateStart])
  @@index([sportType])
  @@index([trendFlameLevel])
}
```

**Indexes:**
- `category` (filtering Phase 1)
- `dateStart` (sorting Phase 1)
- `sportType` (filtering Phase 2)
- `trendFlameLevel` (filtering Phase 2)
- Geo-index on location (PostGIS, Phase 1 map)

---

### Location
Geographic location for activities.

```prisma
model Location {
  id              String    @id @default(cuid())
  
  address         String
  neighborhood    String    // 'Old Montreal', 'Plateau', etc.
  
  // PostGIS Point (latitude, longitude)
  latitude        Float
  longitude       Float
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relations
  activities      Activity[]
  
  @@index([latitude, longitude]) // PostGIS geo-index
}
```

**Indexes:**
- `(latitude, longitude)` — PostGIS spatial index for nearby queries

---

### Favorite
User's saved activities.

```prisma
model Favorite {
  id              String    @id @default(cuid())
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activityId      String
  activity        Activity  @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  
  // Constraints
  @@unique([userId, activityId])
  @@index([userId])
  @@index([activityId])
}
```

**Constraints:**
- Unique pair (userId, activityId) — user can't favorite same activity twice
- Cascade delete — removing user/activity removes favorites

---

### Profile
User profile data (Phase 2).

```prisma
model Profile {
  id              String    @id @default(cuid())
  
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Stats (aggregated, updated nightly)
  viewedCount     Int       @default(0)
  savedCount      Int       @default(0)
  favoriteCategory String?
  monthlyOutings  Int       @default(0)
  trendScore      Float     @default(0)
  
  // Preferences
  preferredLocation String?
  preferredPriceMax Float?
  preferredDistanceMax Float?
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Purpose:** Aggregated stats, updated nightly via batch job. Not transactional during user session.

---

### EngagementEvent
Raw event log for user interactions (Phase 1+).

```prisma
model EngagementEvent {
  id              String    @id @default(cuid())
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activityId      String?
  activity        Activity? @relation(fields: [activityId], references: [id], onDelete: SetNull)
  
  // Event type
  eventType       String    // 'viewed', 'saved', 'shared', 'searched', 'clicked'
  
  // Context
  duration        Int?      // milliseconds spent viewing (Phase 1)
  searchQuery     String?   // if eventType = 'searched' (Phase 1)
  filterApplied   String?   // if eventType = 'filtered' (Phase 1)
  
  // Timestamps
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([activityId])
  @@index([eventType])
  @@index([createdAt]) // for nightly aggregation queries
}
```

**Purpose:** Immutable log of all user interactions. Used to compute stats, flame scores, affinities.

---

### ActivitySearchIndex
Denormalized search index (Phase 1).

```prisma
model ActivitySearchIndex {
  id              String    @id @default(cuid())
  
  activityId      String    @unique
  activity        Activity  @relation(fields: [activityId], references: [id], onDelete: Cascade)
  
  // Denormalized for full-text search
  title           String
  description     String    @db.Text
  category        String
  neighborhood    String
  
  // Timestamps
  updatedAt       DateTime  @updatedAt
}
```

**Purpose:** 
- For fallback naive search (regex on title/description)
- Optionally synced to Elasticsearch for Phase 1+ advanced search
- Denormalized for performance

---

### Conversation
Chat history (Phase 3).

```prisma
model Conversation {
  id              String    @id @default(cuid())
  
  userId          String
  // user User @relation(...) // Not created yet, optional for now
  
  // Intent parsed from user message
  userMessage     String    @db.Text
  parsedIntent    String    @db.Text // JSON: { mood, dateRange, budget, neighborhood }
  
  // AI response
  assistantMessage String?  @db.Text
  suggestedActivityIds String[] // JSON array of activity IDs returned
  
  // Timestamps
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([createdAt])
}
```

**Purpose:** Log chat interactions for Phase 3. Optional user relation.

---

### UserAffinity
Computed user preferences (Phase 3).

```prisma
model UserAffinity {
  id              String    @id @default(cuid())
  
  userId          String    @unique
  // user User @relation(...) // Not created yet, optional for now
  
  // Category affinities (0.0 - 1.0)
  sportAffinity   Float     @default(0)
  diningAffinity  Float     @default(0)
  cultureAffinity Float     @default(0)
  musicAffinity   Float     @default(0)
  entertainmentAffinity Float @default(0)
  outdoorAffinity Float     @default(0)
  
  // Timestamps
  computedAt      DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Purpose:** Computed nightly from engagement events. Used for personalized recommendations (Phase 3).

---

## Relationships (Diagram)

```
User (1) ──→ (many) Favorite ←── (1) Activity
User (1) ──→ (1) Profile
User (1) ──→ (many) EngagementEvent ←── (1) Activity
Activity (many) ──→ (1) Location
Activity (1) ──→ (1) ActivitySearchIndex
Activity (optional) ← Conversation (user messages about activities)
User (optional) ← UserAffinity (computed preferences)
```

---

## Indexes Summary

| Table | Column(s) | Purpose |
|-------|-----------|---------|
| User | email | Auth login |
| User | sessionToken | Session lookup |
| Activity | category | Filter Phase 1 |
| Activity | dateStart | Sort Phase 1 |
| Activity | sportType | Filter Phase 2 |
| Activity | trendFlameLevel | Filter Phase 2 |
| Location | (lat, lng) | PostGIS geo-index |
| Favorite | userId | List user favorites |
| Favorite | (userId, activityId) | Prevent duplicates |
| EngagementEvent | userId | Nightly aggregation |
| EngagementEvent | eventType | Analytics |
| EngagementEvent | createdAt | Time-range queries |
| ActivitySearchIndex | activityId | Lookup for search |
| Conversation | userId | Chat history |
| Conversation | createdAt | Recent conversations |

---

## Phase Dependencies

### Phase 1 (MVP)
✅ Required:
- User, Activity, Location, Favorite
- EngagementEvent (for views, saves)
- ActivitySearchIndex (for search)
- Indexes: category, dateStart, (lat, lng)

❌ Not yet:
- Profile, Conversation, UserAffinity
- Trend Flame columns (can add, but not used)

### Phase 2
✅ Add:
- Profile (stats aggregation)
- trendFlameLevel, trendFlameScore (compute nightly)
- sportType, sportLevel, dealType (Phase 2 data)

### Phase 3
✅ Add:
- Conversation (chat logs)
- UserAffinity (personalization)

---

## Constraints & Assumptions

1. **Cascade Delete:** Removing user/activity cascades to favorites/events
2. **Unique Favorites:** User can't save same activity twice
3. **Immutable Events:** EngagementEvent is append-only (no updates)
4. **Denormalized Profile:** Stats updated nightly, not transactional
5. **PostGIS:** Location queries use geo-index for "nearby" searches
6. **JSON Arrays:** Images, parseIntent stored as JSON (Prisma arrays)

---

## Notes for Implementation

- All timestamps use `DateTime` (UTC)
- IDs use `cuid()` (collisionless, distributed-friendly)
- Nullable fields for optional data (Phase 2/3 columns, optional fields)
- Indexes applied to frequently queried columns only (avoid over-indexing)
- PostGIS setup required in Postgres: `CREATE EXTENSION IF NOT EXISTS postgis;`

---

**Ready for review. Challenge and suggest improvements.**
