/**
 * 5×5 dot-matrix loader that blooms outward from the centre in a diamond —
 * each dot's animation is delayed by its Manhattan distance from the middle, so
 * the ripple radiates as concentric diamonds (after dot-matrix-animations
 * icon-12). Dots inherit `currentColor`, so the consumer sets the tone to fit
 * the light chat surface. The bloom itself is one keyframe in globals.css.
 */
const GRID = 5;
const CENTER = 2;
const PITCH = 9; // gap between dot centres
const OFFSET = 4; // inset of the first dot
const STEP_MS = 180; // per-ring delay → ~733ms to the corners

export function DotMatrixLoader({ size = 40 }: { size?: number }) {
  const dots = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const distance = Math.abs(row - CENTER) + Math.abs(col - CENTER);
      dots.push(
        <circle
          key={`${row}-${col}`}
          className="dm-dot"
          cx={OFFSET + col * PITCH}
          cy={OFFSET + row * PITCH}
          r={3}
          style={{ animationDelay: `${distance * STEP_MS}ms` }}
        />,
      );
    }
  }

  return (
    <svg
      className="dot-matrix"
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role="img"
      aria-label="Chargement"
    >
      {dots}
    </svg>
  );
}
