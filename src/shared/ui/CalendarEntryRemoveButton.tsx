'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type CSSProperties, type ReactElement } from 'react';

type CalendarEntryRemoveButtonProps = {
  entryId: string;
};

export function CalendarEntryRemoveButton({
  entryId,
}: CalendarEntryRemoveButtonProps): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(): void {
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/calendar/${entryId}`, {
            method: 'DELETE',
            cache: 'no-store',
          });
          if (!res.ok && res.status !== 204) {
            throw new Error(`Remove failed: ${res.status}`);
          }
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to remove entry.');
        }
      })();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Remove from calendar"
      title={error ?? 'Remove from calendar'}
      disabled={pending}
      style={style}
    >
      ✕
    </button>
  );
}

const style: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 9999,
  border: '1px solid #E5DED1',
  background: '#FFFFFF',
  color: '#5A5C66',
  cursor: 'pointer',
  fontSize: 14,
};
