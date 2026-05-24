'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { ActivityModal } from './ActivityModal';

type ActivityContextValue = {
  open: (activity: ActivityDTO) => void;
  close: () => void;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<ActivityDTO | null>(null);

  const open = useCallback((a: ActivityDTO) => setActivity(a), []);
  const close = useCallback(() => setActivity(null), []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = activity ? 'hidden' : previous;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (activity) {
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [activity, close]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <ActivityContext.Provider value={value}>
      {children}
      {activity && <ActivityModal activity={activity} onClose={close} />}
    </ActivityContext.Provider>
  );
}

export function useActivityContext(): ActivityContextValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) {
    return {
      open: () => {
        if (typeof console !== 'undefined') {
          console.warn('ActivityProvider not mounted; openActivity ignored.');
        }
      },
      close: () => {},
    };
  }
  return ctx;
}
