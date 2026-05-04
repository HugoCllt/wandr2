# Wandr — PRD Phase 2: Specialization & Personalization

**Version:** 1.0  
**Status:** Implementation-Ready  
**Scope:** Sport Page + Trend Flame System + User Profile & Stats  
**Prerequisite:** Phase 1 (Discovery Core) complete  
**Target Launch:** Q3 2026

---

## Problem Statement

After Phase 1 launch, users have discovered activities via the home page. Phase 2 addresses two emerging needs:

1. **Sports enthusiasts need a dedicated discovery space** for sports-specific activities (watch, play, classes, deals) without being diluted by general discovery.
2. **Users want to understand engagement momentum** — which activities are trending, which are niche, which are hotly demanded.
3. **Users want personal insight** — how much they've explored, what their favorite categories are, and their engagement stats.

---

## Solution (Phase 2)

Build three interconnected features:

1. **Sport Page** — A dedicated sports discovery page with sections (Watch Live, Play Yourself, Group Classes, Deals & Discounts, Outdoor Activities) and deal badges.
2. **Trend Flame System** — A proprietary engagement scoring system (low/medium/full/super flame) that computes from views, saves, bookings, recency, and capacity fill.
3. **User Profile & Stats** — A personal dashboard showing activity count, favorite category, monthly outings, and trend score, with quick access to Favorites, Preferences, History, and Settings.

---

## Scope (Phase 2)

### In Scope
- Sport page with sports-specific discovery
- Section-based layout (Watch, Play, Classes, Deals, Outdoor)
- Sports filters (sport type, price, distance, date, free/paid, deal badges)
- Deal and discount badges on cards
- Full Trend Flame system (low/medium/full/super, based on engagement signals)
- Trend Flame filtering (show trending only)
- User Profile page with avatar, name, vibe line
- Profile stats section (activities explored, saved, favorite category, monthly outings, trend score)
- Profile quick actions (Favorites, Preferences, History, Settings)
- Preferences panel (location, price range, category preferences)
- History panel (viewed/interacted activities)
- Settings panel (account, email, notifications, privacy)
- Category breakdown visualization (by interest)
- Profile stats persistence and updates

### Out of Scope (Phase 2)
- Chat AI assistant (Phase 3)
- Personalized recommendations engine (Phase 3)
- Advanced personalization (Phase 3)
- Notifications (deferred)
- Social features (deferred)
- Dark mode (deferred)
- Mobile app (deferred)

---

## User Stories

### 1. Sport Page (Stories 116–123)

116. As a user, I want a dedicated Sport page focused on sports and athletic activities, so that I can find sports-specific events
117. As a user, I want the Sport page to include sections like "Watch Live," "Play Yourself," "Group Classes," so that I can choose my level of involvement
118. As a user, I want to see sports deals and discount badges (e.g., "20% Off," "2-for-1"), so that I can find bargains
119. As a user, I want to see outdoor sports activities in a dedicated section, so that I can explore seasonal options
120. As a user, I want the Sport page to use the same card and filtering system as Home, so that the experience is consistent
121. As a user, I want trending sports activities to appear first, so that I see what's hot (uses full Trend Flame)
122. As a user, I want to filter sports by type (hockey, padel, yoga, climbing, etc.), so that I can find my sport
123. As a user, I want to see limited-spots warnings on sports classes, so that I know availability

---

### 2. Trend Flame System (Stories 71–79)

71. As a user, I want to understand what the trend flame represents, so that I know it's an engagement/momentum metric
72. As a user, I want a low flame to signal niche or quiet activities, so that I can find hidden gems
73. As a user, I want a medium flame to signal healthy interest, so that I know an activity has appeal
74. As a user, I want a full flame to signal popular activities, so that I can see what's trending
75. As a user, I want a super flame to signal major trends or high demand, so that I can catch the hottest events
76. As a user, I want the flame to be computed from engagement signals (views, saves, bookings, recency), so that it reflects real momentum
77. As a user, I want the flame icon to be visually elegant (partially filled, premium design), so that it feels like a signature metric
78. As a user, I want to optionally filter by flame level (show only trending), so that I can focus on high-momentum activities
79. As a user, I want the flame to update periodically as new engagement data arrives, so that it stays current

---

### 3. User Profile Page (Stories 136–147)

