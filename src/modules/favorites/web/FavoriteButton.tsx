'use client';

import { useState, useTransition, type MouseEvent, type ReactElement } from 'react';

import { Icon } from '../../../shared/ui/icons/Icon';

type FavoriteButtonProps = {
  activityId: string;
  initialFavorited: boolean;
  variant?: 'card' | 'detail' | 'hero';
};

type ToggleResponse = {
  isFavorited: boolean;
};

export function FavoriteButton({
  activityId,
  initialFavorited,
  variant = 'card',
}: FavoriteButtonProps): ReactElement {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(e: MouseEvent<HTMLButtonElement>): void {
    e.preventDefault();
    e.stopPropagation();

    const next = !favorited;
    setFavorited(next);
    setError(null);

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activityId }),
            cache: 'no-store',
          });
          if (!res.ok) throw new Error(`favorite request failed: ${res.status}`);
          const dto = (await res.json()) as ToggleResponse;
          setFavorited(dto.isFavorited);
        } catch (err) {
          setFavorited(!next);
          setError(err instanceof Error ? err.message : 'Failed to update favorite.');
        }
      })();
    });
  }

  if (variant === 'detail') {
    return (
      <button
        type="button"
        className={'act-secondary ' + (favorited ? 'saved' : '')}
        onClick={handleClick}
        title={error ?? undefined}
        aria-pressed={favorited}
        data-loading={pending ? '' : undefined}
      >
        <Icon name={favorited ? 'save-fill' : 'save'} size={14} />
        {favorited ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={error ?? undefined}
      data-loading={pending ? '' : undefined}
      className={'card-action-btn card-action-fav ' + (favorited ? 'on' : '')}
    >
      <Icon name={favorited ? 'heart-fill' : 'heart'} size={14} />
    </button>
  );
}
