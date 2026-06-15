'use client';

import { useState, type ReactElement } from 'react';

import { ReviewActivityDialog, type ReviewSubmit } from './ReviewActivityDialog';
import type { PendingReview } from './loadPendingReviews';

const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

type Active = { review: PendingReview; outcome: 'DONE' | 'MISSED' };

/**
 * Sidebar surface for past bookmarked activities awaiting a verdict. Each row
 * offers a quick "Fait / Raté" that opens the review dialog; once saved, the row
 * drops out of the list.
 */
export function PendingReviews({ items }: { items: PendingReview[] }): ReactElement {
  const [reviews, setReviews] = useState<PendingReview[]>(items);
  const [active, setActive] = useState<Active | null>(null);

  async function submit(review: ReviewSubmit): Promise<void> {
    if (!active) return;
    const res = await fetch(`/api/calendar/${active.review.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`review failed: ${res.status}`);
    setReviews((prev) => prev.filter((r) => r.id !== active.review.id));
  }

  if (reviews.length === 0) {
    return (
      <p style={{ margin: 0, color: 'var(--smoke)', fontSize: 13 }}>
        Rien à noter — vos sorties passées sont toutes évaluées.
      </p>
    );
  }

  return (
    <div className="cal-review-list">
      {reviews.map((r) => {
        const dt = new Date(r.scheduledAt);
        return (
          <div key={r.id} className="cal-review-row">
            <div className="cal-review-info">
              <div className="cal-review-title">{r.activity.title}</div>
              <div className="cal-review-date">
                {MONTHS[dt.getMonth()]} {dt.getDate()}
              </div>
            </div>
            <div className="cal-review-actions">
              <button
                type="button"
                className="cal-review-btn done"
                onClick={() => setActive({ review: r, outcome: 'DONE' })}
              >
                Fait
              </button>
              <button
                type="button"
                className="cal-review-btn missed"
                onClick={() => setActive({ review: r, outcome: 'MISSED' })}
              >
                Raté
              </button>
            </div>
          </div>
        );
      })}

      <ReviewActivityDialog
        activityTitle={active?.review.activity.title ?? ''}
        open={active !== null}
        defaultOutcome={active?.outcome ?? 'DONE'}
        onClose={() => setActive(null)}
        onSubmit={submit}
      />
    </div>
  );
}
