# Phase 1 PRD — Discovery Core (MVP)

**Timeline:** Q2 2026  
**Goal:** Laptop-first discovery platform. User finds one appealing activity in < 60 seconds.

---

## In Scope

**Features:**
- Home page with featured carousel, discovery feed, sticky filters
- Activity catalog with infinite scroll, sorting, filtering
- Smart search (keywords, date phrases, neighborhoods, categories, intents)
- Live map with pins synchronized to feed
- Activity detail full-page overlay
- Favorites system (save, list, search, filter, remove)
- Responsive design (laptop-first, usable to 800px)
- WCAG AA accessibility

**Not in Scope (Phase 2+):**
- Sport page, chat, profile, trend flame system
- Dark mode, mobile app, notifications

---

## User Stories (105 total)

### Navigation & Search (7)
1. Persistent navbar with logo, search, Home/Sport/Chat/Profile links
2. Global search bar with autocomplete
3. Smart search parsing ("jazz tonight" → jazz + today's date)
4. Shareable search queries via URL
5. Reset to default view
6. Page navigation works across all screens
7. Tab navigation support

### Featured Carousel (8)
8. Auto-rotating hero carousel at page top
9. Large, inspiring images
10. Title, date, price, location on each card
11. "Book Now" CTA
12. Manual prev/next navigation
13. Pause on hover
14. Keyboard navigation (arrows, tab)
15. Smooth animations

### Sticky Filters (14)
16. Left sidebar persists during scroll
17. Price range filter (free, <$20, $20–$50, $50+)
18. Distance filter (walking, 1km, 5km, 10km+)
19. Date filter (today, this week, this month, upcoming)
20. Indoor/outdoor toggle
21. Category multi-select
22. Free/paid toggle
23. Multi-select composition
24. Instant application (no submit button)
25. Clear all filters at once
26. Active filter count badge
27. Save filter presets
28. Sidebar collapse on small screens
29. Quick access to "Explore," "Saved" modes

### Discovery Feed (12)
30. Responsive grid (3 cols → 2 cols → 1)
31. Infinite scroll auto-load
32. Sort options: relevance, popularity, price, date
33. Sort indicator
34. Card preview (image, title, key info)
35. Hover preview with expanded details
36. Smooth hover animations (lift, shadow)
37. Click to open detail overlay
38. Feed remembers scroll position
39. Skeleton loader while fetching
40. Activity count display
41. No duplicate results

### Activity Cards (15)
42. Cover image (lazy-loaded)
43. Title prominent
44. Distance from user
45. Price display
46. Date and time
47. Dynamic updates based on location
48. Location-pin button for mini map
49. Heart/save button
50. Heart fills on save
51. Trend flame indicator (Phase 1: basic display only)
52. Optional badges (limited spots, discount, new)
53. Optional category tag
54. Mix of card variants (hero, standard, compact)
55. Smooth transitions
56. Accessible focus states

### Mini Map (5)
57. Click location → overlay map opens
58. Show exact pin with activity name
59. Closable (X button, click outside)
60. Overlay on feed (no nav away)
61. Show nearby landmarks

### Integrated Map (9)
62. Large map section on Home
63. All nearby activities as pins
64. Pins color-coded by relevance
65. Click pin → highlight card
66. Click card → highlight pin
67. Pan and zoom support
68. Cluster dense pins
69. Manual or geolocation location setting
70. Responsive, readable on narrow screens

### Activity Detail (15)
80. Full-page premium overlay (not modal)
81. Smooth entrance animation
82. Closable (X, click outside, Esc)
83. Hero image at top
84. Title, description, reviews
85. Full schedule (dates, times, recurrence)
86. Pricing breakdown
87. Exact location with embedded map
88. External "Book Now" link
89. Save/favorite button
90. Trend flame display
91. Similar activities section
92. Prev/next navigation
93. Doesn't lose scroll position
94. Keyboard accessible

### Favorites (10)
95. Save activities via heart button
96. View saved in dedicated panel
97. Search within favorites
98. Filter favorites by category
99. Remove items
100. Favorites count visible
101. Persist across sessions
102. Share favorites list
103. Sort by date added, activity date, price
104. Heart indicator on cards/detail

### Responsive & Performance (9)
149. Laptop-first optimization (1200px+)
150. Usable on 800px+ screens
151. Lazy image loading
152. Sidebar collapse on small screens
153. Smooth scrolling, instant filters
154. Smooth navigation transitions
155. Efficient map rendering
156. High text contrast
157. Works on modern browsers

### Accessibility (5)
158. Full keyboard navigation (Tab, Shift+Tab, Enter, Esc, Arrows)
159. Respects prefers-reduced-motion
160. Semantic HTML, ARIA labels
161. Color blind friendly (contrast + secondary indicators)
162. Zoomable to 200%+

---

## Architecture (Phase 1)

**Packages:**
- `domain/activities` — Activity entity, IActivityRepository port
- `domain/feed` — FeedQuery, FeedResult entities
- `application/feed` — GetFeedUseCase (merges filters, queries repo, ranks, paginates)
- `infrastructure/database` — PrismaActivityRepository adapter
- `contracts` — ActivityDTO, FeedDTO
- `presets` — HOME_PRESET configuration
- `apps/web` — Next.js pages, hooks, API routes

**No Hexagonal:** Filters, sorting, detail are application logic, not external deps  
**Selective Hexagonal:** Database only (repo pattern)

**Dependency flow:**
```
web/ → application/feed → domain/feed → domain/activities
     → infrastructure/database (implements IActivityRepository)
     → contracts (DTOs)
     → presets (HOME_PRESET)
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Discovery time | < 60 seconds |
| FCP | < 2s |
| LCP | < 4s |
| Accessibility | WCAG AA |
| Unit test coverage (domain) | 90%+ |
| Integration test coverage (application) | 80%+ |
| E2E test: discovery flow | Pass |

---

## Acceptance Criteria

- [ ] All 105 user stories completable
- [ ] Zero layer violations (CLAUDE.md enforcement)
- [ ] E2E test passes (discovery < 60s)
- [ ] Visual regression tests pass
- [ ] Performance targets met
- [ ] Accessibility audit passes WCAG AA
- [ ] Code coverage targets met
- [ ] Ready for beta testing

---

**Next Phase:** Phase 2 — Sport page, trend flame, profile stats
