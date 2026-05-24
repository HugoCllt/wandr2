import { describe, expect, it } from 'vitest';

import type { ActivityDTO } from '../../../../shared/contracts/ActivityDTO';
import { coverImageUrl } from './coverImage';

const base = { imageUrl: 'https://images.example.com/x.jpg' } as ActivityDTO;

describe('coverImageUrl', () => {
  it('returns the activity image when present', () => {
    expect(coverImageUrl(base)).toBe('https://images.example.com/x.jpg');
  });

  it('falls back to the placeholder asset when imageUrl is null', () => {
    expect(coverImageUrl({ ...base, imageUrl: null })).toBe('/placeholder-activity.svg');
  });
});
