# Phase 2 PRD — Specialization (Sport + Engagement + Profile)

**Timeline:** Q3 2026  
**Prerequisite:** Phase 1 complete

---

## In Scope

**Features:**
- Sport page (Watch, Play, Classes, Deals, Outdoor sections)
- Deal badges (20% Off, 2-for-1, Limited Spots)
- Trend Flame system (low/medium/full/super) from engagement signals
- User Profile page (avatar, vibe, stats, preferences, history, settings)
- Profile stats (explored, saved, favorite category, monthly outings, trend score)
- Category breakdown visualization

---

## User Stories (24 total)

### Sport Page (8)
116. Dedicated Sport page
117. Sections: Watch, Play, Classes, Deals, Outdoor
118. Deal badges visible
119. Outdoor section
120. Reuses Home feed/filter system (consistency)
121. Trending sports first
122. Filter by sport type
123. Limited spots warnings

### Trend Flame System (9)
71. Understand flame represents engagement momentum
72. Low flame → niche, quiet
73. Medium flame → healthy interest
74. Full flame → popular
75. Super flame → major trend
76. Computed from views, saves, bookings, recency
77. Elegant icon design (partially filled)
78. Filter by trending status
79. Updates as engagement data arrives

### User Profile (7)
136. Personal profile page
137. Avatar + name visible
138. "Vibe line" bio
139. Stats display (viewed, saved, favorite category)
140. Monthly outings stat
141. Personal trend score
142. Category breakdown chart
143. Quick action buttons (Favorites, Preferences, History, Settings)
144. Favorites panel accessible
145. Preferences panel (location, price, categories)
146. History panel (viewed activities)
147. Settings panel (account, email, privacy)

---

## Architecture (Phase 2 Additions)

**New Packages:**
- `domain/personalization` — Affinity logic, category preferences
- `application/search` — SearchActivitiesUseCase leverages smart parser
- Extend `packages/presets` (SPORT_PRESET, ROMANTIC_PRESET, FOOD_PRESET)

**Engagement Tracking:**
- Log events: viewed, saved, searched, filtered, shared
- Aggregate nightly for stats
- Trend Flame computed from last 90 days

**Trend Flame Scoring:**
```
Low:     0–25th percentile
Medium:  25–60th percentile
Full:    60–90th percentile
Super:   90–100th + high velocity
```

---

## Success Metrics

- Sport page engagement: 20%+ weekly users
- Trend Flame understood by 85%+ users
- Profile stats accurate to within 1% of real data
- Performance maintained (FCP < 2s, LCP < 4s)

---

**Next Phase:** Phase 3 — Chat, recommendations
