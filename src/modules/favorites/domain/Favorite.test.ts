import { describe, expect, it } from 'vitest';

import { createFavorite } from './Favorite';

describe('Favorite', () => {
  it('accepts a valid favorite input', () => {
    expect(() =>
      createFavorite({
        userId: 'user_1',
        activityId: 'activity_1',
      }),
    ).not.toThrow();
  });

  it('rejects empty userId', () => {
    expect(() =>
      createFavorite({
        userId: '',
        activityId: 'activity_1',
      }),
    ).toThrow(/userId/);
  });

  it('rejects empty activityId', () => {
    expect(() =>
      createFavorite({
        userId: 'user_1',
        activityId: '   ',
      }),
    ).toThrow(/activityId/);
  });
});
