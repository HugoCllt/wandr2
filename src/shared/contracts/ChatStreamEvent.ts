/**
 * Wire events the chat endpoint streams to the browser as newline-delimited
 * JSON (one event per line). The assistant's reply is no longer a single JSON
 * body — it arrives as a `status` (what the model is doing) → `token`* (the
 * answer typing in) → `done` sequence, with `error` if the stream breaks.
 *
 * `phase` is intentionally small today: `'thinking'` covers every pre-text
 * latency (the model warming up, and — when `CHAT_THINKING_EFFORT` is on or a
 * tools node lands — reasoning / tool calls, which emit no answer text yet),
 * `'writing'` starts at the first answer token. Future distinct phases
 * (`'searching'`, …) slot in here when those signals exist (see tbd.md).
 */
export type ChatStreamPhase = 'thinking' | 'writing';

export type ChatStreamEvent =
  | { type: 'status'; phase: ChatStreamPhase }
  | { type: 'token'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
