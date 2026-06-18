/**
 * A stable, random-looking avatar generated from a seed (the user id) — never
 * the Google profile photo. Built with the DiceBear `avataaars` style on a
 * bright background palette, so every account gets a colourful, illustrated
 * avatar. Same seed → same face, so it stays consistent per account.
 */
export function avatarUrl(seed: string): string {
  const params = new URLSearchParams({
    seed,
    backgroundColor: 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c0f4d4,ffe8a3',
    backgroundType: 'gradientLinear,solid',
    radius: '50',
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}