136. As a user, I want a personal Profile page, so that I can see my account and statistics
137. As a user, I want to see my avatar and name on my profile, so that the profile feels personal
138. As a user, I want to see a short "vibe line" or personal bio that I've set, so that I can express myself
139. As a user, I want to see a stats section showing activities explored, saved count, and favorite category, so that I can see my engagement
140. As a user, I want to see a "monthly outings" stat, so that I can track how often I'm going out
141. As a user, I want to see a personal "trend score," so that I understand my engagement with trending activities
142. As a user, I want to see a category breakdown by interest (Sport, Romantic, Dining, Cultural, Outdoor), so that I can understand my preferences
143. As a user, I want quick action buttons on my profile (Favorites, Preferences, History, Settings), so that I can access these panels
144. As a user, I want the Favorites panel to be accessible from my profile, so that I can review saved activities
145. As a user, I want the Preferences panel to let me set my location, price range, and category preferences, so that I can customize my experience
146. As a user, I want the History panel to show activities I've viewed or interacted with, so that I can revisit them
147. As a user, I want the Settings panel to let me manage account settings (email, notifications, privacy), so that I have control over my data

---

## Implementation Decisions (Phase 2)

### New Deep Modules

#### 1. Trend Flame Scorer Module
**Purpose:** Proprietary engagement scoring.  
**Responsibility:** Compute trend flame level from engagement signals.  
**Interface:**
- `scoreFlame(activity) → { level: "low" | "medium" | "full" | "super", score: number }`
- Inputs: views, saves, bookings, engagement_velocity, recency, capacity_fill
- Deterministic, pure function

**Scoring Logic (Example):**
- Low Flame: 0–25 engagement percentile
- Medium Flame: 25–60 percentile
- Full Flame: 60–90 percentile
- Super Flame: 90–100 percentile + high velocity or high capacity fill

---

#### 2. Profile & Stats Aggregator Module
**Purpose:** Compute user profile stats.  
**Responsibility:** Count viewed activities, saved count, favorite category, monthly outing frequency, personal trend score.  
**Interface:**
- `getStats(userId) → { viewed, saved, favoriteCategory, monthlyOutings, trendScore, categoryBreakdown }`
- Pure aggregation from event logs

**Stats Computation:**
- `viewed`: Count of distinct activities clicked/viewed
- `saved`: Count of favorites
- `favoriteCategory`: Category with most saves or views
- `monthlyOutings`: Count of bookings/saves in the last 30 days
- `trendScore`: User's engagement with trending (Super Flame) activities
- `categoryBreakdown`: Counts by category for visualization

---

### Engagement Tracking

**New Events to Track:**
- `activity_viewed` (user clicks or opens activity detail)
- `activity_saved` (user adds to favorites)
- `activity_searched` (user searches for activity)
- `filter_applied` (user applies a filter)
- `activity_shared` (user shares activity)

**Event Schema:**
```
{
  id: UUID,
  userId: UUID,
  activityId: UUID,
  eventType: enum (viewed, saved, searched, filtered, shared),
  timestamp: DateTime,
  context: { filterApplied?, searchQuery? },
}
```

---

### Trend Flame Recomputation

**Approach:** Nightly batch job (no real-time updates; Phase 1 baseline behavior acceptable).

**Job:** Compute flame scores for all activities based on last 90 days of events.

**Caching:** Cache results in Redis, expire daily.

**Display:** Refresh on page load and periodically (poll every 5 minutes in background).

---

### Data Schema Updates (Phase 2)

**Activity** (additions):
```
{
  ...Phase1Fields,
  engagementSignals: {
    views: number,
    saves: number,
    bookings: number,
    engagement_velocity: number,  // momentum indicator
  },
  trendFlame: {
    level: enum,
    score: number,
    computedAt: DateTime,
  },
  capacity: number,
  capacityFilled: number,
  sports: { type: enum, level: enum },  // for Sport page
  dealBadge?: { type: enum, discount: string },
}
```

**User** (additions):
```
{
  ...Phase1Fields,
  avatar: URL?,
  vibeLine: string?,
  preferences: {
    ...Phase1Preferences,
    notificationsEnabled: boolean,
  },
  stats: {
    viewedCount: number,
    savedCount: number,
    monthlyOutings: number,
    lastEngagement: DateTime,
  },
}
```

**EngagementEvent** (new):
```
{
  id: UUID,
  userId: UUID,
  activityId: UUID,
  eventType: enum,
  timestamp: DateTime,
  context: object,
}
```

---

### API Contracts (Phase 2 Additions)

#### GET /api/profile
```
Request: (authenticated)
Response: {
  id: UUID,
  name: string,
  avatar: URL?,
  vibeLine: string?,
  stats: { viewed, saved, favoriteCategory, monthlyOutings, trendScore },
  categoryBreakdown: { [category]: count },
}
```

#### PUT /api/profile
```
Request: { name?, avatar?, vibeLine?, preferences? }
Response: { success: boolean }
```

