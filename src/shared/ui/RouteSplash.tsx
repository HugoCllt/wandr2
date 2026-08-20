'use client';

import { useEffect, useState } from 'react';

import { AffinityRose } from './AffinityRose';

const HOLD = 2100;
const FADE = 450;

type Phase = 'in' | 'out' | 'done';

type RouteSplashProps = {
  label: string;
  highlight: number;
};

export function RouteSplash({ label, highlight }: RouteSplashProps) {
  const [phase, setPhase] = useState<Phase>('in');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }

    setPhase('in');
    const toOut = setTimeout(() => setPhase('out'), HOLD);
    const toDone = setTimeout(() => setPhase('done'), HOLD + FADE);
    return () => {
      clearTimeout(toOut);
      clearTimeout(toDone);
    };
  }, [label, highlight]);

  if (phase === 'done') return null;

  return (
    <div className="route-splash" data-phase={phase} role="presentation">
      <div className="route-splash-inner">
        <AffinityRose highlight={highlight} size={84} />
        <span className="route-splash-label">{label}</span>
      </div>
    </div>
  );
}
