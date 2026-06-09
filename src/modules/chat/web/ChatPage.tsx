'use client';

import { useState, type KeyboardEvent, type ReactElement } from 'react';

import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { ImagelessActivityCard } from '../../activities/web/cards/ImagelessActivityCard';
import type { ChatMessageDTO } from '../../../shared/contracts/ChatMessageDTO';
import type { ChatRecommendationDTO } from '../../../shared/contracts/ChatRecommendationDTO';
import type { ChatStreamEvent, ChatStreamPhase } from '../../../shared/contracts/ChatStreamEvent';
import { Icon, type IconName } from '../../../shared/ui/icons/Icon';
import { ChatStatusIndicator } from './ChatStatusIndicator';

const PROMPTS: { text: string; icon: IconName; kind: 'warm' | 'cool' | 'cream' }[] = [
  { text: 'Romantic activity tonight in Old Montreal', icon: 'heart', kind: 'warm' },
  { text: 'Cheap sport activity near downtown', icon: 'ball', kind: 'cool' },
  { text: 'Hidden gem this weekend', icon: 'gem', kind: 'cream' },
  { text: 'Group plan for 6 people', icon: 'users', kind: 'cool' },
  { text: 'Best rooftop with a sunset view', icon: 'sparkle', kind: 'warm' },
  { text: 'Quiet café for a long read', icon: 'fork', kind: 'cream' },
];

/** The assistant turn as it streams in: its phase, the text + any cards so far. */
type Streaming = { phase: ChatStreamPhase; text: string; recommendations: ChatRecommendationDTO[] };

function newId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function chatMessage(
  role: ChatMessageDTO['role'],
  text: string,
  recommendations: ChatRecommendationDTO[] = [],
): ChatMessageDTO {
  return {
    id: newId(),
    role,
    text,
    suggestedActivities: [],
    recommendations,
    createdAt: new Date().toISOString(),
  };
}

/** The recommendation cards: the classic Tuile (photo) or its no-photo fallback,
 * each with the assistant's personal "pourquoi" line underneath. */
function Recommendations({ items }: { items: ChatRecommendationDTO[] }): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className="chat-recos">
      {items.map((reco) => (
        <div key={reco.activity.id} className="chat-reco">
          {reco.activity.imageUrl ? (
            <CoverActivityCard activity={reco.activity} />
          ) : (
            <ImagelessActivityCard activity={reco.activity} showPrice={false} />
          )}
          <p className="chat-reco-why">{reco.reason}</p>
        </div>
      ))}
    </div>
  );
}

export function ChatPage() {
  const [thread, setThread] = useState<ChatMessageDTO[]>([]);
  const [streaming, setStreaming] = useState<Streaming | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text?: string) {
    const t = (text ?? draft).trim();
    if (t.length === 0 || pending) return;
    setPending(true);
    setError(null);
    setDraft('');

    // Replay the thread as it stood *before* this turn, then optimistically show
    // the user's message and the assistant's "thinking" state right away.
    const history = thread.map((m) => ({ role: m.role, text: m.text }));
    setThread((prev) => [...prev, chatMessage('user', t)]);
    setStreaming({ phase: 'thinking', text: '', recommendations: [] });

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, history }),
        cache: 'no-store',
      });
      if (!res.ok || !res.body) throw new Error(`chat failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      let recommendations: ChatRecommendationDTO[] = [];
      let streamError: string | null = null;

      // Parse the NDJSON event stream one complete line at a time.
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (line.length === 0) continue;
          const event = JSON.parse(line) as ChatStreamEvent;
          if (event.type === 'status') {
            setStreaming((s) => (s ? { ...s, phase: event.phase } : s));
          } else if (event.type === 'token') {
            answer += event.text;
            setStreaming((s) => (s ? { ...s, text: answer } : s));
          } else if (event.type === 'recommendations') {
            recommendations = event.items;
            setStreaming((s) => (s ? { ...s, recommendations } : s));
          } else if (event.type === 'error') {
            streamError = event.message;
          }
        }
      }

      if (streamError) throw new Error(streamError);
      setThread((prev) => [...prev, chatMessage('assistant', answer, recommendations)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message.');
    } finally {
      setStreaming(null);
      setPending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="chat-wrap">
      {thread.length === 0 ? (
        <>
          <div className="chat-eyebrow">Wandr Assistant</div>
          <h1 className="chat-title">
            What do you feel like
            <br />
            doing today?
          </h1>
          <p className="chat-sub">
            Ask anything — a vibe, a budget, a neighborhood. We&rsquo;ll find the rest.
          </p>
        </>
      ) : null}

      <div className="chat-input">
        <textarea
          placeholder="Tell me your mood, and I'll find the night…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="chat-input-foot">
          <div className="chat-input-tools">
            <button type="button" className="chat-tool">
              <Icon name="pin" size={13} /> Near me
            </button>
            <button type="button" className="chat-tool">
              <Icon name="calendar" size={13} /> Tonight
            </button>
            <button type="button" className="chat-tool">
              <Icon name="users" size={13} /> Solo
            </button>
          </div>
          <button
            type="button"
            className="chat-send"
            onClick={() => void send()}
            aria-label="Send"
            disabled={pending}
          >
            <Icon name="arrow-right" size={16} />
          </button>
        </div>
      </div>

      {thread.length === 0 && (
        <>
          <div className="chat-prompt-eyebrow">Try one of these</div>
          <div className="chat-prompts">
            {PROMPTS.map((p) => (
              <button
                key={p.text}
                type="button"
                className="chat-prompt"
                onClick={() => void send(p.text)}
              >
                <span className={'ico ' + p.kind}>
                  <Icon name={p.icon} size={16} />
                </span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p style={{ color: '#B42323', fontSize: 13 }}>{error}</p>}

      {thread.length > 0 && (
        <div className="chat-thread">
          {thread.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="chat-msg-user">
                {m.text}
              </div>
            ) : (
              <div key={m.id} className="chat-msg-ai">
                <div className="chat-ai-avatar">W</div>
                <div className="chat-ai-bubble">
                  <p>{m.text}</p>
                  <Recommendations items={m.recommendations} />
                </div>
              </div>
            ),
          )}

          {streaming &&
            (streaming.text.length === 0 ? (
              // Pre-text: the dot-matrix bloom under the avatar (thinking / —
              // later — reasoning or tool calls, which produce no answer yet).
              <div className="chat-msg-ai is-pending">
                <div className="chat-ai-avatar">W</div>
                <ChatStatusIndicator phase={streaming.phase} />
              </div>
            ) : (
              // Writing: tokens stream into the bubble.
              <div className="chat-msg-ai">
                <div className="chat-ai-avatar">W</div>
                <div className="chat-ai-bubble">
                  <p className="chat-ai-streaming">{streaming.text}</p>
                  <Recommendations items={streaming.recommendations} />
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