#### GET /api/profile/preferences
```
Response: {
  location: { lat, lng },
  priceRange: { min, max },
  distanceMax: number,
  favoriteCategories: [ string ],
  notificationsEnabled: boolean,
}
```

#### PUT /api/profile/preferences
```
Request: { location?, priceRange?, distanceMax?, favoriteCategories?, notificationsEnabled? }
Response: { success: boolean }
```

#### GET /api/profile/history
```
Request: { limit: 10..100, cursor? }
Response: { activities: [ Activity ], nextCursor? }
```

#### GET /api/activities/sports
```
Request: { filters: { sportType?, section? }, sort, cursor, limit }
Response: { activities: [ Activity ], nextCursor, totalCount }
```

#### GET /api/engagement/:activityId/stats
```
Response: { views: number, saves: number, bookings: number, trendFlame: object }
```

---

### Architectural Decisions (Phase 2)

1. **Trend Flame computed nightly** (not real-time)
   - Reduces computational load
   - 24h update cadence acceptable for discovery use case
   - Cached in Redis for instant retrieval

2. **Engagement events logged asynchronously**
   - Non-blocking inserts
   - Batch aggregation nightly

3. **Sport page reuses Home feed components**
   - Same card variants, filters, sorting
   - Scoped to `sports=true` in Catalog query
   - Consistent UX across pages

4. **Profile stats precomputed and cached**
   - Computed via nightly aggregation job
   - Refreshed on-demand if requested
   - Quick access from profile page

5. **Preferences stored server-side**
   - User-editable via Profile settings
   - Optionally influence Home feed sorting
   - Shareable only within user's session

---

## Testing Decisions (Phase 2)

### Unit Tests (Priority: High)

1. **Trend Flame Scorer** — Verify correct flame level for various signal combinations.
2. **Profile Stats Aggregator** — Verify correct counts and aggregations.
3. **Sports Filter Engine** — Extend Phase 1 filter tests to sports-specific filters.

### Integration Tests (Priority: Medium)

1. **Engagement Event Logging + Stats Aggregation** — Log events, compute stats, verify accuracy.
2. **Trend Flame + Activity Catalog** — Compute flame, retrieve activities sorted by flame.
3. **Profile + Stats** — Load profile, verify stats are current.

### E2E Tests (Priority: Critical)

1. **Sport Page Discovery** — Open Sport page → filter by sport type/deal → scan cards → click → view detail.
2. **Trend Flame Filtering** — Apply "trending" filter on Home → verify only high-flame activities shown.
3. **Profile Stats** — Navigate to Profile → verify stats displayed (viewed, saved, favorite category, monthly outings).
4. **History Panel** — Open History → verify recently viewed activities listed → click one → open detail.

### Visual Regression (Priority: Medium)

1. **Sport Page Layout** — Sections (Watch, Play, Classes, Deals, Outdoor) rendered correctly.
2. **Deal Badges** — "20% Off," "2-for-1," "Limited Spots" badges displayed correctly.
3. **Trend Flame Icons** — Low, Medium, Full, Super flame icons rendered with correct fill.
4. **Profile Page** — Avatar, stats section, quick action buttons, category breakdown chart.

---

## Out of Scope (Phase 2)

- Chat AI assistant (Phase 3)
- Personalized recommendations (Phase 3)
- Advanced personalization / ML (Phase 3)
- Notifications system (deferred)
- Social features (deferred)
- Mobile app (deferred)
- Dark mode (deferred)
- Internationalization (deferred)

---

## Success Metrics (Phase 2)

- **Sport page engagement** — 20%+ of Home users visit Sport page weekly
- **Trend Flame adoption** — Users understand and filter by trending status
- **Profile stats accuracy** — Stats match actual user behavior within 1% error
- **Performance maintained** — FCP < 2s, LCP < 4s (consistent with Phase 1)
- **WCAG AA** compliance maintained
- **Test coverage** — Unit 80%+, integration 60%+, E2E pass rate 100%

---

## Acceptance Criteria (Phase 2)

- [ ] All user stories (71–79, 116–123, 136–147) implemented and testable
- [ ] Trend Flame module is testable in isolation
- [ ] Profile & Stats module is testable in isolation
- [ ] Sport page reuses Home components (DRY)
- [ ] Trend Flame computed nightly, cached, served instantly
- [ ] E2E tests pass (Sport discovery, Trend filtering, Profile stats)
- [ ] Visual regression tests pass (Sport layout, deal badges, flame icons, profile)
- [ ] Accessibility audit passes WCAG AA
- [ ] Performance targets maintained
- [ ] Code coverage: unit 80%+, integration 60%+
- [ ] Ready for beta rollout

---

**End of PRD Phase 2**
