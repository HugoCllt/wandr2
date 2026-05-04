# Wandr — Product Requirements Document

**Version:** 2.0 (Phased)  
**Status:** Implementation-Ready  
**Updated:** 2026-05-04

---

## Overview

This is the master PRD for Wandr, a premium web platform for discovering activities in Montréal. The full specification has been split into **three phased documents** to keep each phase's context clean and focused.

**Goal:** Help users discover one appealing activity in under 60 seconds.

**Design North Star:** Warmth, clarity, speed. Premium minimalism inspired by Apple's refinement and Airbnb's lifestyle energy.

---

## Phased Approach

Wandr is built in three phases, each with its own focused PRD:

### [Phase 1: Discovery Core](./PRD_Phase1.md) — Q2 2026

**MVP for launching the platform.**

**Features:**
- Home page with featured carousel, activity discovery feed, and sticky filters
- Activity cards (3 variants) with images, prices, dates, and trend indicators
- Sticky left sidebar filters (price, distance, date, category, indoor/outdoor, free/paid)
- Smart search (keywords, categories, neighborhoods, date phrases)
- Live embedded map showing nearby activities with pin/card synchronization
- Activity detail full-page overlay with description, reviews, map, and booking links
- Favorites system (save, search, filter, remove)
- Global navigation and top navbar with search
- Responsive design (laptop-first, usable down to 800px)
- Accessibility (WCAG AA) and performance targets (FCP < 2s, LCP < 4s)

**Deep Modules:**
- Activity Catalog, Filter Engine, Smart Search Parser, Map Adapter, Favorites Store, Activity Detail Renderer, Carousel Controller

**User Stories:** 1–104, 149–162 (105 stories total)

**Success Metric:** User discovers appealing activity in < 60 seconds

---

### [Phase 2: Specialization & Personalization](./PRD_Phase2.md) — Q3 2026

**Specialization for sports enthusiasts + engagement transparency + personal insights.**

**Features:**
- Sport page with sports-specific discovery (Watch, Play, Classes, Deals, Outdoor)
- Deal and discount badges on activities
- Full Trend Flame system (low/medium/full/super) based on engagement signals
- Trend Flame filtering (show trending only)
- User Profile page with avatar, name, vibe line
- Profile stats (activities explored, saved, favorite category, monthly outings, trend score)
- Profile quick actions (Favorites, Preferences, History, Settings panels)
- Category breakdown visualization on profile
- Preferences management (location, price range, category preferences)
- History panel (viewed/interacted activities)
- Settings panel (account, email, notifications, privacy)

**Deep Modules:**
- Trend Flame Scorer, Profile & Stats Aggregator, Sports-specific filters

**New User Stories:** 71–79, 116–123, 136–147 (24 stories total)

**Engagement Tracking:** Views, saves, searches, filter applications, shares

---

### [Phase 3: AI & Personalization](./PRD_Phase3.md) — Q4 2026

**Conversational discovery + ML-powered recommendations + smart personalization.**

**Features:**
- Chat page with full-width AI assistant interface
- Free-text and suggested prompt input modes
- AI intent parsing (mood, date, budget, neighborhood, group size, activity type)
- Activity suggestions with explanations
- Rotating carousel of suggested prompts
- Conversation history within a session
- Personalized activity recommendations on Home/Sport pages and Chat
- Recommendation ranking based on user affinity, trends, recency, diversity
- Seasonal and time-of-day context awareness
- Cold-start recommendations (new users see trending activities)
- Recommendation dismissal and settings
- Explanation of why activities are recommended

**Deep Modules:**
- Chat Orchestrator, Personalization Engine, Recommendation Ranker

**New User Stories:** 125–135, 161–175 (21 stories total)

**ML/Algorithm:** Affinity scoring, collaborative filtering, trend weighting, A/B testing framework

---

## Cross-Phase Architecture

### Shared Principles

1. **Data Models** — Consistent across all phases (Activity, User, EngagementEvent schemas expand incrementally)
2. **API Contracts** — REST JSON APIs with clear boundaries
3. **Tech Stack** — Next.js + React + TypeScript + Tailwind + Mapbox + PostgreSQL + PostGIS
4. **Design System** — Warm beige (primary), orange (action), deep black (structure), soft grays (support)
5. **Testing Pyramid** — Unit (80%+), Integration (60%+), E2E (golden paths), Visual Regression

### Shared Components (Reused Across Phases)

- Activity Card variants (Hero Horizontal, Standard Vertical, Compact Row)
- Top Navigation Bar (appears in all phases)
- Filter Sidebar (Phase 1 base; extended in Phase 2 with sports filters; reused in Phase 3)
- Activity Detail Overlay (Phase 1 base; extended in Phase 2/3)
- Carousel Controller (Phase 1 hero carousel; Phase 3 suggested prompts)

### Database Schema Evolution

| Field | Phase 1 | Phase 2 | Phase 3 |
|-------|---------|---------|---------|
| Activity.images | ✓ | ✓ | ✓ |
| Activity.location | ✓ | ✓ | ✓ |
| Activity.trendFlame | basic display | full system | used in recommendations |
| Activity.sports | — | ✓ | ✓ |
| Activity.dealBadge | — | ✓ | ✓ |
| User.avatar | — | ✓ | ✓ |
| User.categoryAffinities | — | — | ✓ |
| EngagementEvent table | basic (views, saves) | expanded (searches, filters, shares) | expanded (chat queries, dismissals) |
| Recommendation table | — | — | ✓ |

