import type { ChatRecommendationDTO } from './ChatRecommendationDTO';

/**
 * Wire events the chat endpoint streams to the browser as newline-delimited
 * JSON (one event per line). The assistant's reply is no longer a single JSON
 * body — it arrives as a `status` (what the model is doing) → `token`* (the
 * answer typing in) → optional `recommendations` → `done` sequence, with
 * `error` if the stream breaks.
 *
 * The phases map to the recommendation graph's nodes: `'thinking'` covers the
 * initial routing latency, `'reflecting'` is the profile/strategy step (reading
 * the user, planning search axes), `'searching'` the web lookup, `'synthesizing'`
 * the card composition, and `'writing'` starts at the first answer token (the
 * `converse` reply or the `present` intro).
 */
export type ChatStreamPhase =
  | 'thinking'
  | 'reflecting'
  | 'searching'
  | 'synthesizing'
  | 'writing';

export type ChatStreamEvent =
  | { type: 'status'; phase: ChatStreamPhase }
  | { type: 'token'; text: string }
  | { type: 'recommendations'; items: ChatRecommendationDTO[] }
  | { type: 'done' }
  | { type: 'error'; message: string };
