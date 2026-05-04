# Wandr — PRD Phase 1: MVP (Discovery Core)

**Version:** 1.0  
**Status:** Implementation-Ready  
**Scope:** Home + Activity Discovery + Filters + Map + Favorites + Search  
**Target Launch:** Q2 2026

---

## Problem Statement

Montréalers struggle to decide what to do tonight or this weekend. Existing event listing websites feel transactional, mobile-first, noisy, and uninspiring. Users scroll through generic listings, feel overwhelmed by choice, and lack confidence in their decisions. Discovery takes longer than it should.

---

## Solution (Phase 1)

Launch a **laptop-first web platform** that helps users discover appealing activities in Montreal **in under 60 seconds** via:

1. **A curated home page** with a featured carousel, activity discovery feed, and sticky filters
2. **An integrated live map** showing nearby activities synchronized with the feed
3. **Smart filtering** by price, distance, date, category, indoor/outdoor
4. **Smart search** that parses natural language ("jazz tonight," "cheap padel near me")
5. **Personal favorites** to save and revisit activities
6. **Rich activity detail overlay** with full information, map, reviews, and booking links

**Design north star:** Warmth, clarity, speed. Premium minimalism inspired by Apple + Airbnb.

---

## Scope (Phase 1)

### In Scope
- Home page with featured carousel
- Activity discovery feed (grid, infinite scroll, sorting)
- Sticky left sidebar filters (price, distance, date, category, indoor/outdoor, free/paid)
- Activity cards (3 variants: Hero Horizontal, Standard Vertical, Compact Row)
- Activity detail full-page overlay
- Quick location mini overlay map
- Integrated map section with pins and clustering
- Smart search (keywords, categories, neighborhoods, date phrases)
- Favorites (save, list, search, filter, remove)
- Global navigation and sticky top navbar
- Responsive design (laptop-first, usable down to 800px)
- Accessibility (WCAG AA)
- Performance targets (FCP < 2s, LCP < 4s)

### Out of Scope (Phase 1)
- Sport page (Phase 2)
- Chat AI assistant (Phase 3)
- User profile / personal stats (Phase 2)
- Trend Flame system (full version in Phase 2, basic display only in Phase 1)
- Dark mode
- Mobile app
- Booking/payment integration
- User-generated reviews
- Vendor/admin portal
- Notifications

---

## User Stories

### 1. Global Navigation & Search (Stories 1–7)

