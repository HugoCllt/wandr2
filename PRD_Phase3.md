# PRD — Phase 3: Intelligence (NL search → Grounded chat → Personalization)

**Owner:** Hugo
**Prerequisite:** P1 + P2 shipped, ≥ 30 days of `EngagementEvent` data
**Reference index:** `spec.md` (feature IDs F1–F13)
**Authority:** CLAUDE.md > ARCHITECTURE.md > this file

> Goal of P3: bolt natural-language understanding on top of the **same feed engine** that has powered every page since P1. Chat is one more consumer of `GetFeedUseCase`, not a parallel system. Recommendations are a new ranker plugged into the same engine. The LLM never invents activities; it only writes explanations grounded in IDs the retrieval already returned.

The ordering is deliberate: NL search ships first (P3.0), then grounded chat (P3.1), then personalization (P3.2). Each sub-phase is independently shippable.

---

## P3.0 — NL search

The search bar gains an LLM intent parser. The chat page does not exist yet.

### In scope

- `IIntentParser` port in `modules/search/domain` — already declared in ARCHITECTURE.md §4.
- `OpenAIIntentParser` adapter in `modules/search/infra`. Uses OpenAI structured output (`response_format: json_schema`) with a zod-derived schema. Model: `gpt-4o-mini`, version pinned.
- The naive parser stays as fallback when the LLM is disabled, errors, or hits the cost cap.
- A new search submit path: text → `IIntentParser` → `IntentDTO` → `intentToFeedQuery` → `GetFeedUseCase` → `FeedResult`. Identical response shape to P1.
- Per-user daily cost cap (see §LLM safety).
- 5-minute cache by `sha1(query + locale)` to amortize repeated phrasings.

### IntentDTO contract

```ts
import { z } from 'zod'

export const IntentDTO = z.object({
  textTokens: z.array(z.string()).default([]),         // residual free text after extraction
  category: z.array(z.enum([/* ActivityCategory enum */])).default([]),
  sportType: z.array(z.string()).default([]),
  neighborhood: z.array(z.string()).default([]),
  date: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('today') }),
    z.object({ kind: z.literal('tonight') }),
    z.object({ kind: z.literal('this-week') }),
    z.object({ kind: z.literal('this-weekend') }),
    z.object({ kind: z.literal('next-weekend') }),
    z.object({ kind: z.literal('range'), startISO: z.string().datetime(), endISO: z.string().datetime() }),
    z.object({ kind: z.literal('none') }),
  ]).default({ kind: 'none' }),
  budget: z.object({
    free: z.boolean().default(false),
    maxCad: z.number().int().nonnegative().nullable().default(null),
  }).default({}),
  groupSize: z.number().int().positive().nullable().default(null),
  indoorOutdoor: z.enum(['indoor','outdoor','either']).default('either'),
  vibe: z.array(z.string()).default([]),               // free-form descriptors, used for ranking, not filtering
})
export type IntentDTO = z.infer<typeof IntentDTO>
```

### Stories

P2 ended at story 65. P3 continues at 66.

66. **NL search submit.** As a user, I type a natural-language query into the navbar; results return as the same `FeedResultDTO` as keyword search. AC: integration test against a fixture set of 30 phrases.

67. **Fallback on LLM failure.** If the LLM call times out (> 1.5s) or errors, the naive parser handles the query and the response includes a header `x-search-mode: naive`. AC: deterministic via fault injection.

68. **Cache hits.** Identical queries within 5 minutes do not call the LLM. AC: integration test asserts only one provider call.

69. **Eval set.** 50 hand-labelled queries; CI runs the eval set on every PR that touches `OpenAIIntentParser` or its prompt. Gate: ≥ 85% intent accuracy (extracted slot-set equality, modulo `textTokens`).

70. **Telemetry.** Each search emits `SEARCHED` with `{ query, parsedFilters, parserMode: 'llm' | 'naive', latencyMs }`.

---

## P3.1 — Grounded chat

The `/chat` route ships. It is the only page that uses the `chat` module, and the `chat` module's only job is orchestration around `GetFeedUseCase`.

### Topology recap (from ARCHITECTURE.md §6)

```
user text
  → IIntentParser.parse → IntentDTO              (same parser as NL search)
  → intentToFeedQuery → FeedQuery
  → GetFeedUseCase.execute → FeedResult          (the SAME engine as Home/Sport/etc.)
  → IExplanationWriter.write(result, intent) → string
  → { activities: ActivityDTO[], explanation }
```

`chat/* → feed/*` is allowed. `feed/* → chat/*` is forbidden — `dependency-cruiser` rule `feed-must-not-depend-on-chat` enforces.

### Stories

71. **Chat route.** `/chat` renders a single-pane conversational UI: input, suggested-prompt carousel, message list. AC: composes `<PageShell preset={CHAT_PRESET} />`; the result list reuses `<FeedGrid>` and `<ActivityCard>`. Zero new card components.

72. **Suggested prompts.** Five suggestions rotating slowly: "date idea tonight", "cheap activity for 4 friends", "indoor because of rain", "best sports class nearby", "hidden cultural gem this weekend". Clicking a suggestion auto-submits. AC: the suggestions are static config in `CHAT_PRESET`.

