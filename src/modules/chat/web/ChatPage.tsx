'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';

import { CoverActivityCard } from '../../activities/web/cards/CoverActivityCard';
import { ImagelessActivityCard } from '../../activities/web/cards/ImagelessActivityCard';
import type { ActivityDTO } from '../../../shared/contracts/ActivityDTO';
import type { ChatMessageDTO } from '../../../shared/contracts/ChatMessageDTO';
import type { ChatRecommendationDTO } from '../../../shared/contracts/ChatRecommendationDTO';
import type { ChatStreamEvent, ChatStreamPhase } from '../../../shared/contracts/ChatStreamEvent';
import { Icon, type IconName } from '../../../shared/ui/icons/Icon';
import { ChatInspirationCarousel } from './ChatInspirationCarousel';
import { ChatStatusIndicator } from './ChatStatusIndicator';

/** Quick-context toggles under the input. When active, their `hint` is folded
 * into the message the agent receives (not the bubble the user sees). */
type ChatTool = { id: string; label: string; icon: IconName; hint: string };
const CHAT_TOOLS: ChatTool[] = [
  { id: 'nearby', label: 'Près de moi', icon: 'pin', hint: 'près de moi, à proximité' },
  { id: 'tonight', label: 'Ce soir', icon: 'calendar', hint: 'pour ce soir' },
  { id: 'solo', label: 'Solo', icon: 'users', hint: 'en solo, je serai seul·e' },
];

/** Prompt ideas rotating in the idle input — nudges without the old static chips. */
const IDEAS = [
  'Une sortie romantique ce soir dans le Vieux-Montréal…',
  'Un plan sportif pas cher près du centre-ville…',
  'Une perle cachée à découvrir ce weekend…',
  'Un plan pour un groupe de six ce samedi…',
  'Un rooftop avec vue pour le coucher du soleil…',
  'Un café tranquille pour bouquiner dimanche…',
  'Une expo ou un musée à faire demain…',
  'Une soirée qui sort de l’ordinaire…',
];
const IDEA_ROTATE_MS = 3800;

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

/** One section per recommended activity: numbered axis eyebrow, the Home card
 * (Tuile, or its no-photo fallback), the personal "pourquoi" beside it. */
