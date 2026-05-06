import { describe, expect, it } from 'vitest';

import { createUserCategoryAffinity } from './UserCategoryAffinity';

describe('UserCategoryAffinity', () => {
  it('accepts integer scores from 0 to 10', () => {
    expect(() =>
      createUserCategoryAffinity({
        userId: 'user_1',
        category: 'FOOD',
        score: 0,
      }),
    ).not.toThrow();

    expect(() =>
      createUserCategoryAffinity({
        userId: 'user_1',
        category: 'FOOD',
        score: 10,
      }),
    ).not.toThrow();
  });

  it('rejects scores outside the allowed range', () => {
    expect(() =>
      createUserCategoryAffinity({
        userId: 'user_1',
        category: 'FOOD',
        score: -1,
      }),
    ).toThrow(/score/);

    expect(() =>
      createUserCategoryAffinity({
        userId: 'user_1',
        category: 'FOOD',
        score: 11,
      }),
    ).toThrow(/score/);
  });

  it('rejects floating point scores', () => {
    expect(() =>
      createUserCategoryAffinity({
        userId: 'user_1',
        category: 'FOOD',
        score: 7.5,
      }),
    ).toThrow(/score/);
  });
});
