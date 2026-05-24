import { describe, expect, it } from 'vitest';

import { computeExpiresAt, computeRecheckAfter, RECHECK_INTERVAL_DAYS } from './freshness';

describe('computeExpiresAt', () => {
  it('returns dateEnd for an EVENT', () => {
    const dateEnd = new Date('2026-06-14T03:00:00.000Z');
    expect(computeExpiresAt({ kind: 'EVENT', dateEnd })).toEqual(dateEnd);
  });

  it('returns null for a PLACE', () => {
    expect(computeExpiresAt({ kind: 'PLACE', dateEnd: null })).toBeNull();
  });

  it('throws when an EVENT has no dateEnd', () => {
    expect(() => computeExpiresAt({ kind: 'EVENT', dateEnd: null })).toThrow(/dateEnd/);
  });
});

describe('computeRecheckAfter', () => {
  it('returns lastSeenAt + 90 days for a PLACE', () => {
    const lastSeenAt = new Date('2026-05-23T00:00:00.000Z');
    const expected = new Date(
      lastSeenAt.getTime() + RECHECK_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(computeRecheckAfter({ kind: 'PLACE', lastSeenAt })).toEqual(expected);
  });

  it('returns null for an EVENT (events expire by date, no recheck)', () => {
    expect(
      computeRecheckAfter({ kind: 'EVENT', lastSeenAt: new Date('2026-05-23T00:00:00.000Z') }),
    ).toBeNull();
  });
});
