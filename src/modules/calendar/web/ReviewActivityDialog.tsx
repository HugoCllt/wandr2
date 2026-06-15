'use client';

import {
  useEffect,
  useId,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactElement,
} from 'react';

const REVIEW_NOTE_MAX_LENGTH = 280;

type Outcome = 'DONE' | 'MISSED';

export type ReviewSubmit = {
  outcome: Outcome;
  satisfaction: number | null;
  reviewNote: string | null;
};

type ReviewActivityDialogProps = {
  activityTitle: string;
  open: boolean;
  defaultOutcome: Outcome;
  onClose: () => void;
  onSubmit: (review: ReviewSubmit) => Promise<void>;
};

const SATISFACTION_LABELS = ['Décevant', 'Bof', 'Correct', 'Très bien', 'Inoubliable'];

/**
 * Post-activity review: did the user go (DONE) or miss it (MISSED)? A DONE
 * verdict captures a 1–5 satisfaction; both can carry a short note. Feeds the
 * user's category preferences (handled server-side).
 */
export function ReviewActivityDialog({
  activityTitle,
  open,
  defaultOutcome,
  onClose,
  onSubmit,
}: ReviewActivityDialogProps): ReactElement | null {
  const [outcome, setOutcome] = useState<Outcome>(defaultOutcome);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setOutcome(defaultOutcome);
      setSatisfaction(null);
      setNote('');
      setError(null);
      setPending(false);
    }
  }, [open, defaultOutcome]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = outcome === 'MISSED' || satisfaction !== null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!valid || pending) return;
    setError(null);
    setPending(true);
    try {
      await onSubmit({
        outcome,
        satisfaction: outcome === 'DONE' ? satisfaction : null,
        reviewNote: note.trim().length > 0 ? note.trim() : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div role="presentation" style={overlayStyle} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={dialogStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} style={titleStyle}>
          Comment c&rsquo;était ?
        </h2>
        <p style={subtitleStyle}>{activityTitle}</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          <div style={segmentStyle}>
            <button
              type="button"
              onClick={() => setOutcome('DONE')}
              style={segmentButtonStyle(outcome === 'DONE')}
            >
              J&rsquo;y suis allé
            </button>
            <button
              type="button"
              onClick={() => setOutcome('MISSED')}
              style={segmentButtonStyle(outcome === 'MISSED')}
            >
              Je l&rsquo;ai raté
            </button>
          </div>

          {outcome === 'DONE' ? (
            <div style={fieldStyle}>
              <span style={labelStyle}>Satisfaction</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSatisfaction(n)}
                    aria-pressed={satisfaction === n}
                    title={SATISFACTION_LABELS[n - 1]}
                    style={ratingButtonStyle(satisfaction !== null && n <= satisfaction)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {satisfaction !== null ? (
                <span style={hintStyle}>{SATISFACTION_LABELS[satisfaction - 1]}</span>
              ) : null}
            </div>
          ) : null}

          <label style={fieldStyle}>
            <span style={labelStyle}>Note (optionnel)</span>
            <textarea
              maxLength={REVIEW_NOTE_MAX_LENGTH}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Un souvenir, un détail à retenir…"
            />
            <span style={counterStyle}>
              {note.length}/{REVIEW_NOTE_MAX_LENGTH}
            </span>
          </label>

          {error ? (
            <div role="alert" style={errorStyle}>
              {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={ghostButtonStyle}>
              Annuler
            </button>
            <button type="submit" disabled={!valid || pending} style={primaryButtonStyle(!valid || pending)}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(14,15,18,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 50,
};

const dialogStyle: CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 20,
  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
  padding: 24,
  width: '100%',
  maxWidth: 440,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  lineHeight: '32px',
  fontWeight: 600,
  color: '#0E0F12',
};

const subtitleStyle: CSSProperties = {
  margin: '4px 0 20px 0',
  fontSize: 14,
  color: '#5A5C66',
};

const segmentStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

function segmentButtonStyle(active: boolean): CSSProperties {
  return {
    padding: '10px 12px',
    borderRadius: 12,
    border: `1px solid ${active ? '#0E0F12' : '#E5DED1'}`,
    background: active ? '#0E0F12' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#0E0F12',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#5A5C66',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

function ratingButtonStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    height: 40,
    borderRadius: 10,
    border: `1px solid ${active ? '#0E0F12' : '#E5DED1'}`,
    background: active ? '#0E0F12' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#0E0F12',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const hintStyle: CSSProperties = {
  fontSize: 13,
  color: '#5A5C66',
};

const inputStyle: CSSProperties = {
  border: '1px solid #E5DED1',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 16,
  fontFamily: 'inherit',
  background: '#FFFFFF',
  color: '#0E0F12',
};

const counterStyle: CSSProperties = {
  fontSize: 12,
  color: '#5A5C66',
  textAlign: 'right',
};

const errorStyle: CSSProperties = {
  background: '#FCE9E9',
  color: '#B42323',
  padding: '10px 12px',
  borderRadius: 6,
  fontSize: 14,
};

const ghostButtonStyle: CSSProperties = {
  background: 'transparent',
  color: '#0E0F12',
  border: '1px solid #E5DED1',
  borderRadius: 9999,
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
};

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    background: disabled ? '#E5DED1' : '#0E0F12',
    color: disabled ? '#5A5C66' : '#FFFFFF',
    border: 0,
    borderRadius: 9999,
    padding: '8px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 600,
  };
}
