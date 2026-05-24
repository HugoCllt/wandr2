'use client';

import * as Popover from '@radix-ui/react-popover';
import type { ReactElement, ReactNode } from 'react';

import { Icon } from '../../../../shared/ui/icons/Icon';

type FilterPillProps = {
  label: string;
  summary?: string | null;
  active?: boolean;
  onClear?: () => void;
  children: ReactNode;
};

export function FilterPill({
  label,
  summary,
  active = false,
  onClear,
  children,
}: FilterPillProps): ReactElement {
  return (
    <Popover.Root>
      <div className="filter-pill-wrap" data-active={active || undefined}>
        <Popover.Trigger asChild>
          <button type="button" className="filter-pill" data-active={active || undefined}>
            <span className="filter-pill-label">{label}</span>
            {summary ? (
              <>
                <span className="filter-pill-sep" aria-hidden="true">
                  ·
                </span>
                <span className="filter-pill-value">{summary}</span>
              </>
            ) : null}
            <span className="filter-pill-chev" aria-hidden="true">
              <Icon name="chev-down" size={12} />
            </span>
          </button>
        </Popover.Trigger>
        {active && onClear ? (
          <button
            type="button"
            className="filter-pill-clear"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label={`Clear ${label}`}
          >
            <Icon name="close" size={11} stroke={2.4} />
          </button>
        ) : null}
      </div>
      <Popover.Portal>
        <Popover.Content
          className="filter-popover"
          sideOffset={8}
          align="start"
          collisionPadding={16}
        >
          {children}
          <Popover.Arrow className="filter-popover-arrow" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
