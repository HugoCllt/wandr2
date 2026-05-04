# Wandr — PRD Phase 3: AI & Personalization

**Version:** 1.0  
**Status:** Implementation-Ready  
**Scope:** Chat AI Assistant + Personalized Recommendations + Advanced Personalization  
**Prerequisite:** Phase 1 (Discovery Core) and Phase 2 (Specialization) complete  
**Target Launch:** Q4 2026

---

## Problem Statement

After Phase 1 and 2, Wandr has become a solid discovery platform. However, users still face decision fatigue when faced with thousands of activities. Phase 3 addresses the final frontier:

1. **Users want conversational discovery** — "What's a good date idea for tonight?" instead of manually applying filters.
2. **Users want personalized recommendations** — Suggestions based on their past behavior, preferences, and current context.
3. **Users want the platform to understand their mood and context** — Not just their explicit filters.

---

## Solution (Phase 3)

Build three interconnected features:

1. **Chat AI Assistant** — A conversational interface that parses user intent, queries the activity catalog, and returns personalized suggestions with explanations.
2. **Personalization Engine** — A system that learns user preferences from behavior (viewing, saving, booking history) and uses those to rank and recommend activities.
3. **Smart Recommendations** — Algorithmic and ML-based suggestions tailored to each user's profile, season, time of day, and trending activities.

---

## Scope (Phase 3)

### In Scope
- Chat page with full-width AI assistant interface
- Free-text and suggested prompt input modes
- AI intent parsing (mood, date, group size, budget, neighborhood, activity type)
- Activity catalog querying based on parsed intent
- Response generation with explanations
- Carousel of suggested prompts (rotating, clickable)
- Activity cards returned as fully interactive results
- Conversation history within a session
- Personalization signals from Phase 1 & 2 behavior
- Recommendation ranking algorithm (recency, relevance, user affinity, trend flame)
- Suggested activities based on user profile
- Seasonal and time-of-day considerations
- Cold-start handling (new users without history)
- Caching of common intent queries to reduce LLM calls

### Out of Scope (Phase 3)
- Multi-turn conversational memory (deferred; only single-session for now)
- Voice input (deferred)
- Image generation or visual storytelling (deferred)
- Booking integrations or transaction handling (deferred)
- User-generated activity reviews (deferred)
- Social recommendations (deferred; no friend graph)
- Geo-aware route planning (deferred)
- Calendar integration (deferred)
- Paid recommendation tier (deferred)

---

## User Stories

### 1. Chat Page Foundation (Stories 125–135)

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

### 2. Personalized Recommendations (New stories 161–175)

161. As a returning user, I want to see personalized activity suggestions on my Home page, so that I can discover activities tailored to my interests
162. As a user, I want recommendations based on my past viewing and saving history, so that the suggestions reflect my taste
163. As a user, I want recommendations to consider my favorite categories, so that I see more of what I like
164. As a user, I want recommendations to exclude activities I've already viewed, so that I don't see repeats
165. As a user, I want recommendations to update daily, so that I see fresh suggestions
166. As a user, I want recommendations to take into account the current season and time of day (e.g., indoor on rainy days), so that suggestions are contextual
167. As a user, I want recommendations to include trending activities, so that I can discover what's hot
168. As a user, I want recommendations to explain why they're suggested (e.g., "Popular with people who like Sports"), so that I understand the reasoning
169. As a user, I want to dismiss a recommendation, so that I can skip suggestions I'm not interested in
170. As a user, I want recommendations to improve over time as I interact more, so that they become increasingly personalized
171. As a new user without history, I want to see recommendations based on global trends, so that I can discover popular activities
172. As a user, I want recommendations accessible from Home, Sport, and Chat, so that they're integrated across the platform
173. As a user, I want to understand how recommendations are computed, so that I trust the suggestions
174. As a user, I want to control my recommendation settings (e.g., opt out, adjust weights), so that I have agency over suggestions
175. As a user, I want recommendations to avoid bias (e.g., not over-weight expensive activities), so that I see diverse options

---

## Implementation Decisions (Phase 3)

### New Deep Modules

#### 1. Chat Orchestrator Module
**Purpose:** Parse user intent, query catalog, return activity cards.  
**Responsibility:** Send query to LLM, parse response into structured intent, run catalog query, return formatted cards.  
**Interface:**
- `chat(userMessage, sessionHistory) → { intent, activities, explanation }`
- `suggestPrompts() → [ prompt, prompt, ... ]`
- `parseIntent(query) → { mood, dateRange, groupSize, budget, neighborhood, activityType }`

**LLM Integration:**
- Use OpenAI GPT-4 or Anthropic Claude API
- Provider-agnostic interface (can swap)
- Fallback to rule-based parsing if LLM unavailable

**Caching:**
- Cache intent + results by query hash
- 5-minute TTL (same intent asked multiple times)
- Reduces LLM calls and latency

---

#### 2. Personalization Engine Module
**Purpose:** Compute personalized recommendations.  
**Responsibility:** Aggregate user history, compute affinity scores, rank activities, explain suggestions.  
**Interface:**
- `getRecommendations(userId, context) → [ { activity, score, reason } ]`
- `predictAffinity(user, activity) → score (0..1)`
- `explainRecommendation(user, activity) → string`

