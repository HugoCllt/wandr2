import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor, type FeedCursorKey } from './cursor-codec';

function expectRoundTrip(key: FeedCursorKey): void {
  const encoded = encodeCursor(key);
  const decoded = decodeCursor(encoded);
  expect(decoded).toEqual(key);
}

describe('encodeCursor / decodeCursor — fixtures', () => {
  it('round-trips a typical EVENT key', () => {
    expectRoundTrip({
      featured: true,
      matchScore: 8,
      dateStart: '2026-06-15T19:00:00.000Z',
      createdAt: '2026-04-01T00:00:00.000Z',
      id: 'activity_42',
    });
  });

  it('round-trips a fractional matchScore (weighted-average ranking)', () => {
    expectRoundTrip({
      featured: false,
      matchScore: 5.5,
      dateStart: null,
      createdAt: '2026-04-15T08:30:00.000Z',
      id: 'activity_frac',
    });
  });

  it('round-trips a PLACE key with null dateStart', () => {
    expectRoundTrip({
      featured: false,
      matchScore: 5,
      dateStart: null,
      createdAt: '2026-04-15T08:30:00.000Z',
      id: 'activity_place_1',
    });
  });

  it('produces a URL-safe base64 token (no padding)', () => {
    const encoded = encodeCursor({
      featured: false,
      matchScore: 0,
      dateStart: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      id: 'a',
    });
    expect(encoded).not.toContain('=');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });

  it('returns null for an empty / undefined cursor', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
  });

  it('returns null for an invalid base64 token', () => {
    expect(decodeCursor('not-a-valid-cursor!!!')).toBeNull();
  });

  it('returns null for valid base64 that is not the expected schema', () => {
    const garbage = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64url');
    expect(decodeCursor(garbage)).toBeNull();
  });
});

describe('encodeCursor / decodeCursor — round-trip property', () => {
  const isoDateTime = fc
    .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true })
    .map((d) => d.toISOString());

  const keyArb: fc.Arbitrary<FeedCursorKey> = fc.record({
    featured: fc.boolean(),
    matchScore: fc.integer({ min: 0, max: 10 }),
    dateStart: fc.option(isoDateTime, { nil: null }),
    createdAt: isoDateTime,
    id: fc.string({ minLength: 1, maxLength: 32 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
  });

  it('any valid FeedCursorKey round-trips through encode → decode', () => {
    fc.assert(
      fc.property(keyArb, (key) => {
        const encoded = encodeCursor(key);
        const decoded = decodeCursor(encoded);
        expect(decoded).toEqual(key);
      }),
      { numRuns: 200 },
    );
  });
});