function Recommendations({ items }: { items: ChatRecommendationDTO[] }): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <div className="chat-recos">
      {items.map((reco, i) => (
        <section key={reco.activity.id} className="chat-reco-section">
          <div className="chat-reco-eyebrow">
            <span className="chat-reco-num">{String(i + 1).padStart(2, '0')}</span>
            <span>{reco.axisLabel}</span>
          </div>
          <div className="chat-reco-body">
            <div className="chat-reco-card">
              {reco.activity.imageUrl ? (
                <CoverActivityCard activity={reco.activity} />
              ) : (
                <ImagelessActivityCard activity={reco.activity} showPrice={false} />
              )}
            </div>
            <div className="chat-reco-text">
              <p className="chat-reco-why">{reco.reason}</p>
              {reco.sourceUrl && (
                <a
                  className="chat-reco-source"
                  href={reco.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir la source <Icon name="arrow-right" size={11} />
                </a>
              )}
            </div>
          </div>
        </section>
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
  const [ideaIdx, setIdeaIdx] = useState(0);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const started = thread.length > 0;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const flipFrom = useRef<DOMRect | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  // Idle placeholder rotation — stops once the conversation starts.
  useEffect(() => {
    if (started) return;
    const timer = setInterval(() => setIdeaIdx((i) => (i + 1) % IDEAS.length), IDEA_ROTATE_MS);
    return () => clearInterval(timer);
  }, [started]);

  // FLIP: `send` snapshots the centered dock; once the layout flips to the
  // conversation state, slide the dock from there to its bottom position.
  useLayoutEffect(() => {
    const from = flipFrom.current;
    const dock = dockRef.current;
    if (!from || !dock) return;
    flipFrom.current = null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dy = from.top - dock.getBoundingClientRect().top;
    if (Math.abs(dy) < 4) return;
    dock.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], {
      duration: 560,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }, [started]);

  // Keep the latest turn in view while messages and tokens arrive.
  useEffect(() => {
    if (!started) return;
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [started, thread, streaming]);

  async function send(text?: string) {
    const t = (text ?? draft).trim();
    if (t.length === 0 || pending) return;
    setPending(true);
    setError(null);
    setDraft('');
    if (thread.length === 0) {
      flipFrom.current = dockRef.current?.getBoundingClientRect() ?? null;
    }

    // Replay the thread as it stood *before* this turn, then optimistically show
    // the user's message and the assistant's "thinking" state right away.
    const history = thread.map((m) => ({ role: m.role, text: m.text }));
    setThread((prev) => [...prev, chatMessage('user', t)]);
    setStreaming({ phase: 'thinking', text: '', recommendations: [] });

    // Fold the active toggles into the agent's input only (the bubble keeps `t`).
    const hints = CHAT_TOOLS.filter((tool) => activeTools.includes(tool.id)).map((tool) => tool.hint);
    const context =
      hints.length > 0 ? `Contexte : je cherche quelque chose ${hints.join(', ')}.` : undefined;

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, history, context }),
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
      setError(e instanceof Error ? e.message : 'L’envoi du message a échoué.');
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

  function pickInspiration(activity: ActivityDTO) {
    setDraft(`Propose-moi une sortie dans le genre de « ${activity.title} »`);
    textareaRef.current?.focus();
  }

  return (
    <div className={`chat-shell${started ? ' is-chatting' : ''}`}>
      {started ? (
        <div className="chat-scroll">
          <div className="chat-thread">
            {thread.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="chat-msg-user">
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className="chat-msg-ai">
                  <div className="chat-ai-avatar">W</div>
                  <div className="chat-ai-content">
                    <div className="chat-ai-bubble">
                      <p>{m.text}</p>
                    </div>
                    <Recommendations items={m.recommendations} />
                  </div>
                </div>
              ),
            )}

            {streaming &&
              (streaming.text.length === 0 ? (
                // Pre-text: the dot-matrix bloom under the avatar (thinking /
                // searching / synthesizing — no answer tokens yet).
                <div className="chat-msg-ai is-pending">
                  <div className="chat-ai-avatar">W</div>
                  <ChatStatusIndicator phase={streaming.phase} />
                </div>
              ) : (
                // Writing: tokens stream into the bubble, cards follow.
                <div className="chat-msg-ai">
                  <div className="chat-ai-avatar">W</div>
                  <div className="chat-ai-content">
                    <div className="chat-ai-bubble">
                      <p className="chat-ai-streaming">{streaming.text}</p>
                    </div>
                    <Recommendations items={streaming.recommendations} />
                  </div>
                </div>
              ))}
            <div ref={threadEndRef} />
          </div>
        </div>
      ) : (
        <div className="chat-hero">
          <div className="chat-eyebrow">Assistant Wandr</div>
          <h1 className="chat-title">
            Qu&rsquo;est-ce qui te
            <br />
            tente aujourd&rsquo;hui&nbsp;?
          </h1>
          <p className="chat-sub">
            Une envie, un budget, un quartier — Wandr s&rsquo;occupe du reste.
          </p>
        </div>
      )}

      <div className="chat-dock" ref={dockRef}>
        {error && <p className="chat-error">{error}</p>}
        <div className="chat-input">
          <div className="chat-input-field">
            <textarea
              ref={textareaRef}
              placeholder={started ? 'Réponds ou précise ton envie…' : ''}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
            />
            {!started && draft.length === 0 && (
              // Rotating idea shown in place of the native placeholder; the key
              // remounts the span so the fade replays at each rotation.
              <span key={ideaIdx} className="chat-placeholder" aria-hidden>
                {IDEAS[ideaIdx]}
              </span>
            )}
          </div>
          <div className="chat-input-foot">
            <div className="chat-input-tools">
              {CHAT_TOOLS.map((tool) => {
                const active = activeTools.includes(tool.id);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    className={`chat-tool${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() =>
                      setActiveTools((cur) =>
                        active ? cur.filter((id) => id !== tool.id) : [...cur, tool.id],
                      )
                    }
                  >
                    <Icon name={tool.icon} size={13} /> {tool.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="chat-send"
              onClick={() => void send()}
              aria-label="Envoyer"
              disabled={pending}
            >
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>

      {!started && <ChatInspirationCarousel onPick={pickInspiration} />}
    </div>
  );
}
