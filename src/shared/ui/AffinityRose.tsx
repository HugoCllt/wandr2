'use client';

import { useEffect, useState } from 'react';

const BRANCHES = 6;
const CANONICAL = [0.78, 0.62, 0.72, 0.58, 0.74, 0.64];
const DIMMED = 0.72;
const REST = 0.3;

const STAGGER = 70;
const PULSE = 260;
const LAPS = 2;
const SCAN_END = LAPS * BRANCHES * STAGGER;
const CONVERGE = 420;
const REVEAL_DELAY = 60;
const REVEAL = 340;
const TOTAL = SCAN_END + CONVERGE + REVEAL_DELAY + REVEAL;

const CENTER = 24;
const INNER = 6;
const SPAN = 15;

type Frame = { values: number[]; accent: number };

type AffinityRoseProps = {
  highlight?: number | null;
  size?: number;
  className?: string;
};

function settledFrame(highlight: number | null): Frame {
  if (highlight === null) return { values: CANONICAL, accent: 0 };
  return {
    values: CANONICAL.map((value, i) => (i === highlight ? 1 : value * DIMMED)),
    accent: 1,
  };
}

function scanValue(elapsed: number, index: number): number {
  let value = REST;
  for (let lap = 0; lap <= LAPS; lap += 1) {
    const progress = (elapsed - (lap * BRANCHES + index) * STAGGER) / PULSE;
    if (progress > 0 && progress < 1) {
      value = Math.max(value, REST + (0.96 - REST) * Math.sin(Math.PI * progress));
    }
  }
  return value;
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

function branchEnd(index: number, value: number): [number, number] {
  const angle = ((-90 + index * 60) * Math.PI) / 180;
  const radius = INNER + value * SPAN;
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)];
}

export function AffinityRose({ highlight = null, size = 26, className }: AffinityRoseProps) {
  const [frame, setFrame] = useState<Frame>(() => settledFrame(highlight));

  useEffect(() => {
    const settled = settledFrame(highlight);

    if (highlight === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(settled);
      return;
    }

    const start = performance.now();
    let id = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= TOTAL) {
        setFrame(settled);
        return;
      }
      const converge = easeOut(clamp01((elapsed - SCAN_END) / CONVERGE));
      const accent = easeOut(clamp01((elapsed - SCAN_END - CONVERGE - REVEAL_DELAY) / REVEAL));
      setFrame({
        values: settled.values.map((target, i) => {
          const scanned = scanValue(elapsed, i);
          return scanned + (target - scanned) * converge;
        }),
        accent,
      });
      id = requestAnimationFrame(step);
    };

    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [highlight]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {frame.values.map((value, i) => {
        const [x, y] = branchEnd(i, value);
        return (
          <g key={i}>
            <line
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.55}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <circle cx={x} cy={y} r={1.9} fill="currentColor" fillOpacity={0.55} />
            {i === highlight && frame.accent > 0 ? (
              <>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  stroke="var(--brass-300)"
                  strokeOpacity={frame.accent}
                  strokeWidth={2.4 + frame.accent}
                  strokeLinecap="round"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={1.9 + frame.accent * 1.4}
                  fill="var(--brass-300)"
                  fillOpacity={frame.accent}
                />
              </>
            ) : null}
          </g>
        );
      })}
      <circle cx={CENTER} cy={CENTER} r={2.2} fill="currentColor" fillOpacity={0.7} />
    </svg>
  );
}