**Scoring Factors:**
- User affinity to activity category (based on view/save frequency)
- Trend flame of activity (popular activities weighted higher)
- Recency (recent saves/views weight higher)
- Diversity (avoid too many similar recommendations)
- Context (time of day, season, weather, user location)
- Exclusions (already viewed, explicitly dismissed)

---

#### 3. Recommendation Ranker Module
**Purpose:** Rank activities for display.  
**Responsibility:** Combine signals (affinity, trend, recency, diversity) into a final ranking.  
**Interface:**
- `rank(activities, userId, context) → [ rankedActivities ]`
- Pure transformation with pluggable scoring weights

**Weights (tunable via experiments):**
- User affinity: 40%
- Trend flame: 30%
- Recency: 20%
- Diversity penalty: 10%

---

### Engagement & Behavior Tracking (Phase 3 Additions)

**New Signals to Track:**
- `activity_detail_time_spent` (how long user viewed detail)
- `activity_bookmarks` (saves in favorites)
- `activity_shares` (shares with friends via link)
- `chat_query` (user's chat messages for understanding intent)
- `recommendation_clicked` (user clicked a recommendation)
- `recommendation_dismissed` (user explicitly dismissed)

**Expanded Event Schema:**
```
{
  id: UUID,
  userId: UUID,
  activityId?: UUID,
  eventType: enum (viewed, saved, shared, clicked, dismissed, chat_query),
  timestamp: DateTime,
  duration?: number,  // time spent viewing
  context?: { intent, query, recommendation_id },
}
```

---

### Data Schema Updates (Phase 3)

**User** (additions):
```
{
  ...Phase2Fields,
  behaviors: {
    categoryAffinities: { [category]: score },
    viewHistory: [ { activityId, timestamp } ],
    dismissedRecommendations: [ activityId ],
    chatHistory: [ { query, timestamp } ],
  },
  recommendations: {
    lastUpdated: DateTime,
    reasons: { [activityId]: string },  // explain why recommended
  },
  personalizeSettings: {
    enableRecommendations: boolean,
    weighting: { affinity, trend, recency, diversity },  // user-adjustable
  },
}
```

**Recommendation** (new):
```
{
  id: UUID,
  userId: UUID,
  activityId: UUID,
  score: number,
  reason: string,
  computedAt: DateTime,
  clicked: boolean,
  dismissed: boolean,
}
```

---

### API Contracts (Phase 3)

#### POST /api/chat
```
Request: {
  message: string,
  sessionHistory?: [ { role, content } ],
}

Response: {
  intent: {
    mood?: string,
    dateRange?: { start, end },
    groupSize?: number,
    budget?: { min, max },
    neighborhood?: string,
    activityType?: string,
  },
  activities: [ Activity ],
  explanation: string,
  suggestions: [ ChatMessage ],
}
```

#### GET /api/chat/prompts
```
Response: {
  prompts: [ "Romantic date tonight", "Cheap activity for 4", ... ],
}
```

#### GET /api/recommendations
```
Request: {
  limit?: 10,
  context?: { season, timeOfDay, weather },
}

Response: {
  recommendations: [ { activity, score, reason } ],
}
```

#### POST /api/recommendations/dismiss
```
Request: { activityId: UUID }
Response: { success: boolean }
```

#### GET /api/recommendations/settings
```
Response: {
  enableRecommendations: boolean,
  weighting: { affinity, trend, recency, diversity },
}
```

#### PUT /api/recommendations/settings
```
Request: { enableRecommendations?, weighting? }
Response: { success: boolean }
```

---

### Architectural Decisions (Phase 3)

1. **Chat uses LLM for intent parsing** (OpenAI / Anthropic)
   - Not a chatbot for general conversation, only activity discovery
   - Strict schema: input (query) → intent (structured) → catalog query → results
   - LLM failures fall back to rule-based parsing

2. **Intent caching reduces LLM load**
   - Common intents (e.g., "date idea tonight") cached
   - 5–10 min TTL; same query returns cached results
   - Dramatically reduces API costs and latency

3. **Recommendations computed daily**
   - Batch job runs nightly for each active user
   - Personalization signals ingested asynchronously
   - Results cached in Redis for instant retrieval

4. **Affinity scores computed from normalized signals**
   - View count, save count, time-to-save all normalized
   - Categorical preferences derived from cluster of saves
   - Avoids overfitting to any single signal

5. **Cold-start handled by global trends**
   - New users (no history) receive trending activities
   - After 5+ interactions, personalization kicks in
   - Gradual ramp-up from global to personal

6. **Recommendation explainability built-in**
   - Each recommendation includes a reason: "Popular with people who like Sports"
   - Builds trust and helps users understand ranking
   - Reason stored for potential feedback loop

7. **A/B testing framework for recommendation weights**
   - Weights (affinity %, trend %, recency %) are tunable
   - Experiment framework to test different weights
   - Measure CTR, save rate, engagement time

---

## Testing Decisions (Phase 3)

### Unit Tests (Priority: High)

1. **Chat Intent Parser** — Verify correct intent extraction for various queries.
   - "date idea for tonight" → { mood: "romantic", dateRange: today }
   - "cheap padel near me" → { activityType: "padel", budget: "cheap", location: "nearby" }

2. **Recommendation Ranker** — Verify correct ranking with various scoring weights.
   - Same activity with higher affinity scores higher
   - Trending activities weighted appropriately
   - Diversity penalty prevents too many similar recommendations

3. **Affinity Score Computation** — Verify accurate affinity derivation from behavior.
   - User with 10 sport saves, 3 dining saves → sport affinity 77%
   - User with no history → default affinity 0%

### Integration Tests (Priority: Medium)

1. **Chat Orchestrator + Activity Catalog** — Send query, parse intent, retrieve activities, verify results relevant.
2. **Recommendation Engine + User Behavior** — Log user events, compute affinity, generate recommendations, verify quality.
3. **Cold-start Handling** — New user with no history gets trending recommendations.

### E2E Tests (Priority: Critical)

1. **Chat Discovery** — Open Chat page → enter "date idea for tonight" → receive activity suggestions → click one → open detail → save to favorites.
2. **Recommendation Discovery** — View Home page → see recommended activities section → click recommendation → open detail → (optional) save.
3. **Recommendation Improvement** — Save 10 activities in "Sports" category → recommendations shift toward sports activities.
4. **Intent Parsing Variety** — Test diverse intents (romantic, budget, neighborhood, group size, mood, weather) → verify correct parsing and results.

### Visual Regression (Priority: Medium)

1. **Chat Page Layout** — Centered chat area, suggested prompts carousel, response cards.
2. **Recommended Activities Section** — Appears on Home, Sport pages, in Chat results.
3. **Explanation Text** — Reasoning for recommendation clearly displayed.

### Performance Tests (Priority: High)

1. **LLM Latency** — Chat response time < 3 seconds (including LLM inference).
2. **Recommendation Computation** — Nightly job completes for all users in < 1 hour.
3. **Cache Hit Rate** — 60%+ of chat queries hit cache (same intent asked multiple times).

---

## Out of Scope (Phase 3)

- Multi-turn memory (long conversation context across sessions) — deferred to v2
- Voice input or speech-to-text — deferred
- Image generation or visual recommendations — deferred
- Booking integrations or transaction handling — deferred
- User-generated reviews or comments — deferred
- Social recommendations or friend-based suggestions — deferred
- Route planning or transportation integration — deferred
- Calendar integration or iCal export — deferred
- Email or push notification integrations — deferred
- Advanced ML models (deep learning, collaborative filtering at scale) — deferred; basic heuristics sufficient for Phase 3

---

## Success Metrics (Phase 3)

- **Chat adoption** — 30%+ of users use Chat at least once per week
- **Chat intent accuracy** — 85%+ of intents parsed correctly (validated by user feedback)
- **Recommendation CTR** — 15%+ click-through rate on recommendations (vs. 8% baseline Home browse)
- **Recommendation diversity** — No single category > 40% of recommendations
- **Affinity accuracy** — Personalization improves over time (CTR increases 20%+ after 10 interactions)
- **LLM cost** — Intent caching reduces calls by 60%+
- **Cold-start conversion** — New users with 0 history convert at 80% of rate of experienced users (via trends)
- **Performance maintained** — FCP < 2s, LCP < 4s (Chat page < 3s response including LLM)

---

## Acceptance Criteria (Phase 3)

- [ ] All user stories (125–135, 161–175) implemented and testable
- [ ] Chat Orchestrator module is testable in isolation
- [ ] Recommendation Ranker module is testable in isolation
- [ ] LLM intent parsing fallback to rule-based parser works
- [ ] Intent caching implemented; 60%+ cache hit rate
- [ ] Recommendations computed nightly; delivered instantly on-page
- [ ] Cold-start handled (new users receive trending recommendations)
- [ ] E2E tests pass (Chat discovery, Recommendations, Intent parsing)
- [ ] Visual regression tests pass (Chat layout, recommendation cards)
- [ ] Performance tests pass (Chat response < 3s, nightly job < 1 hour)
- [ ] Accessibility audit passes WCAG AA
- [ ] Code coverage: unit 80%+, integration 60%+, E2E pass rate 100%
- [ ] A/B testing framework in place for weight tuning
- [ ] Ready for public launch

---

## Post-Launch Roadmap (Future)

- **Multi-turn Conversational Memory** — Remember context across multiple user turns
- **Collaborative Filtering** — Recommend based on similar users' behavior
- **Seasonal & Event-Based Triggers** — Proactive recommendations ("Valentine's Day coming up")
- **Email Digests** — Weekly personalized activity digest via email
- **Mobile App** — Native iOS/Android experience
- **Social Features** — Friend recommendations, shared itineraries
- **Advanced ML** — Deep learning models for affinity prediction
- **Booking Integration** — Direct booking with ticketing partners

---

**End of PRD Phase 3**
