/**
 * DTO-free avatar primitive. Renders the image when available, otherwise a
 * generated initial on a stable neutral-grey background derived from the seed.
 */
function hue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({
  name,
  src,
  size = 64,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} style={{ objectFit: 'cover' }} />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `hsl(220 8% ${70 + (hue(name) % 14)}%)`,
        color: 'var(--ink)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  );
}
