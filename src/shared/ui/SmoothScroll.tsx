'use client';

import { ReactLenis } from 'lenis/react';
import type { ReactNode } from 'react';

/**
 * Wraps the app in a single global Lenis instance for momentum-smoothed
 * scrolling (no more jerky wheel steps). `root` attaches Lenis to the window,
 * so it renders no extra DOM. Touch is left native (`syncTouch` off by default)
 * to preserve mobile momentum, and `prefers-reduced-motion` collapses the
 * smoothing to an instant scroll.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <ReactLenis root options={{ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced }}>
      {children}
    </ReactLenis>
  );
}
