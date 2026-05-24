'use client';

import { useState, type MouseEvent, type ReactElement } from 'react';

import { AddToCalendarDialog } from './AddToCalendarDialog';
import { Icon } from '../../../shared/ui/icons/Icon';

type AddToCalendarButtonProps = {
  activityId: string;
  activityTitle: string;
  variant?: 'card' | 'detail';
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

  return (
    <>
      {variant === 'detail' ? (
        <button type="button" onClick={handleClick} className="act-cta">
          <Icon name="calendar" size={14} /> Add to calendar
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Add to calendar"
          title="Add to calendar"
          className="rec-bookmark"
        >
          <Icon name="bookmark" size={15} />
        </button>
      )}
      <AddToCalendarDialog
        activityId={activityId}
        activityTitle={activityTitle}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
