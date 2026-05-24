'use client';

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactElement,
} from 'react';

const NOTES_MAX_LENGTH = 200;

type AddToCalendarDialogProps = {
  activityId: string;
  activityTitle: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

export function AddToCalendarDialog({
  activityId,
  activityTitle,
  open,
  onClose,
  onSaved,
}: AddToCalendarDialogProps): ReactElement | null {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      setDate('');
      setTime('');
      setNotes('');
      setError(null);
      setPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    dateInputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const valid = useMemo(() => date.length > 0 && time.length > 0, [date, time]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!valid || pending) return;
    setError(null);
    setPending(true);
    try {
      const localIso = `${date}T${time}:00`;
      const scheduledAt = new Date(localIso).toISOString();
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          scheduledAt,
          notes: notes.trim().length > 0 ? notes.trim() : null,
        }),
        cache: 'no-store',
      });
      if (res.status === 409) {
        setError('You already have this activity at this time.');
        return;
      }
      if (res.status === 404) {
        setError('Activity not found.');
        return;
      }
      if (!res.ok) {
        throw new Error(`Save failed: ${res.status}`);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to calendar.');
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
          Add to calendar
        </h2>
        <p style={subtitleStyle}>{activityTitle}</p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <label style={fieldStyle}>
            <span style={labelStyle}>Date</span>
            <input
              ref={dateInputRef}
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Time</span>
            <select
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={inputStyle}
            >
              <option value="" disabled>
                Pick a time
              </option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span style={labelStyle}>Note (optional)</span>
            <textarea
              maxLength={NOTES_MAX_LENGTH}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Optional"
            />
            <span style={counterStyle}>
              {notes.length}/{NOTES_MAX_LENGTH}
            </span>
          </label>

          {error ? (
            <div role="alert" style={errorStyle}>
              {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={ghostButtonStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!valid || pending}
              style={primaryButtonStyle(!valid || pending)}
            >
              {pending ? 'Saving…' : 'Save'}
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

const fieldStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#5A5C66',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
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
    background: disabled ? '#E5DED1' : '#FF7A33',
    color: disabled ? '#5A5C66' : '#FFFFFF',
    border: 0,
    borderRadius: 9999,
    padding: '8px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 600,
  };
}
