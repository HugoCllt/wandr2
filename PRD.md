# Wandr — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Implementation-Ready  
**Last Updated:** 2026-05-04

---

## Problem Statement

Montréalers struggle to decide what to do tonight or this weekend. Existing event listing websites feel transactional, mobile-first, noisy, and uninspiring. Users scroll through generic listings, feel overwhelmed by choice, and lack confidence in their decisions. Discovery takes longer than it should — the friction exceeds the reward.

**Core pain points:**
- Multiple silos of activities (sports sites, concert sites, dining sites) with no unified view
- Laptop web experiences that are optimized for mobile and feel cramped
- No personalization or curation; purely algorithmic or alphabetical
- No quick way to explore "what's near me and affordable right now"
- Decision fatigue: too many options, no guidance

---

## Solution

Build a **premium, exploration-first web platform** that helps users discover appealing activities in Montreal **in under 60 seconds**.

The platform combines:

1. **A curated discovery feed** (home page) with intelligent filtering, multi-column layout, and rich card previews
2. **A live, interactive map** synchronized with the feed for spatial discovery
3. **A trend flame system** — proprietary engagement scoring to surface activities with momentum
4. **An AI chat assistant** to handle natural-language intent ("date idea for tonight" → curated activity suggestions)
5. **Personal favorites and stats** to encourage repeat visitation and deeper engagement
6. **A sports-focused discovery page** with deal badges and seasonal categories (Watch, Play, Classes, etc.)

**Design north star:** Warmth, clarity, and speed. Premium minimalism inspired by Apple's refinement and Airbnb's lifestyle energy. Every interaction should feel intentional and frictionless.

**Emotional goal:** User opens Wandr thinking "I want to go out tonight," then within seconds thinks "Oh wow… this looks good."

---

## User Stories

### 1. Global Navigation & Search

