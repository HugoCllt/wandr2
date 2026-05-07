'use client';

import {
  useState,
  useTransition,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from 'react';

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

  const button = variant === 'detail' ? detailStyle : variant === 'hero' ? heroStyle : cardStyle;

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

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      title={error ?? undefined}
      data-loading={pending ? '' : undefined}
      style={{
        ...button,
        color: favorited ? '#FF3B5E' : button.color,
      }}
    >
      <HeartIcon filled={favorited} />
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const buttonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 0,
  cursor: 'pointer',
  padding: 0,
  background: 'rgba(255,255,255,0.95)',
  color: '#0E0F12',
  borderRadius: 9999,
  boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
  transition: 'transform 120ms ease, color 120ms ease',
};

const cardStyle: CSSProperties = {
  ...buttonBase,
  position: 'absolute',
  top: 12,
  right: 12,
  width: 36,
  height: 36,
  zIndex: 2,
};

const heroStyle: CSSProperties = {
  ...buttonBase,
  position: 'absolute',
  top: 16,
  right: 16,
  width: 44,
  height: 44,
  zIndex: 3,
};

const detailStyle: CSSProperties = {
  ...buttonBase,
  width: 44,
  height: 44,
};
