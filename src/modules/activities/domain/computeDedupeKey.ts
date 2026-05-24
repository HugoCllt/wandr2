import type { ActivityKind } from './Activity';
import { slugify } from './slug';

export type DedupeKeyInput = {
  kind: ActivityKind;
  title: string;
  dateStart: Date | null;
  latitude: number;
  longitude: number;
};

export function computeDedupeKey(input: DedupeKeyInput): string {
  const title = slugify(input.title);
  const coords = `${input.latitude.toFixed(3)},${input.longitude.toFixed(3)}`;

  if (input.kind === 'EVENT') {
    if (!input.dateStart) {
      throw new Error('computeDedupeKey: EVENT requires dateStart.');
    }
    const day = input.dateStart.toISOString().slice(0, 10);
    return `${title}|${day}|${coords}`;
  }

  return `${title}|${coords}`;
}