1. As a user, I want a persistent top navigation bar with the Wandr logo, so that I can orient myself and always access navigation
2. As a user, I want to navigate between Home, Sport, Chat, and Profile pages via the top navbar, so that I can switch contexts quickly
3. As a user, I want a global search bar in the top navbar, so that I can search for activities by keyword, neighborhood, category, or date phrase from anywhere on the site
4. As a user, I want search suggestions and autocomplete, so that I can complete a search faster
5. As a user, I want search results to parse intent (e.g., "jazz tonight" → jazz + today's date), so that I can enter natural language instead of form fields
6. As a user, I want my search query to be shareable via URL, so that I can send a curated filtered view to a friend
7. As a user, I want to clear my search and reset to the default Home view, so that I can start browsing fresh

---

### 2. Home Page — Featured Carousel

8. As a user, I want to see a prominent hero carousel at the top of the Home page, so that I'm immediately exposed to top upcoming activities
9. As a user, I want the carousel to rotate slowly and automatically, so that new activities come into view without overwhelming me
10. As a user, I want to manually navigate the carousel (prev/next buttons), so that I can control the pace of discovery
11. As a user, I want large, high-quality hero images in the carousel, so that I'm visually inspired
12. As a user, I want each carousel card to show the activity title, date, price, and location, so that I can make a quick decision
13. As a user, I want a prominent "Book Now" call-to-action on carousel items, so that I can proceed quickly if interested
14. As a user, I want the carousel to pause when I hover, so that I have time to read and absorb
15. As a user, I want the carousel to be keyboard-accessible (arrow keys, tab navigation), so that I can navigate without a mouse

---

### 3. Home Page — Sticky Left Sidebar Filters

16. As a user, I want a sticky filter sidebar on the left side of the home page, so that it stays visible while I scroll the feed
17. As a user, I want to filter by price range (free, <$20, $20–$50, $50+), so that I can see activities within my budget
18. As a user, I want to filter by distance from a given location (walking, 1km, 5km, 10km+), so that I find nearby activities
19. As a user, I want to filter by date (today, this week, this month, upcoming), so that I can plan ahead or find spontaneous tonight plans
20. As a user, I want to filter by indoor vs. outdoor, so that weather considerations are factored in
21. As a user, I want to filter by category (Sports, Dining, Culture, Music, Entertainment, etc.), so that I can narrow to my interests
22. As a user, I want to filter by trending status (show trending only), so that I can discover high-momentum activities
23. As a user, I want multi-select filters (select multiple categories, multiple price ranges, etc.), so that I can compose complex queries
24. As a user, I want filters to apply instantly without a "submit" button, so that the feedback is immediate and exploration is fluid
25. As a user, I want to clear all filters at once, so that I can reset without clicking each individually
26. As a user, I want to see a badge or count of active filters, so that I know my current constraints at a glance
27. As a user, I want to save filter presets (e.g., "My Weekend Favorites"), so that I can apply common filter sets quickly
28. As a user, I want the sidebar to collapse on smaller screens, so that the feed takes full width on laptop-resized windows
29. As a user, I want the sidebar to include quick access to "Explore" (all activities), "Trending Now," and "Saved," so that I can jump between modes

---

### 4. Home Page — Activity Discovery Feed

30. As a user, I want to browse activities in a responsive grid or list layout, so that I can explore many options at once
31. As a user, I want the grid to adapt to my screen size (3 columns on large desktop, 2 on smaller), so that the layout remains readable
32. As a user, I want infinite scroll (or pagination) so that I can keep exploring without page reloads
33. As a user, I want to sort activities by relevance (default), popularity, price (low to high, high to low), and date (upcoming soonest), so that I can customize the order
34. As a user, I want a visual indicator of my current sort, so that I know what order I'm viewing
35. As a user, I want each activity card to show a compelling preview (image, title, key info), so that I can scan quickly
36. As a user, I want a hover preview on activity cards (expanded details without opening), so that I get a peek before committing to open the full detail view
37. As a user, I want smooth card animations (soft lift on hover, subtle shadows), so that interactions feel polished
38. As a user, I want to click a card to open the full detail overlay, so that I can dive deeper
39. As a user, I want the feed to remember my scroll position when I close a detail overlay, so that I don't lose my place
40. As a user, I want "load more" to be automatic via infinite scroll, so that the experience is fluid and doesn't feel like pagination
41. As a user, I want the feed to show a skeleton loader while fetching new activities, so that I know more content is coming

---

### 5. Activity Cards — Core Elements

42. As a user, I want each activity card to display a cover image, so that I'm visually drawn to activities
43. As a user, I want images to be lazy-loaded, so that the page loads quickly and efficiently
44. As a user, I want each card to show the activity title prominently, so that I know what it is at a glance
45. As a user, I want each card to show the distance from me, so that I can assess travel convenience
46. As a user, I want each card to show the price, so that I can stay within my budget
47. As a user, I want each card to show the date and start time, so that I can check availability
48. As a user, I want the distance and price to update dynamically based on my location preference, so that they remain relevant
49. As a user, I want to see a small location-pin button on each card, so that I can open a quick map preview
50. As a user, I want to see a heart/save button on each card, so that I can add activities to my favorites
51. As a user, I want the heart button to fill/highlight when I save, so that I get instant feedback
52. As a user, I want to see a trend flame indicator on each card, so that I know the activity's engagement level
53. As a user, I want optional badges on cards (e.g., "Limited Spots," "20% Off," "New"), so that I'm alerted to special circumstances
54. As a user, I want cards to optionally show a category tag (e.g., "Sports," "Dining"), so that I can see the activity type
55. As a user, I want the card layout to use a mix of large hero horizontal cards and standard vertical cards, so that high-interest activities stand out
56. As a user, I want compact row cards for secondary or similar-activity suggestions, so that I can scan related options efficiently

---

### 6. Quick Location Action (Mini Overlay Map)

57. As a user, I want to click the location button on an activity card, so that a mini overlay map opens
58. As a user, I want the mini map to show the exact location pin with the activity title, so that I can confirm the location
59. As a user, I want the mini map to be closable via an X button or clicking outside, so that I can dismiss it quickly
60. As a user, I want the mini map to remain overlaid on the feed without navigating away, so that discovery flow continues
61. As a user, I want the mini map to show nearby relevant landmarks or addresses, so that I can orient myself

---

### 7. Home Page — Integrated Map Section

62. As a user, I want to see a large embedded map section on the Home page, so that I can browse activities spatially
63. As a user, I want the map to show all nearby activities as pins, so that I can see geographic distribution
64. As a user, I want pins to be color-coded or prioritized by trend flame, so that hot activities stand out visually
65. As a user, I want to click a pin on the map, so that the corresponding activity card is highlighted or revealed in the feed
66. As a user, I want to click an activity card, so that the corresponding pin on the map is highlighted
67. As a user, I want the map to support pan and zoom, so that I can explore different neighborhoods
68. As a user, I want the map to cluster dense pins (if there are many), so that readability is maintained
69. As a user, I want to set my location manually or use my browser's geolocation, so that nearby is relative to me
70. As a user, I want the map to be responsive and readable on smaller laptop screens, so that it doesn't dominate on narrow viewports

---

### 8. Trend Flame System

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

### 9. Activity Detail Overlay

80. As a user, I want clicking an activity card to open a full-page premium overlay, so that I see rich, immersive details (not a small modal)
81. As a user, I want the overlay to have a smooth entrance animation, so that the transition feels polished
82. As a user, I want the overlay to be closable via an X button or clicking outside, so that I can return to browsing
83. As a user, I want the overlay to show a hero image at the top, so that I'm visually oriented
84. As a user, I want the overlay to show the activity title, description, and reviews, so that I understand what it is and what others think
85. As a user, I want the overlay to show the full schedule (dates, times, recurring info), so that I can plan attendance
86. As a user, I want the overlay to show pricing breakdown, so that I understand the cost
87. As a user, I want the overlay to show the exact location with an embedded map, so that I can confirm I can get there
88. As a user, I want the overlay to show an external "Book Now" or "Learn More" link, so that I can proceed to booking/external site
89. As a user, I want the overlay to show a save/favorite button, so that I can add to my list
90. As a user, I want the overlay to show a trend flame indicator, so that I know its momentum
91. As a user, I want the overlay to show "similar activities" recommendations, so that I can explore related options
92. As a user, I want the overlay to support navigation (previous/next activity), so that I can browse without returning to the feed
93. As a user, I want the overlay to display on top of the feed without losing my scroll position, so that I can return where I left off
94. As a user, I want the overlay to be keyboard-accessible (Esc to close, arrow keys to navigate), so that I can use it without a mouse

---

### 10. Favorites System

95. As a user, I want to save activities to my favorites, so that I can build a personal wishlist
96. As a user, I want to view my saved favorites in a dedicated panel, so that I can review my shortlist
97. As a user, I want to search within my favorites, so that I can find a saved activity by name or keyword
98. As a user, I want to filter my favorites by category, so that I can group by interest
99. As a user, I want to remove items from favorites, so that I can curate my list
100. As a user, I want to see my favorites count, so that I know how many I've saved
101. As a user, I want my favorites to persist across sessions, so that they're saved between visits
102. As a user, I want to share my favorites list with a friend, so that I can recommend activities
103. As a user, I want to sort my favorites by date added, activity date, or price, so that I can organize my list
104. As a user, I want a heart button to show filled/highlighted on favorite activities in the feed and detail, so that I see what I've saved

---

### 11. Smart Search System

105. As a user, I want to search for activities by keyword, so that I can find specific events or types
106. As a user, I want to search by category name (e.g., "sports"), so that I can narrow by interest
107. As a user, I want to search by neighborhood name (e.g., "Old Montreal," "Plateau"), so that I can stay in a specific area
108. As a user, I want to search by natural-language date phrases (e.g., "this weekend," "tonight," "next Friday"), so that I can use conversational queries
109. As a user, I want to search by price intent (e.g., "free activities," "cheap," "luxury"), so that I can find activities in my budget
110. As a user, I want to search by activity mood/intent (e.g., "romantic," "family-friendly," "adventurous"), so that I can find activities that match my vibe
111. As a user, I want search results to be instant and responsive, so that I see results as I type
112. As a user, I want search to suggest popular queries and recent searches, so that I can find activities I've searched before
113. As a user, I want search to be global and work from any page, so that I can quickly change my discovery focus
114. As a user, I want search results to be filterable and sortable, so that I can refine the results further
115. As a user, I want the search query to be saveable as a shareable link, so that I can send a curated discovery to friends

---

### 12. Sport Page

116. As a user, I want a dedicated Sport page focused on sports and athletic activities, so that I can find sports-specific events
117. As a user, I want the Sport page to include sections like "Watch Live," "Play Yourself," "Group Classes," so that I can choose my level of involvement
118. As a user, I want to see sports deals and discount badges (e.g., "20% Off," "2-for-1"), so that I can find bargains
119. As a user, I want to see outdoor sports activities in a dedicated section, so that I can explore seasonal options
120. As a user, I want the Sport page to use the same card and filtering system as Home, so that the experience is consistent
121. As a user, I want trending sports activities to appear first, so that I see what's hot
122. As a user, I want to filter sports by type (hockey, padel, yoga, climbing, etc.), so that I can find my sport
123. As a user, I want to see limited-spots warnings on sports classes, so that I know availability
124. As a user, I want the Sport page to be fully responsive and usable on smaller screens, so that I can browse on a laptop resized to a smaller width

---

### 13. Chat Page

125. As a user, I want a dedicated Chat page with an AI assistant, so that I can ask conversational questions about activities
126. As a user, I want to see the prompt "What do you feel like doing today?" at the top, so that I'm invited to share my mood
127. As a user, I want to enter free-text queries (e.g., "date idea for tonight"), so that I can use natural language
128. As a user, I want to see suggested prompt examples (carousel), so that I can get inspiration if I'm unsure what to ask
129. As a user, I want the suggested prompts to rotate slowly and be clickable, so that I can auto-start a conversation
130. As a user, I want the Chat page to parse my intent and return relevant activity cards, so that the assistant understands my mood
131. As a user, I want the assistant to explain its recommendations (e.g., "I found 3 good options for a romantic dinner"), so that I understand the reasoning
132. As a user, I want the activity cards returned by Chat to be fully interactive (clickable to detail, saveable), so that I can take action from Chat results
133. As a user, I want the Chat page to feel fast and responsive, so that I don't experience lag
134. As a user, I want the Chat page to remember my conversation history during a session, so that follow-up questions make sense
135. As a user, I want the Chat page to be minimal and premium, so that the focus is on the content and conversation

---

### 14. Profile Page

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
148. As a user, I want my profile to be accessible from any page via the top navbar, so that I can check my stats anytime

---

### 15. Responsive Design & Performance

149. As a user, I want the website to be optimized for laptop/desktop screens (1200px+), so that I get a premium multi-column experience
150. As a user, I want the website to be usable on smaller screens (800px+), so that I can use it on a resized laptop window
151. As a user, I want images to be lazy-loaded, so that the page loads fast on slow connections
152. As a user, I want the filter sidebar to collapse on smaller screens, so that the main feed takes full width
153. As a user, I want smooth scrolling and instant filter updates, so that the experience feels snappy
154. As a user, I want navigation transitions to be smooth, so that page changes feel polished
155. As a user, I want the map to render efficiently even with many pins, so that interactivity is not sluggish
156. As a user, I want all text to be legible and have high contrast, so that I can read comfortably
157. As a user, I want the site to work on all modern browsers (Chrome, Safari, Firefox, Edge), so that I can use my preferred browser

---

### 16. Accessibility

158. As a user with a keyboard, I want full keyboard navigation (Tab, Shift+Tab, Enter, Esc, Arrow Keys), so that I can browse without a mouse
159. As a user with reduced motion preferences, I want to respect my browser's `prefers-reduced-motion` setting, so that animations don't cause discomfort
160. As a user with a screen reader, I want semantic HTML and ARIA labels, so that the page is readable by assistive technology
161. As a user with color blindness, I want sufficient contrast and secondary visual indicators (not just color), so that I can see all information
162. As a user with low vision, I want font sizes to be readable and zoomable to at least 200%, so that I can enlarge content

---

## Implementation Decisions

### Architecture & Modules

The following **deep modules** form the core of the implementation. Each has a narrow, stable interface and is testable in isolation:

#### 1. Activity Catalog Module
**Purpose:** Single source of truth for all activities.  
**Responsibility:** Query, filter, sort, cache, and paginate activities. Compute geo-distance. Handle map clustering.  
**Interface:** 
- Query contract: `{ filters, sort, cursor, limit } → { activities, nextCursor, totalCount }`
- Filters: category, price, distance, date, indoor/outdoor, free/paid, trending
- Sorts: relevance, popularity, price, date, distance

**Notes:** Encapsulates database queries, caching strategy, and indexing. Can swap between SQL/NoSQL/API-backed storage without changing calling code.

---

#### 2. Filter Engine Module
**Purpose:** Composable, serializable, shareable filter sets.  
**Responsibility:** Build, apply, serialize, and deserialize filters. URL-encode for sharing.  
**Interface:**
- `buildFilter(spec) → Filter`
- `applyFilter(filter, activities) → filteredActivities`
- `toURL(filter) → queryString`
- `fromURL(queryString) → filter`

**Notes:** Filters are immutable and serializable so they can be bookmarked, shared, and saved as presets.

---

#### 3. Trend Flame Scorer Module
**Purpose:** Proprietary engagement scoring.  
**Responsibility:** Compute trend flame level from engagement signals.  
**Interface:**
- `scoreFlame(activity) → { level: "low" | "medium" | "full" | "super", score: number }`
- Inputs: views, saves, bookings, engagement_velocity, recency, capacity_fill

**Notes:** Pure function, deterministic, easy to unit test. Can be tuned without touching the activity feed.

---

#### 4. Smart Search Parser Module
**Purpose:** Parse natural-language search queries into structured intent.  
**Responsibility:** Extract categories, neighborhoods, date phrases, price intent, mood/vibe from free text.  
**Interface:**
- `parse(query) → { categories, neighborhoods, dateRange, priceLevel, mood }`
- Examples: "jazz tonight" → { categories: ["Music"], dateRange: today, mood: null }

**Notes:** Pure transformation. Can be enhanced with an LLM-backed parser without changing the interface.

---

#### 5. Map Adapter Module
**Purpose:** Provider-agnostic map rendering.  
**Responsibility:** Render map, manage pins, handle clustering, sync with feed.  
**Interface:**
- `renderMap(containerId, pins, options) → MapInstance`
- `onPinClick(handler)`
- `onMapClick(handler)`
- `highlightPin(pinId)`
- `cluster(pins, zoomLevel) → clusteredPins`

**Notes:** Wraps Mapbox GL or Google Maps. Allows swapping providers without touching components.

---

#### 6. Favorites Store Module
**Purpose:** User's saved activities.  
**Responsibility:** Add, remove, list, search, filter favorites. Persist to server.  
**Interface:**
- `add(activity)`
- `remove(activityId)`
- `list(filter, sort) → activities`
- `search(query) → activities`
- `isSaved(activityId) → boolean`

**Notes:** Server-persisted with optimistic client-side cache. Sync conflicts resolved server-side.

---

#### 7. Chat Orchestrator Module
**Purpose:** Parse user intent, query catalog, return activity cards.  
**Responsibility:** Send query to LLM, parse response into structured intent, run catalog query, return formatted cards.  
**Interface:**
- `chat(userMessage) → { intent, activities, explanation }`
- `suggestPrompts() → [ prompt, prompt, ... ]`

**Notes:** LLM-provider-agnostic (can swap OpenAI ↔ Anthropic ↔ local). Fallback to rule-based parsing if LLM is unavailable.

---

#### 8. Profile & Stats Aggregator Module
**Purpose:** Compute user profile stats.  
**Responsibility:** Count viewed activities, saved count, favorite category, monthly outing frequency, personal trend score.  
**Interface:**
- `getStats(userId) → { viewed, saved, favoriteCategory, monthlyOutings, trendScore }`
- Pure aggregation from event logs

**Notes:** Precomputed and cached; can be recomputed on demand or via background job.

---

#### 9. Activity Detail Renderer Module
**Purpose:** Compose and display the full activity detail overlay.  
**Responsibility:** Fetch full activity data, fetch reviews, fetch similar activities, render layout.  
**Interface:**
- `renderDetail(activityId) → DetailPanel`

**Notes:** Composes data from Catalog, Reviews API, and Similarity Engine.

---

#### 10. Carousel Controller Module
**Purpose:** Reusable carousel/slider logic.  
**Responsibility:** Rotation timing, manual nav, pause-on-hover, accessibility, slide control.  
**Interface:**
- `init(containerSelector, options) → CarouselInstance`
- `next()`, `prev()`, `goToSlide(index)`, `pause()`, `resume()`

**Notes:** Used by both the Home hero carousel and the Chat suggested prompts carousel.

---

### Data Schema

#### Activity
```
{
  id: UUID,
  title: string,
  description: string,
  category: enum (Sports, Dining, Culture, Music, Entertainment, etc.),
  images: [ { url, alt } ],
  location: { lat, lng, address, neighborhood },
  dateStart: ISO 8601 DateTime,
  dateEnd: ISO 8601 DateTime,
  recurring: { frequency, until }?,
  price: { min, max, currency },
  bookingUrl: URL,
  capacity: number,
  capacityFilled: number,
  engagementSignals: {
    views: number,
    saves: number,
    bookings: number,
    reviews: [ Review ],
  },
  createdAt: DateTime,
  updatedAt: DateTime,
}
```

#### User
```
{
  id: UUID,
  email: string,
  name: string,
  avatar: URL?,
  vibeLine: string?,
  location: { lat, lng }?,
  preferences: {
    favoriteCategories: [ string ],
    priceRange: { min, max },
    distanceMax: number,
    indoorOutdoor: enum,
  },
  favorites: [ activityId ],
  createdAt: DateTime,
}
```

#### Review
```
{
  id: UUID,
  activityId: UUID,
  authorName: string,
  rating: 1..5,
  text: string,
  createdAt: DateTime,
}
```

---

### API Contracts

**Note:** Contracts are described at the boundary. Internal modules may use different formats.

#### GET /api/activities
Query activities with filters.
```
Request: {
  filters: { category?, price?, distance?, date?, indoorOutdoor?, free?, trending? },
  sort: "relevance" | "popularity" | "price" | "date",
  cursor?: string,
  limit: 10..50,
}

Response: {
  activities: [ Activity ],
  nextCursor?: string,
  totalCount: number,
}
```

#### POST /api/favorites
Add activity to favorites.
```
Request: { activityId: UUID }
Response: { success: boolean, savedAt: DateTime }
```

#### DELETE /api/favorites/:activityId
Remove from favorites.
```
Response: { success: boolean }
```

#### GET /api/favorites
List user's favorites.
```
Request: { filter?, sort?, search? }
Response: { activities: [ Activity ], count: number }
```

#### POST /api/chat
Send a chat message.
```
Request: { message: string }
Response: { 
  intent: { categories, neighborhoods, dateRange, mood },
  activities: [ Activity ],
  explanation: string,
}
```

#### GET /api/profile
Get authenticated user's profile.
```
Response: {
  id: UUID,
  name: string,
  avatar: URL?,
  vibeLine: string?,
  stats: { viewed, saved, favoriteCategory, monthlyOutings, trendScore },
  categoryBreakdown: { [category]: count },
}
```

---

### Tech Stack Recommendation

**Frontend:**
- **Framework:** Next.js 14+ (React-based, SSR/SSG, API routes, excellent DX)
- **Language:** TypeScript (type safety, refactoring confidence)
- **Styling:** Tailwind CSS (utility-first, design tokens match design.md)
- **State Management:** React Context API + TanStack Query (for server state)
- **Maps:** Mapbox GL JS (premium, performant, clustering, custom styling)
- **Form Handling:** React Hook Form (minimal, performant, integrates with TypeScript)
- **UI Components:** Headless UI / Radix UI (accessible, unstyled, composable)
- **Charts/Stats:** Recharts (for profile category breakdown)
- **Testing:** Vitest + React Testing Library (fast, modern, great for isolated unit tests)
- **Linting:** ESLint + Prettier (code quality and formatting)

**Backend:**
- **Runtime:** Node.js (aligns with frontend, shared language, large ecosystem)
- **Framework:** Next.js API Routes or Fastify (minimal, opinionated, fast)
- **Language:** TypeScript
- **Database:** PostgreSQL + PostGIS (for geo queries; PostGIS handles nearby/distance queries efficiently)
- **ORM:** Prisma (type-safe, migrations, great DX)
- **Caching:** Redis (for catalog caching, session management)
- **Search (optional):** Meilisearch or Elasticsearch (for advanced full-text search if needed)
- **LLM Integration:** OpenAI SDK or Anthropic SDK (for Chat page; can swap)
- **Job Queue:** Bull or p-queue (for background tasks like trend score recomputation)

**Deployment:**
- **Hosting:** Vercel (Next.js native, easy deployment, built-in analytics)
- **Database Hosting:** Supabase or Railway (Postgres-as-a-service, PostGIS support)
- **CDN:** Vercel CDN (automatic)
- **Monitoring:** Sentry (error tracking), Vercel Analytics (performance)

**Justification:**
- React is the ecosystem you know; ecosystem is large and mature.
- Next.js provides SSR, API routes, and image optimization out of the box.
- TypeScript ensures refactoring safety, especially important as features scale.
- Tailwind matches the premium minimalism design goal (tokens align with design.md).
- Mapbox GL is a premium choice that matches the design aspiration.
- Postgres + PostGIS handles geo queries efficiently.
- Vercel + Supabase is the fastest path to a scalable, production-ready app.

---

### Architectural Decisions

1. **SSR for Home, Sport, Chat; ISR (Incremental Static Regeneration) for Activity Detail**
   - Home, Sport, Chat are user-state-dependent (filters, location). SSR ensures fresh data.
   - Activity Detail is mostly static (activity info, reviews). ISR revalidates every 60s, fast response for returning users.

2. **Optimistic UI for Favorites**
   - Add/remove from favorites is instant on the client, syncs in background. Network errors roll back.

3. **Infinite Scroll with Cursor Pagination**
   - More natural on desktop than traditional pagination. Cursor-based (vs. offset) handles real-time insertions well.

4. **Map Pins Cluster on Zoom Level**
   - Prevents pin overload. Clicking a cluster zooms in.

5. **Chat Responses Cached by Intent**
   - Same intent (e.g., "date idea for tonight") returns cached results if asked within 5 minutes, reducing LLM calls.

6. **Trend Flame Computed Nightly**
   - Not real-time. Reduces computational load. Updates every 24h are acceptable for a discovery use case.

7. **Favorites Stored Server-Side**
   - User's favorites are authoritative on the server; client cache is ephemeral.

---

## Testing Decisions

### Testing Philosophy

- **Test external behavior**, not implementation details.
- **Unit tests** for pure, isolated modules.
- **Integration tests** for modules that compose together.
- **E2E tests** for critical user journeys (the < 60s discovery promise).
- **Visual regression tests** for design-critical components (cards, detail overlay).

### Modules & Test Scope

#### Unit Tests (Highest Priority)

1. **Trend Flame Scorer**
   - Input: activity with engagement signals.
   - Verify: correct flame level for various signal combinations.
   - Example: `{ views: 1000, saves: 100, bookings: 50 } → "full"`

2. **Smart Search Parser**
   - Input: free-text query.
   - Verify: correct intent extraction (categories, neighborhoods, date, mood).
   - Examples:
     - "jazz tonight" → { categories: ["Music"], dateRange: today }
     - "cheap padel Old Montreal" → { categories: ["Sports"], neighborhood: "Old Montreal", priceLevel: "cheap" }

3. **Filter Engine**
   - Input: filter spec.
   - Verify: correct serialization/deserialization, URL encoding, composition.
   - Example: `{ category: "Sports", price: { max: 50 } }` → `?category=Sports&priceMax=50`

4. **Profile Stats Aggregator**
   - Input: user event log.
   - Verify: correct counts and aggregations.
   - Example: 50 viewed, 10 saved → { viewed: 50, saved: 10, savingRate: 0.2 }

5. **Carousel Controller**
   - Input: carousel state, nav commands.
   - Verify: correct slide transitions, pause/resume, keyboard nav.
   - Example: goToSlide(3) on a 5-slide carousel → slide 3 active.

#### Integration Tests (Medium Priority)

1. **Activity Catalog + Filter Engine**
   - Query catalog with filters.
   - Verify: results respect all filters, no cross-contamination.

2. **Favorites Store + Activity Catalog**
   - Add activity to favorites, retrieve favorites.
   - Verify: persistence, consistency.

3. **Chat Orchestrator + Activity Catalog**
   - Send a chat message.
   - Verify: intent extracted, catalog queried, results returned as activity cards.

4. **Map Adapter + Activity Catalog**
   - Render map with activity pins.
   - Verify: pins placed correctly, clustering works, click-through to detail works.

#### E2E Tests (Golden Path; Critical Priority)

1. **Discovery in < 60 Seconds**
   - Open Home.
   - Apply filters (e.g., "Tonight, Sports, <$30, within 1km").
   - Scan activity cards (images, prices, trend flames).
   - Click a card.
   - Confirm activity detail opens with hero, description, map, booking link.
   - **Success metric:** Task completed in < 60 seconds without errors.

2. **Save to Favorites and Retrieve**
   - From Home, save 3 activities to favorites.
   - Navigate to Profile.
   - Open Favorites panel.
   - Verify all 3 are listed, can be searched, can be removed.

3. **Chat to Activity Discovery**
   - Navigate to Chat.
   - Enter "date idea for tonight."
   - Verify assistant returns activity cards.
   - Click a card.
   - Confirm detail overlay opens.

4. **Map Interaction**
   - Scroll Home feed.
   - Confirm map section is visible with pins.
   - Click a pin.
   - Verify corresponding activity card highlights/scrolls into view.

#### Visual Regression Tests (Design Fidelity; Medium Priority)

Test key components for visual consistency with `design.md`:

1. **Activity Card (3 variants)**
   - Hero Horizontal: large, high-contrast image, prominent CTA.
   - Standard Vertical: balanced proportions, clear hierarchy.
   - Compact Row: minimal, scannable.

2. **Activity Detail Overlay**
   - Hero image, title, flame indicator in correct positions.
   - Spacing and typography match design.md.

3. **Trend Flame Indicator**
   - Low, Medium, Full, Super flame icons render correctly.
   - Color (orange) and fill percentage correct.

4. **Top Navigation Bar**
   - Logo, search bar, nav links in correct order.
   - Sticky behavior on scroll.

5. **Filter Sidebar**
   - All filter categories present.
   - Sticky on scroll.
   - Collapses on small screens.

### Testing Pyramid

```
        /\
       /  \  E2E (3–5 critical user journeys)
      /____\
     /      \
    /        \ Integration (Activity Catalog + Filters, Chat + Catalog, etc.)
   /________\
  /          \
 /            \ Unit (Trend Scorer, Search Parser, Filter Engine, Stats, Carousel)
/__________\
```

**Target Coverage:**
- Unit: 80%+ coverage on isolated modules.
- Integration: 60%+ coverage on key compositions.
- E2E: 3–5 golden paths (discovery, favorites, chat, map).
- Visual Regression: Key card variants and overlay.

---

## Out of Scope (for v1)

1. **Native Mobile Apps** — Web-only, laptop-first. Mobile responsiveness is a constraint, not a first-class experience.

2. **User-Generated Content / Reviews** — Reviews come from external sources (Yelp, Google, etc.) or trusted curators. Users cannot submit reviews in v1.

3. **Booking & Payment** — Direct booking is out of scope. Links point to external booking sites. Wandr is a discovery/curation layer, not a booking engine.

4. **Vendor / Admin Portal** — No ability for activity providers to submit or manage listings. Data is curated manually or via approved data sources.

5. **Multi-City Support** — Scoped to Montréal only. Expansion to other cities deferred.

6. **Notifications & Email Digests** — No email follow-ups or push notifications in v1. Future feature.

7. **Social Graph / Sharing** — No friends, followers, or social features. Basic share link only.

8. **Offline Mode** — Requires internet. No offline caching or sync.

9. **Dark Mode** — Single light theme (warm beige + orange) per design.md. Dark mode deferred.

10. **Personalized Recommendations Engine** — v1 uses filtering and smart search, not ML-based recommendations. Deferred to v2+.

11. **Waitlists & Ticketing** — No in-app ticketing or waitlist management.

12. **Internationalization (i18n)** — Copy structure allows future FR translation, but v1 launches in English only.

---

## Further Notes

### Design Alignment

The PRD explicitly defers to `design.md` for visual identity, motion design, and emotional goals. Engineers and designers must stay aligned on:

- **Color Palette:** Warm beige (primary background), orange (actions), deep black (structure), soft grays (support).
- **Typography:** Modern sans-serif, premium, calm, slightly editorial.
- **Motion Design:** Subtle (soft hover lift, image zoom, smooth panel open, fluid transitions). No flashy effects.
- **Emotional Goal:** "I want to go out tonight" → "Oh wow… this looks good" in seconds.

All UI changes should be validated against this north star.

### Accessibility (WCAG AA)

- Verify color contrast: orange-on-beige may require testing and possible adjustment.
- Full keyboard navigation: Tab, Shift+Tab, Enter, Esc, Arrow Keys.
- Respect `prefers-reduced-motion` in browser settings.
- Semantic HTML and ARIA labels for screen readers.
- Font sizes zoomable to at least 200%.

### Performance Targets

- Home page: **< 2s First Contentful Paint** (FCP), **< 4s Largest Contentful Paint** (LCP).
- Lazy-load images: visible on-screen first, then progressively.
- Infinite scroll: no perceived lag when loading next page.
- Filter updates: instant (debounced to max 300ms).
- Map interactions: sub-100ms response time.
- Chat responses: < 3s including LLM inference.

### Data & Privacy

- User location is optional (can browse without location).
- Favorites and stats are private to the user account.
- No third-party tracking or data selling.
- GDPR / privacy law compliance required (stretch goal for launch, tighten post-launch).

### Future Extensibility (Not in v1, but keep in mind)

1. **Recommendations Engine** — ML model to predict user interests. Requires user event tracking.
2. **Booking Integration** — Direct booking API integrations (Ticketmaster, Eventbrite, etc.).
3. **Social Features** — Friends, shared itineraries, group planning.
4. **Marketplace** — Merchants can submit activities, manage listings (vendor portal).
5. **Premium Tier** — Early access, exclusive events, advanced search, personalization.

---

## Phasing (Suggested for sequencing)

**Phase 1 (MVP):** Home + Catalog + Filters + Map + Activity Detail + Favorites + Smart Search basic.  
**Phase 2:** Sport page + Full Trend Flame system + Profile stats.  
**Phase 3:** Chat page + Advanced personalization + Recommendations.

This PRD covers Phase 1 + Phase 2. Phase 3 is deferred based on usage patterns and team bandwidth.

---

## Acceptance Criteria (High-Level)

- [ ] All user stories can be opened as tickets and implemented independently.
- [ ] Deep modules are testable in isolation.
- [ ] E2E test for < 60s discovery passes reliably.
- [ ] Visual regression tests pass against design.md mockups.
- [ ] Accessibility audit (axe, Lighthouse) passes WCAG AA.
- [ ] Performance targets met (FCP < 2s, LCP < 4s).
- [ ] Code coverage: unit 80%+, integration 60%+.
- [ ] Deployment to staging; smoke tests pass.
- [ ] Ready for beta user testing.

---

**End of PRD**