73. **Submit a message.** Submit calls `POST /api/chat`. The server runs the topology above and returns `{ activities, explanation, requestId }`. AC: response time p95 < 3s on warm cache; < 6s cold.

74. **Streaming explanation.** The `explanation` streams via SSE; activity IDs come back in the first chunk so cards can render immediately, the prose fills in. AC: Playwright happy path; zero CLS while the prose streams.

75. **Conversation history.** Per-session, in memory only for POC. Persisted in `Conversation` only when the session ends (best-effort). AC: drop-on-refresh is acceptable for POC.

76. **Grounded explanation.** The `IExplanationWriter` receives only the IDs returned by `GetFeedUseCase`. It cannot mention an activity not in that set; output is validated and any out-of-vocabulary mention causes a single retry, then a fallback to a templated explanation. AC: schema validation in adapter; integration test injects a mention-of-unknown-id and asserts retry+fallback.

77. **Save and click work as on any other page.** Heart toggles, click navigates to detail. AC: same `<ActivityCard>`.

### LLM safety (mandatory)

Every item below is a CI gate. Missing any one of them blocks the P3.1 PR.

- **Structured output.** Every LLM call uses `response_format: { type: 'json_schema', json_schema }`. The schema is derived from a zod schema and re-validated on receipt.
- **System-prompt isolation.** The system prompt is constant, version-pinned (`SYSTEM_PROMPT_V1`), and contains the model's instructions and the activity-ID vocabulary for explanation writing. **User text is never concatenated into the system prompt.**
- **Per-user daily cost cap.** `cost:user:{userId}:{yyyymmdd}` in cache; hard kill at 80% of budget; `429` with `x-cost-cap: hit` once exceeded. Default budget: $0.50 USD/day.
- **Token caps.** Input: 2048 tokens. Output: 512 tokens.
- **PII redaction in logs.** Emails, phone numbers, full names redacted before any prompt is logged.
- **Out-of-vocabulary rejection.** Explanation output is parsed; any mentioned activity ID not in the retrieval set fails validation.
- **Pinned model version.** Model string includes a date suffix (e.g. `gpt-4o-mini-2024-07-18`); upgrades go through an ADR-style note in ARCHITECTURE.md and a re-run of the eval set.
- **Eval set.** 30 grounded-chat scenarios. Gate: ≥ 90% pass.

---

## P3.2 — Personalization

Adds a ranker that reweights the feed by `UserCategoryAffinity`. It is one more strategy plugged into `modules/feed/application/ranking/`.

### Stories

78. **Affinity computation.** `node-cron` at 03:30 recomputes `UserCategoryAffinity` per user from the trailing 90 days of `EngagementEvent`. Score per category = `Σ weight(eventType) · decay(age)` normalized over the user's total. AC: idempotent; runtime < 2 minutes for 1k users on Neon dev.

79. **Affinity-aware ranker.** A new ranker (`AffinityAwareRanker`) reweights the existing rank by `(1 + α · affinity(category))`, α=0.3 by default. AC: unit tests over fixture users.

80. **Cold-start.** Users with < 5 engagement events fall back to the trend-flame ranker. AC: unit test.

81. **Recommendations on Home and verticals.** When a user is logged in (still the seeded user in POC), the home and vertical pages use the affinity ranker. Anonymous viewers use the trend-flame ranker.

82. **Explainability copy.** Cards optionally show "Popular with people who like Sport" when the affinity ranker pushed an activity above its baseline rank by ≥ 2 positions. AC: copy is generated server-side from rank deltas, no LLM involved.

83. **Opt-out.** Profile setting "Personalized recommendations" toggles affinity weighting. Default on. AC: `Profile.preferences.personalization` (add a single `Json` field; no migration churn).

84. **Anti-bias guard.** Ranker caps the share of `dealKind = PERCENT_OFF` activities at 30% of the first 24 results. AC: unit test.

---

## Out of scope (P3 will not include)

| Item | Why | When |
|---|---|---|
| Real auth | Still POC; the seeded user is sufficient for personalization demos | post-P3 |
| Multi-locale | Still POC | post-P3 |
| Voice input | Token-cap and UX scope | post-P3 |
| Cross-session conversation memory | Cost + privacy work too large for POC | post-P3 |
| Recommendations email digest | Distribution work | post-P3 |

---

## Acceptance gates (CI must pass)

All P1 + P2 gates remain. New gates:

- Eval sets (`50` for NL search, `30` for grounded chat) run on PRs touching the relevant adapter or prompt.
- Output-schema validation rejects out-of-vocab IDs (deliberate test injects one).
- Cost-cap test simulates spend > 80% and asserts `429`.
- `dep:check` rule `feed-must-not-depend-on-chat` is active and a deliberate violation fails.
- A budget snapshot of last week's average chat cost is logged on every CI run for the chat path.

## Definition of done

1. NL search returns parsed intents from real text on the navbar with ≥ 85% eval accuracy.
2. `/chat` works end-to-end: typing a phrase returns activity cards plus a streamed grounded explanation.
3. The seeded user with simulated engagement sees an affinity-reweighted Home; the cold-start user sees the flame-ranked Home.
4. Cost cap demonstrably stops calls when exceeded; logs show the kill event.
5. `dep:check` continues to forbid `feed → chat`.

That is the end of POC scope. Anything beyond is a separate proposal — and probably a separate stage of the product.
