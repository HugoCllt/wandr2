# Phase 3 PRD — Intelligence (Chat + Recommendations)

**Timeline:** Q4 2026  
**Prerequisite:** Phase 1 + Phase 2 complete

---

## In Scope

**Features:**
- Chat page with AI assistant (free text + suggested prompts)
- Natural language intent parsing (mood, date, budget, neighborhood, group size)
- Activity suggestions with explanations
- Rotating prompt suggestions
- Personalized recommendations on Home/Sport pages
- Recommendation ranking (affinity, trends, recency, diversity)
- Seasonal/time-of-day context awareness
- Cold-start strategy (new users see trending activities)

---

## User Stories (21 total)

### Chat Interface (11)
125. Dedicated Chat page
126. "What do you feel like doing today?" prompt
127. Free-text input (conversational queries)
128. Suggested prompt carousel
129. Rotating, clickable suggestions
130. Parse intent → return activity cards
131. Explain recommendations ("Found 3 good options for a romantic dinner")
132. Returned cards are clickable/saveable
133. Fast responses (< 3s)
134. Session conversation history
135. Minimal, premium interface

### Personalized Recommendations (10)
161. See recommendations on Home
162. Based on viewing/saving history
163. Respect favorite categories
164. Exclude already viewed
165. Update daily
166. Consider season, time of day, weather
167. Include trending activities
168. Show explanation ("Popular with people who like Sports")
169. Dismiss individual recommendations
170. Recommendations improve over time
171. New users see global trending
172. Recommendations accessible from Home, Sport, Chat
173. Understand how recommendations work
174. Control recommendation settings (opt out, adjust weights)
175. Avoid bias (expensive activities not over-weighted)

---

## Architecture (Phase 3 Additions)

**New Packages:**
- `domain/chatbot` — Conversation entity, intent types, IIntentParser port
- `application/chat` — ChatWithActivitiesUseCase, StreamResponseUseCase
- `infrastructure/llm` — OpenAIAdapter, AnthropicAdapter (implements ILLMProvider)
- `infrastructure/streaming` — SSE adapter for token-by-token LLM responses

**Chat Flow:**
```
User Query
  ↓
IntentParser port (domain chatbot)
  ↓
GetFeedUseCase (application feed, filtered by parsed intent)
  ↓
LLMProvider (infrastructure llm, generate explanation)
  ↓
Stream response + Activity cards to client (via SSE)
```

**Recommendation Flow:**
```
User history (viewed, saved, shared, bookings)
  ↓
Affinity calculator (domain personalization)
  ↓
Ranking algorithm (application recommendations)
  ↓ 
GetFeedUseCase with rankers
  ↓
ActivityDTO[] with explanations
```

**Intent Caching:**
- Cache intent + results by query hash
- 5-min TTL (same intent asked multiple times)
- Reduce LLM calls by 60%+

---

## Success Metrics

- Chat adoption: 30%+ weekly users
- Intent accuracy: 85%+
- Recommendation CTR: 15%+ (vs. 8% baseline)
- Affinity improves CTR 20%+ after 10 interactions
- LLM cost reduced 60%+ via caching
- Cold-start conversion at 80% of experienced users

---

**Next:** Post-launch roadmap (collaborative filtering, email digests, mobile, social)
