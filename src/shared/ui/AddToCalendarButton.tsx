'use client';

import { useState, type CSSProperties, type MouseEvent, type ReactElement } from 'react';

import { AddToCalendarDialog } from './AddToCalendarDialog';

type AddToCalendarButtonProps = {
  activityId: string;
  activityTitle: string;
  variant?: 'card' | 'detail' | 'hero';
};

export function AddToCalendarButton({
  activityId,
  activityTitle,
  variant = 'card',
}: AddToCalendarButtonProps): ReactElement {
  const [open, setOpen] = useState(false);

  function handleClick(e: MouseEvent<HTMLButtonElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  const buttonStyle =
    variant === 'detail' ? detailStyle : variant === 'hero' ? heroStyle : cardStyle;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Add to calendar"
        title="Add to calendar"
        style={buttonStyle}
      >
        <CalendarIcon />
        {variant === 'detail' ? <span style={{ marginLeft: 8 }}>Add to calendar</span> : null}
      </button>
      <AddToCalendarDialog
        activityId={activityId}
        activityTitle={activityTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function CalendarIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
  right: 56,
  width: 36,
  height: 36,
  zIndex: 2,
};

const heroStyle: CSSProperties = {
  ...buttonBase,
  position: 'absolute',
  top: 16,
  right: 72,
  width: 44,
  height: 44,
  zIndex: 3,
};

const detailStyle: CSSProperties = {
  ...buttonBase,
  width: 'auto',
  height: 44,
  padding: '0 18px',
  fontSize: 14,
  fontWeight: 500,
};
