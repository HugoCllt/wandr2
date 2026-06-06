'use client';

import * as Popover from '@radix-ui/react-popover';
import type { ReactElement, ReactNode } from 'react';

import { Icon, type IconName } from '../../../../shared/ui/icons/Icon';

type FilterPillProps = {
  label: string;
  summary?: string | null;
  active?: boolean;
  onClear?: () => void;
  /** Popover side — "right" for the vertical rail, "bottom" for a horizontal bar. */
  side?: 'bottom' | 'right';
  /** "bubble" renders a round icon button (vertical rail); "pill" a text pill. */
  variant?: 'pill' | 'bubble';
  /** Icon shown in the bubble variant. */
  icon?: IconName;
  children: ReactNode;
};

export function FilterPill({
  label,
  summary,
  active = false,
  onClear,
  side = 'bottom',
  variant = 'pill',
  icon,
  children,
}: FilterPillProps): ReactElement {
  const hint = summary ? `${label}: ${summary}` : label;
  return (
    <Popover.Root>
      {variant === 'bubble' ? (
        <Popover.Trigger asChild>
          <button
            type="button"
            className="filter-bubble"
            data-active={active || undefined}
            aria-label={hint}
            title={hint}
          >
            {icon ? <Icon name={icon} size={21} /> : null}
          </button>
        </Popover.Trigger>
      ) : (
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
      )}
      <Popover.Portal>
        <Popover.Content
          className="filter-popover"
          side={side}
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
