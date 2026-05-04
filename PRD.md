# Wandr — Product Requirements Document

**Product:** Web platform for discovering activities in Montreal  
**Architecture:** Domain-Driven Design + Clean Architecture + Selective Hexagonal  
**Status:** Phase 1 Implementation-Ready

---

## Vision

Help users discover one appealing activity in under 60 seconds via a laptop-first, premium interface combining curated feeds, intelligent filtering, live maps, and AI assistance.

**Design north star:** Warmth + clarity + speed. Premium minimalism inspired by Apple's refinement and Airbnb's lifestyle exploration.

---

## Phased Delivery

### Phase 1 (Q2 2026) — Discovery Core
**Features:** Home page, activity catalog, filters, search, map, favorites, detail overlay  
**User Stories:** 1–104, 149–162 (105 stories)  
**Modules:** domain/activities, domain/feed, application/feed, infrastructure/database  
**Success Metric:** Discover activity in < 60 seconds

### Phase 2 (Q3 2026) — Specialization
**Features:** Sport page, trend flame, user profile/stats  
**User Stories:** 71–79, 116–123, 136–147 (24 stories)  
**Modules:** domain/personalization, application/search, expand presets

### Phase 3 (Q4 2026) — Intelligence
**Features:** AI chat, personalized recommendations  
**User Stories:** 125–135, 161–175 (21 stories)  
**Modules:** domain/chatbot, application/chat, infrastructure/llm

---

## User Stories

### Discovery (Phase 1)

1. As a user, I want to see featured activities on Home, so I'm immediately exposed to trending experiences
2. As a user, I want to filter by price/distance/date/category, so I can narrow my search
3. As a user, I want to search naturally ("jazz tonight," "cheap padel"), so I can use conversational queries
4. As a user, I want to see activities on a map with synchronized cards, so I can explore spatially
5. As a user, I want to view full activity details (hero image, description, reviews, map, booking), so I can make informed decisions
6. As a user, I want to save activities to favorites, so I can build a personal wishlist
7. As a user, I want infinite scroll with sorting options, so I can explore at my own pace
8. As a user, I want responsive design on smaller screens, so I can browse on any device
9. As a user, I want WCAG AA accessibility, so I can use the site with assistive tech

### Specialization (Phase 2)

10. As a sports enthusiast, I want a dedicated Sport page with sports categories (Watch, Play, Classes, Deals), so I can find sports-specific activities
11. As a user, I want to see a trend flame indicator (low/medium/full/super), so I understand activity momentum
12. As a user, I want a personal profile showing my stats (explored, saved, favorite category, monthly outings), so I can see my engagement
13. As a user, I want to manage preferences and view my activity history, so I can customize my experience

### Intelligence (Phase 3)

14. As a user, I want to chat with an AI assistant ("date idea for tonight"), so I can discover via conversation
15. As a user, I want personalized activity recommendations, so I see suggestions tailored to my taste
16. As a user, I want the app to learn from my behavior (viewing, saving, bookings), so recommendations improve over time

---

## API Contracts (Phase 1)

### GET /api/activities
```
Query: { filters?: Filter[], sort?: string, cursor?: string, limit: number }
Response: { items: ActivityDTO[], nextCursor?: string, totalCount: number }
```

### POST /api/favorites
```
Body: { activityId: string }
Response: { success: boolean, savedAt: string }
```

### GET /api/search
```
Query: { q: string }
Response: { items: ActivityDTO[], intent: { categories, neighborhoods, dateRange } }
```

---

## Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **FCP** | < 2s |
| **LCP** | < 4s |
| **Accessibility** | WCAG AA |
| **Browser Support** | Modern browsers (Chrome, Safari, Firefox, Edge) |
| **Responsiveness** | Laptop-first (1200px+), usable to 800px |

---

## Out of Scope

- Native mobile apps
- User-generated reviews
- Direct booking/payment
- Multi-city support
- Dark mode
- Email/push notifications

---

## Architecture Overview

See ARCHITECTURE.md for detailed layer responsibilities.

**Layer Stack:**
```
Web (Next.js pages, hooks, API routes)
  ↓
Contracts (DTOs, view models, API shapes)
  ↓
Application (Use cases, orchestration)
  ↓
Domain (Business logic, entities, ports)
  ↓
Infrastructure (Adapters, Prisma, external services)
```

**Key Modules:**
- **domain/activities** — Activity entity, repository port
- **domain/feed** — Feed logic, rankers, sorters
- **application/feed** — GetFeedUseCase orchestration
- **infrastructure/database** — Prisma adapters
- **packages/contracts** — ActivityDTO, FeedDTO, view models
- **packages/presets** — Page configurations (HOME_PRESET, SPORT_PRESET, etc.)

---

## Success Criteria (Phase 1)

- [ ] All user stories (1–104, 149–162) completable
- [ ] Architecture enforced (no layer violations)
- [ ] Unit test coverage: domain 90%+, application 80%+
- [ ] E2E test: discovery < 60 seconds
- [ ] FCP < 2s, LCP < 4s
- [ ] WCAG AA compliance
- [ ] Monorepo builds cleanly, no circular deps
- [ ] Ready for beta testing

---

**Documentation:** ARCHITECTURE.md | CLAUDE.md | STEP_ZERO.md | ARCHITECTURE_RECOMMENDATIONS.md
