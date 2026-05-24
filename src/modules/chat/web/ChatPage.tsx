'use client';

import { useState, type KeyboardEvent } from 'react';

import type { ChatMessageDTO } from '../../../shared/contracts/ChatMessageDTO';
import { FlameRow } from '../../../shared/ui/icons/FlameRow';
import { Icon, type IconName } from '../../../shared/ui/icons/Icon';

const PROMPTS: { text: string; icon: IconName; kind: 'warm' | 'cool' | 'cream' }[] = [
  { text: 'Romantic activity tonight in Old Montreal', icon: 'heart', kind: 'warm' },
  { text: 'Cheap sport activity near downtown', icon: 'ball', kind: 'cool' },
  { text: 'Hidden gem this weekend', icon: 'gem', kind: 'cream' },
  { text: 'Group plan for 6 people', icon: 'users', kind: 'cool' },
  { text: 'Best rooftop with a sunset view', icon: 'sparkle', kind: 'warm' },
  { text: 'Quiet café for a long read', icon: 'fork', kind: 'cream' },
];

type SendResponse = {
  userMessage: ChatMessageDTO;
  assistantMessage: ChatMessageDTO;
};

export function ChatPage() {
  const [thread, setThread] = useState<ChatMessageDTO[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text?: string) {
    const t = (text ?? draft).trim();
    if (t.length === 0 || pending) return;
    setPending(true);
    setError(null);
    setDraft('');
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`chat failed: ${res.status}`);
      const dto = (await res.json()) as SendResponse;
      setThread((prev) => [...prev, dto.userMessage, dto.assistantMessage]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message.');
    } finally {
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
                  {m.suggestedActivities.length > 0 && (
                    <div className="chat-cards">
                      {m.suggestedActivities.map((c) => (
                        <div key={c.id} className="chat-card">
                          <div
                            className="chat-card-img"
                            style={{ backgroundImage: `url(${c.imageUrl})` }}
                          />
                          <div className="chat-card-body">
                            <div className="chat-card-title">{c.title}</div>
                            <div className="chat-card-meta">
                              {c.neighborhood ?? 'Montréal'}
                            </div>
                            <div className="chat-card-foot">
                              <FlameRow value={3} size={9} />
                              <span className="chat-card-price">
                                {c.priceMinCents > 0
                                  ? `$${Math.round(c.priceMinCents / 100)}+`
                                  : 'Free'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