1. As a user, I want a persistent top navigation bar with the Wandr logo, so that I can orient myself and always access navigation
2. As a user, I want to navigate between Home, Sport, Chat, and Profile pages via the top navbar, so that I can switch contexts quickly (Sport/Chat/Profile nav items appear but lead to "Coming Soon" for Phase 1)
3. As a user, I want a global search bar in the top navbar, so that I can search for activities by keyword, neighborhood, category, or date phrase from anywhere
4. As a user, I want search suggestions and autocomplete, so that I can complete a search faster
5. As a user, I want search to parse intent (e.g., "jazz tonight" → jazz + today's date), so that I can enter natural language
6. As a user, I want my search query to be shareable via URL, so that I can send a curated filtered view to a friend
7. As a user, I want to clear my search and reset to the default Home view, so that I can start browsing fresh

---

### 2. Home Page — Featured Carousel (Stories 8–15)

8. As a user, I want to see a prominent hero carousel at the top of the Home page, so that I'm immediately exposed to top upcoming activities
9. As a user, I want the carousel to rotate slowly and automatically, so that new activities come into view without overwhelming me
10. As a user, I want to manually navigate the carousel (prev/next buttons), so that I can control the pace
11. As a user, I want large, high-quality hero images in the carousel, so that I'm visually inspired
12. As a user, I want each carousel card to show the activity title, date, price, and location, so that I can make a quick decision
13. As a user, I want a prominent "Book Now" CTA on carousel items, so that I can proceed quickly if interested
14. As a user, I want the carousel to pause when I hover, so that I have time to read and absorb
15. As a user, I want the carousel to be keyboard-accessible (arrow keys, tab), so that I can navigate without a mouse

---

### 3. Home Page — Sticky Left Sidebar Filters (Stories 16–29)

16. As a user, I want a sticky filter sidebar on the left, so that it stays visible while I scroll
17. As a user, I want to filter by price range (free, <$20, $20–$50, $50+), so that I can see activities within budget
18. As a user, I want to filter by distance (walking, 1km, 5km, 10km+), so that I find nearby activities
19. As a user, I want to filter by date (today, this week, this month, upcoming), so that I can plan or find spontaneous plans
20. As a user, I want to filter by indoor vs. outdoor, so that weather considerations are factored in
21. As a user, I want to filter by category (Sports, Dining, Culture, Music, Entertainment, etc.), so that I can narrow to my interests
22. As a user, I want to filter by free vs. paid (Phase 1 basic; full trending display in Phase 2)
23. As a user, I want multi-select filters, so that I can compose complex queries
24. As a user, I want filters to apply instantly, so that feedback is immediate
25. As a user, I want to clear all filters at once, so that I can reset without clicking each
26. As a user, I want to see a badge or count of active filters, so that I know my constraints at a glance
27. As a user, I want to save filter presets (e.g., "My Weekend"), so that I can apply common sets quickly
28. As a user, I want the sidebar to collapse on smaller screens, so that the feed takes full width
29. As a user, I want the sidebar to include quick access to "Explore" and "Saved," so that I can jump between modes

---

### 4. Home Page — Activity Discovery Feed (Stories 30–41)

30. As a user, I want to browse activities in a responsive grid layout, so that I can explore many options at once
31. As a user, I want the grid to adapt to screen size (3 columns on large, 2 on smaller), so that layout remains readable
32. As a user, I want infinite scroll, so that I can keep exploring without page reloads
33. As a user, I want to sort activities by relevance, popularity, price, and date, so that I can customize order
34. As a user, I want a visual indicator of current sort, so that I know what order I'm viewing
35. As a user, I want each card to show a compelling preview (image, title, key info), so that I can scan quickly
36. As a user, I want hover preview on cards (expanded details), so that I get a peek before opening detail
37. As a user, I want smooth card animations (soft lift, shadows), so that interactions feel polished
38. As a user, I want to click a card to open the full detail overlay, so that I can dive deeper
39. As a user, I want the feed to remember my scroll position when I close detail, so that I don't lose my place
40. As a user, I want infinite scroll to be automatic, so that the experience is fluid
41. As a user, I want to see a skeleton loader while fetching, so that I know more content is coming

---

### 5. Activity Cards — Core Elements (Stories 42–56)

42. As a user, I want each card to display a cover image, so that I'm visually drawn to activities
43. As a user, I want images to be lazy-loaded, so that the page loads quickly
44. As a user, I want each card to show the activity title prominently, so that I know what it is at a glance
45. As a user, I want each card to show distance from me, so that I can assess travel convenience
46. As a user, I want each card to show the price, so that I can stay within budget
47. As a user, I want each card to show the date and start time, so that I can check availability
48. As a user, I want distance and price to update based on my location preference, so that they stay relevant
49. As a user, I want a small location-pin button on each card, so that I can open a quick map preview
50. As a user, I want a heart/save button on each card, so that I can add to favorites
51. As a user, I want the heart to fill when I save, so that I get instant feedback
52. As a user, I want to see a trend flame indicator on each card (Phase 1: basic display only), so that I know engagement level
53. As a user, I want optional badges on cards (e.g., "Limited Spots," "Discount"), so that I'm alerted to special circumstances
54. As a user, I want cards to optionally show a category tag, so that I can see the activity type
55. As a user, I want a mix of large hero cards and standard vertical cards, so that high-interest activities stand out
56. As a user, I want compact row cards for secondary options, so that I can scan related activities efficiently

---

### 6. Quick Location Action Mini Overlay Map (Stories 57–61)

57. As a user, I want to click the location button on a card, so that a mini overlay map opens
58. As a user, I want the mini map to show the exact location pin, so that I can confirm the location
59. As a user, I want the mini map to be closable via X or clicking outside, so that I can dismiss quickly
60. As a user, I want the mini map to overlay the feed without navigating away, so that discovery continues
61. As a user, I want the mini map to show nearby landmarks, so that I can orient myself

---

### 7. Home Page — Integrated Map Section (Stories 62–70)

62. As a user, I want to see a large embedded map section on the Home page, so that I can browse spatially
63. As a user, I want the map to show all nearby activities as pins, so that I see geographic distribution
64. As a user, I want pins to be color-coded or prioritized by relevance, so that hot activities stand out
65. As a user, I want to click a pin, so that the corresponding card is highlighted in the feed
66. As a user, I want to click a card, so that the corresponding pin is highlighted on the map
67. As a user, I want the map to support pan and zoom, so that I can explore neighborhoods
68. As a user, I want the map to cluster dense pins, so that readability is maintained
69. As a user, I want to set my location manually or use geolocation, so that nearby is relative to me
70. As a user, I want the map to be responsive, so that it's readable on resized windows

---

### 8. Activity Detail Overlay (Stories 80–94)

80. As a user, I want clicking a card to open a full-page premium overlay, so that I see rich details (not a small modal)
81. As a user, I want the overlay to have a smooth entrance animation, so that the transition feels polished
82. As a user, I want the overlay to be closable via X or clicking outside, so that I can return to browsing
83. As a user, I want the overlay to show a hero image at the top, so that I'm visually oriented
84. As a user, I want the overlay to show title, description, and reviews, so that I understand the activity
85. As a user, I want the overlay to show the full schedule (dates, times), so that I can plan attendance
86. As a user, I want the overlay to show pricing breakdown, so that I understand the cost
87. As a user, I want the overlay to show exact location with embedded map, so that I can confirm accessibility
88. As a user, I want the overlay to show an external "Book Now" link, so that I can proceed to booking
89. As a user, I want the overlay to show a save/favorite button, so that I can add to my list
90. As a user, I want the overlay to show a trend flame indicator (Phase 1: basic display), so that I know engagement
91. As a user, I want the overlay to show "similar activities," so that I can explore related options
92. As a user, I want the overlay to support navigation (prev/next activity), so that I can browse without returning to feed
93. As a user, I want the overlay to overlay without losing my scroll position, so that I can return where I left off
94. As a user, I want the overlay to be keyboard-accessible (Esc, arrow keys), so that I can use without a mouse

---

### 9. Favorites System (Stories 95–104)

95. As a user, I want to save activities to favorites, so that I can build a personal wishlist
96. As a user, I want to view saved favorites in a dedicated panel, so that I can review my shortlist
97. As a user, I want to search within favorites, so that I can find a saved activity
98. As a user, I want to filter favorites by category, so that I can group by interest
99. As a user, I want to remove items from favorites, so that I can curate my list
100. As a user, I want to see my favorites count, so that I know how many I've saved
101. As a user, I want favorites to persist across sessions, so that they're saved between visits
102. As a user, I want to share my favorites list with a friend, so that I can recommend activities
103. As a user, I want to sort favorites by date added, activity date, or price, so that I can organize
104. As a user, I want the heart button to show filled when I save, so that I see what I've saved

---

### 10. Smart Search System (Stories 105–115)

105. As a user, I want to search by keyword, so that I can find specific events
106. As a user, I want to search by category name, so that I can narrow by interest
107. As a user, I want to search by neighborhood, so that I can stay in a specific area
108. As a user, I want to search by natural date phrases (e.g., "this weekend," "tonight"), so that I can use conversational queries
109. As a user, I want to search by price intent (e.g., "free," "cheap," "luxury"), so that I can find within budget
110. As a user, I want to search by activity mood (e.g., "romantic," "family-friendly"), so that I can find matching vibe
111. As a user, I want search to be instant and responsive, so that I see results as I type
112. As a user, I want search to suggest popular/recent queries, so that I can find activities I've searched before
113. As a user, I want search to work from any page, so that I can quickly change focus
114. As a user, I want search results to be filterable and sortable, so that I can refine further
115. As a user, I want the search query to be shareable, so that I can send a curated view to friends

---

### 11. Responsive Design & Performance (Stories 149–157)

149. As a user, I want the website optimized for laptop (1200px+), so that I get a premium multi-column experience
150. As a user, I want the website usable on smaller screens (800px+), so that I can use a resized window
151. As a user, I want images lazy-loaded, so that the page loads fast
152. As a user, I want the filter sidebar to collapse on smaller screens, so that the feed takes full width
153. As a user, I want smooth scrolling and instant filter updates, so that the experience feels snappy
154. As a user, I want navigation transitions to be smooth, so that page changes feel polished
155. As a user, I want the map to render efficiently even with many pins, so that interactivity is snappy
156. As a user, I want all text to be legible with high contrast, so that I can read comfortably
157. As a user, I want the site to work on all modern browsers (Chrome, Safari, Firefox, Edge), so that I can use my preferred browser

---

### 12. Accessibility (Stories 158–162)

158. As a user with a keyboard, I want full keyboard navigation (Tab, Shift+Tab, Enter, Esc, Arrow Keys), so that I can browse without a mouse
159. As a user with reduced motion preferences, I want to respect my browser's `prefers-reduced-motion`, so that animations don't cause discomfort
160. As a user with a screen reader, I want semantic HTML and ARIA labels, so that the page is readable
161. As a user with color blindness, I want sufficient contrast and secondary visual indicators, so that I can see all information
162. As a user with low vision, I want font sizes readable and zoomable to 200%+, so that I can enlarge content

---

## Implementation Decisions (Phase 1)

### Deep Modules

#### 1. Activity Catalog Module
**Purpose:** Single source of truth for activities.  
**Interface:** `query(filters, sort, cursor, limit) → { activities, nextCursor, totalCount }`  
**Scope:** Fetches, filters, sorts, caches, handles pagination, computes geo-distance.

#### 2. Filter Engine Module
**Purpose:** Composable, shareable filter sets.  
**Interface:** `buildFilter() → Filter`, `toURL(filter)`, `fromURL(queryString)`  
**Scope:** Serialize/deserialize filters for sharing and bookmarking.

#### 3. Smart Search Parser Module
**Purpose:** Parse natural-language queries.  
**Interface:** `parse(query) → { categories, neighborhoods, dateRange, priceLevel, mood }`  
**Scope:** Extract intent from free text (keywords, date phrases, neighborhoods).

#### 4. Map Adapter Module
**Purpose:** Provider-agnostic map rendering.  
**Interface:** `renderMap()`, `onPinClick()`, `onMapClick()`, `cluster()`, `highlightPin()`  
**Scope:** Wraps Mapbox GL. Supports pan, zoom, clustering.

#### 5. Favorites Store Module
**Purpose:** User's saved activities.  
**Interface:** `add(activity)`, `remove(activityId)`, `list()`, `search()`, `isSaved()`  
**Scope:** Server-persisted favorites with optimistic client cache.

#### 6. Activity Detail Renderer Module
**Purpose:** Compose and display full activity detail overlay.  
**Interface:** `renderDetail(activityId) → DetailPanel`  
**Scope:** Fetches activity data, reviews, similar activities, renders layout.

#### 7. Carousel Controller Module
**Purpose:** Reusable carousel/slider logic.  
**Interface:** `init()`, `next()`, `prev()`, `goToSlide()`, `pause()`, `resume()`  
**Scope:** Featured carousel on Home.

---

### Data Schema (Phase 1)

**Activity**
```
{
  id: UUID,
  title: string,
  description: string,
  category: enum,
  images: [ { url, alt } ],
  location: { lat, lng, address, neighborhood },
  dateStart: ISO 8601 DateTime,
  dateEnd: ISO 8601 DateTime,
  price: { min, max, currency },
  bookingUrl: URL,
  capacity: number,
  reviews: [ Review ],  // Phase 1: external, curated
  createdAt: DateTime,
}
```

**User**
```
{
  id: UUID,
  email: string,
  name: string,
  favorites: [ activityId ],
  preferences: { favoriteCategories, priceRange, distanceMax },
  createdAt: DateTime,
}
```

---

### Tech Stack (Phase 1)

- **Frontend:** Next.js 14+, React, TypeScript, Tailwind CSS
- **Maps:** Mapbox GL JS
- **State:** React Context API + TanStack Query
- **Forms:** React Hook Form
- **DB:** PostgreSQL + PostGIS
- **Backend:** Next.js API Routes or Fastify
- **ORM:** Prisma
- **Caching:** Redis
- **Deployment:** Vercel + Supabase

---

### API Contracts (Phase 1)

#### GET /api/activities
```
Request: { filters, sort, cursor, limit }
Response: { activities: [ Activity ], nextCursor, totalCount }
```

#### POST /api/favorites
```
Request: { activityId: UUID }
Response: { success: boolean, savedAt: DateTime }
```

#### GET /api/favorites
```
Response: { activities: [ Activity ], count: number }
```

#### DELETE /api/favorites/:activityId
```
Response: { success: boolean }
```

#### GET /api/search
```
Request: { query: string }
Response: { activities: [ Activity ], intent: { categories, neighborhoods, dateRange } }
```

---

## Testing Decisions (Phase 1)

### Unit Tests (Priority: High)

1. **Filter Engine** — Serialization, deserialization, URL encoding.
2. **Smart Search Parser** — Intent extraction from various queries.
3. **Carousel Controller** — Slide transitions, pause/resume, keyboard nav.

### Integration Tests (Priority: Medium)

1. **Activity Catalog + Filter Engine** — Query with filters, no cross-contamination.
2. **Favorites Store + Activity Catalog** — Save, retrieve, persist.
3. **Map Adapter + Activity Catalog** — Render pins, sync with feed.

### E2E Tests (Priority: Critical)

1. **Discovery in < 60 seconds** — Open Home → apply filters → scan cards → click → view detail → (optional) save to favorites.
2. **Map Interaction** — Scroll feed, click pin, confirm card highlights.
3. **Favorites Flow** — Save 3 activities, open Favorites, search within, remove one.

### Visual Regression (Priority: Medium)

1. **Activity Cards** — Hero Horizontal, Standard Vertical, Compact Row.
2. **Activity Detail Overlay** — Layout, hero image, information hierarchy.
3. **Top Navigation** — Logo, search bar, nav links.

---

## Out of Scope (Phase 1)

- Sport page (Phase 2)
- Chat AI assistant (Phase 3)
- User profile / personal stats (Phase 2)
- Full Trend Flame system (Phase 2; basic display only in Phase 1)
- Dark mode
- Mobile app
- Booking/payment
- User-generated reviews
- Vendor portal
- Notifications
- Multi-city
- Internationalization (i18n)

---

## Success Metrics (Phase 1)

- User discovers one appealing activity in **< 60 seconds** ✓
- **FCP < 2s**, **LCP < 4s** (performance targets)
- **WCAG AA** accessibility compliance
- **Unit test coverage 80%+**, integration 60%+, E2E pass rate 100%
- **Visual regression** tests pass
- Ready for beta testing

---

## Acceptance Criteria (Phase 1)

- [ ] All user stories (1–104, 149–162) can be opened as tickets
- [ ] Deep modules are testable in isolation
- [ ] E2E test for < 60s discovery passes reliably
- [ ] Visual regression tests pass against design.md
- [ ] Accessibility audit passes WCAG AA
- [ ] Performance targets met (FCP < 2s, LCP < 4s)
- [ ] Code coverage: unit 80%+, integration 60%+
- [ ] Deployment to staging; smoke tests pass
- [ ] Ready for beta user testing

---

**End of PRD Phase 1**