---

## Design System (All Phases)

Refer to `design.md` for the authoritative visual identity. Key elements:

- **Color Palette:** Warm beige background, orange actions, deep black structure, soft grays
- **Typography:** Modern sans-serif, elegant, readable, premium, calm
- **Motion:** Subtle (hover lift, image zoom, smooth panel open, fluid transitions)
- **UX Rules:** Fast to scan, understand, act; clear CTA hierarchy; minimal friction

---

## Tech Stack Recommendation (All Phases)

**Frontend:**
- Next.js 14+, React, TypeScript, Tailwind CSS
- React Context API + TanStack Query (server state)
- Mapbox GL JS (maps)
- Headless UI / Radix UI (accessible components)
- React Hook Form (forms)
- Vitest + React Testing Library (testing)

**Backend:**
- Node.js runtime
- Next.js API Routes or Fastify
- TypeScript
- PostgreSQL + PostGIS (geo queries)
- Prisma (ORM)
- Redis (caching, session management)
- Bull or p-queue (job queue for nightly aggregations)

**Phase 3 Additions:**
- OpenAI API or Anthropic Claude API (Chat intent parsing)
- Meilisearch or Elasticsearch (optional; advanced search in Phase 3+)

**Deployment:**
- Vercel (Next.js hosting)
- Supabase or Railway (Postgres + PostGIS)
- Sentry (error tracking)
- Vercel Analytics (performance monitoring)

---

## Testing Strategy (All Phases)

### Testing Pyramid

```
        /\
       /  \ E2E (Critical user journeys)
      /____\
     /      \
    /        \ Integration (Module interactions)
   /________\
  /          \
 /            \ Unit (Isolated deep modules)
/__________\
```

### By Phase

**Phase 1:** Discovery flow, filter application, map interaction, favorites save/restore, search parsing

**Phase 2:** Sport page discovery, trend flame filtering, profile stats accuracy, history retrieval

**Phase 3:** Chat intent parsing, recommendation ranking, cold-start handling, affinity computation

---

## Performance Targets (All Phases)

- **FCP (First Contentful Paint):** < 2 seconds
- **LCP (Largest Contentful Paint):** < 4 seconds
- **Chat response time:** < 3 seconds (including LLM inference)
- **Filter updates:** Instant (debounced max 300ms)
- **Map interactions:** < 100ms
- **Nightly jobs:** Complete for all users in < 1 hour

---

## Accessibility (All Phases)

- **WCAG AA** compliance mandatory
- Keyboard navigation (Tab, Shift+Tab, Enter, Esc, Arrow Keys)
- Respect `prefers-reduced-motion`
- Semantic HTML and ARIA labels
- High contrast (special attention to orange-on-beige palette)
- Font sizes zoomable to 200%+

---

## Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| **1** | User discovers activity in < 60s | ✓ (core goal) |
| **1** | FCP/LCP targets met | < 2s / < 4s |
| **2** | Sport page engagement | 20%+ weekly visits |
| **2** | Trend Flame understanding | 85%+ users understand it |
| **3** | Chat adoption | 30%+ weekly users |
| **3** | Chat intent accuracy | 85%+ correct parsing |
| **3** | Recommendation CTR | 15%+ (vs. 8% baseline) |

---

## How to Use This PRD

1. **Phase 1 Development:** Read `PRD_Phase1.md`. Contains 105 user stories, deep modules, data schema, API contracts, testing strategy.
2. **Phase 2 Development:** Read `PRD_Phase2.md`. Contains 24 new user stories, 2 new deep modules, schema updates, API additions.
3. **Phase 3 Development:** Read `PRD_Phase3.md`. Contains 21 new user stories, 3 new deep modules, schema additions, LLM integration.

Each phase PRD is **self-contained** but references Phase 1 as the base.

---

## Further Notes

### Design Alignment

All implementations must align with `design.md`:
- Visual identity (color, typography, spacing)
- Emotional goal: "I want to go out tonight" → "Oh wow… this looks good"
- Motion design (subtle, polished, no flashy effects)
- Premium minimalism (generous spacing, clear hierarchy, soft corners)

### Privacy & Data

- User location optional (can browse without geolocation)
- Favorites and stats private to user account
- Event tracking for personalization with user consent
- GDPR / privacy law compliance required

### Extensibility

This phased approach is designed for:
- Parallel team development (Phase 1, 2, 3 can be worked on simultaneously with clear boundaries)
- Clear feature boundaries (no creeping scope)
- Incremental launch (Phase 1 MVP, Phase 2 specialization, Phase 3 AI)
- Post-launch iteration (weights tuning, A/B testing, new features in v2+)

---

## Document Index

- **`PRD.md`** (this file) — Master overview and phased architecture
- **`PRD_Phase1.md`** — Discovery Core (Home, Filters, Search, Favorites, Map, Detail)
- **`PRD_Phase2.md`** — Specialization & Personalization (Sport, Trend Flame, Profile)
- **`PRD_Phase3.md`** — AI & Personalization (Chat, Recommendations, Affinity)
- **`design.md`** — Visual identity, motion design, emotional goals
- **`spec.md`** — Original functional requirements (reference)

---

**Last Updated:** 2026-05-04  
**Next Review:** After Phase 1 beta feedback (Q2 2026)
