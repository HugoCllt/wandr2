/**
 * DESIGN SHOWCASE — NOT A PRODUCT PAGE.
 *
 * Living palette of the activity-card variants we keep. Used as a visual
 * reference for the richer multi-section Category page design (see CONTEXT.md
 * "Design showcase" and the `tbd.md` deferral). Pulls romantic activities purely
 * as demo data; the page is not tied to that category.
 *
 * Real category pages live under the dynamic `[category]` route — do not copy
 * this file as a template.
 */

import { loadCategoryFeedDTO } from '../../../modules/feed/web/loadCategoryFeed';
import { CATEGORY_PRESETS } from '../../../shared/presets/CATEGORY_PRESETS';
import { AddToCalendarButton } from '../../../modules/calendar/web/AddToCalendarButton';
import { FavoriteButton } from '../../../modules/favorites/web/FavoriteButton';
import { ClassActivityCard } from '../../../modules/activities/web/cards/ClassActivityCard';
import { HeroActivityCard } from '../../../modules/activities/web/cards/HeroActivityCard';
import { CoverActivityCard } from '../../../modules/activities/web/cards/CoverActivityCard';
import { MediaRowActivityCard } from '../../../modules/activities/web/cards/MediaRowActivityCard';
import { toURLSearchParams, type SearchParamsInput } from '../_lib/searchParams';

export const dynamic = 'force-dynamic';

const TAG_LABELS: Array<{ tag: string; tagKind: 'deal' | '' }> = [
  { tag: 'Tonight', tagKind: '' },
  { tag: '30% off', tagKind: 'deal' },
  { tag: 'Drop-in', tagKind: '' },
  { tag: 'Sold out soon', tagKind: 'deal' },
  { tag: 'New', tagKind: '' },
  { tag: 'Couples', tagKind: '' },
];

export default async function DesignShowcasePage({ searchParams }: { searchParams: SearchParamsInput }) {
  const params = toURLSearchParams(searchParams);
  // Demo data: romantic activities make for visually rich cards. The page itself
  // is not coupled to that category — swap the key if needed.
  const feed = await loadCategoryFeedDTO('romantic', params);
  const cfg = CATEGORY_PRESETS.romantic;
  const titleLines = cfg.heroTitle.split('\n');
  const items = feed.items;

  const pick = (start: number, n: number) => {
    if (items.length === 0) return [];
    return Array.from({ length: n }, (_, i) => items[(start + i) % items.length]);
  };

  const heroItem = items[0];
  const sideItems = pick(1, 3);
  const mediaRows = pick(0, 3);
  const liveItems = pick(1, 3);
  const classItems = pick(0, 6);

  return (
    <>
      <div
        role="note"
        aria-label="Design palette"
        style={{
          margin: '12px 0',
          padding: '8px 14px',
          background: '#fff7ed',
          border: '1px dashed #fb923c',
          borderRadius: 8,
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9a3412',
        }}
      >
        Design palette — card variants reference, not a product page.
      </div>

      <div className="page-hero">
        <div className="page-hero-img" style={{ backgroundImage: `url(${cfg.heroImage})` }} />
        <div className="page-hero-inner">
          <div className="hero-eyebrow">{cfg.eyebrow}</div>
          <h1>
            {titleLines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </h1>
          <p>{cfg.heroSub}</p>
        </div>
      </div>

      {heroItem && (
        <section className="hero">
          <HeroActivityCard activity={heroItem} eyebrow="ROMANTIC PICK OF THE WEEK" />
          {sideItems.length > 0 && (
            <div className="hero-side">
              {sideItems.map((a, i) => (
                <ClassActivityCard key={`side-${i}-${a.id}`} activity={a} flames={4} />
              ))}
            </div>
          )}
        </section>
      )}

      {mediaRows.length > 0 && (
        <section className="content-section">
          <div className="section-head">
            <div>
              <h2>In the Spotlight</h2>
              <p>Editorial picks worth a longer look.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mediaRows.map((a, i) => (
              <MediaRowActivityCard
                key={`mr-${i}-${a.id}`}
                activity={a}
                side={i % 2 === 0 ? 'left' : 'right'}
                eyebrow={i === 0 ? 'EDITOR’S NOTE' : 'STILL ON OUR LIST'}
                favoriteSlot={<FavoriteButton activityId={a.id} initialFavorited={a.isFavorited} />}
                calendarSlot={<AddToCalendarButton activityId={a.id} activityTitle={a.title} />}
              />
            ))}
          </div>
        </section>
      )}

      {liveItems.length > 0 && (
        <section className="content-section">
          <div className="section-head">
            <div>
              <h2>Tonight in Montréal</h2>
              <p>Cinematic plans happening after sundown.</p>
            </div>
          </div>
          <div className="cover-row">
            {liveItems.map((a, i) => (
              <CoverActivityCard
                key={`live-${i}-${a.id}`}
                activity={a}
                live={i === 0}
                size={i === 0 ? 'lg' : 'sm'}
              />
            ))}
          </div>
        </section>
      )}

      {classItems.length > 0 && (
        <section className="content-section">
          <div className="section-head">
            <div>
              <h2>Two-Person Workshops</h2>
              <p>Hands-on plans, with somebody.</p>
            </div>
          </div>
          <div className="classes-grid">
            {classItems.map((a, i) => {
              const t = TAG_LABELS[i % TAG_LABELS.length];
              return (
                <ClassActivityCard
                  key={`cls-${i}-${a.id}`}
                  activity={a}
                  tag={t.tag}
                  tagKind={t.tagKind}
                  flames={3}
                />
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
