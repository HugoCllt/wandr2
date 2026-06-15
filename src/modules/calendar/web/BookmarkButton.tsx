'use client';

import { useState, useTransition, type MouseEvent, type ReactElement } from 'react';

import { Icon } from '../../../shared/ui/icons/Icon';
import { AddToCalendarDialog } from './AddToCalendarDialog';

type BookmarkButtonProps = {
  activityId: string;
  activityTitle: string;
  /** Event start date (ISO) when the activity has one — lets us bookmark in one click. */
  dateStart: string | null;
  initialBookmarked: boolean;
  variant?: 'card' | 'detail';
};

/**
 * Signet toggle. Bookmarking puts the activity on the user's calendar:
 * - an event (has a date) is scheduled at its date in one click;
 * - a place (no date) opens a small picker so the user chooses when to go.
 * Re-clicking removes the single bookmark.
 */
export function BookmarkButton({
  activityId,
  activityTitle,
  dateStart,
  initialBookmarked,
  variant = 'card',
}: BookmarkButtonProps): ReactElement {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: MouseEvent<HTMLButtonElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    if (bookmarked) {
      removeBookmark();
      return;
    }
    if (dateStart) {
      addAtDate(dateStart);
      return;
    }
    // Place with no date: let the user pick when.
    setDialogOpen(true);
  }

  function addAtDate(scheduledAt: string): void {
    setBookmarked(true);
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activityId, scheduledAt }),
            cache: 'no-store',
          });
          if (!res.ok && res.status !== 409) throw new Error(`bookmark failed: ${res.status}`);
        } catch (err) {
          setBookmarked(false);
          setError(err instanceof Error ? err.message : 'Échec de la mise en signet.');
        }
      })();
    });
  }

  function removeBookmark(): void {
    setBookmarked(false);
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/calendar?activityId=${encodeURIComponent(activityId)}`, {
            method: 'DELETE',
            cache: 'no-store',
          });
          if (!res.ok) throw new Error(`remove failed: ${res.status}`);
        } catch (err) {
          setBookmarked(true);
          setError(err instanceof Error ? err.message : 'Échec de la suppression.');
        }
      })();
    });
  }

  const label = bookmarked ? 'Retirer du calendrier' : 'Ajouter au calendrier';

  if (variant === 'detail') {
    return (
      <>
        <button
          type="button"
          className={'act-secondary ' + (bookmarked ? 'saved' : '')}
          onClick={handleClick}
          title={error ?? undefined}
          aria-pressed={bookmarked}
          data-loading={pending ? '' : undefined}
        >
          <Icon name="bookmark" size={14} />
          {bookmarked ? 'En signet' : 'Signet'}
        </button>
        <AddToCalendarDialog
          activityId={activityId}
          activityTitle={activityTitle}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSaved={() => setBookmarked(true)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={bookmarked}
        aria-label={label}
        title={error ?? label}
        data-loading={pending ? '' : undefined}
        className={'card-action-btn ' + (bookmarked ? 'on' : '')}
      >
        <Icon name="bookmark" size={15} />
      </button>
      <AddToCalendarDialog
        activityId={activityId}
        activityTitle={activityTitle}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => setBookmarked(true)}
      />
    </>
  );
}
