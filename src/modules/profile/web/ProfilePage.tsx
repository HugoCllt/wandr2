import type { ProfileViewDTO } from '../../../shared/contracts/ProfileViewDTO';
import { Icon, type IconName } from '../../../shared/ui/icons/Icon';

const KNOWN_ICON_NAMES: ReadonlySet<string> = new Set([
  'ball',
  'heart',
  'fork',
  'culture',
  'mountain',
  'fire',
  'compass',
  'sparkle',
  'calendar',
]);

function asIconName(key: string, fallback: IconName = 'sparkle'): IconName {
  return KNOWN_ICON_NAMES.has(key) ? (key as IconName) : fallback;
}

const QUICK_ACTIONS: { name: string; meta: string; icon: IconName; kind: '' | 'warm' | 'ink' | 'cream' }[] = [
  { name: 'Favorites', meta: '23 saved', icon: 'heart', kind: 'warm' },
  { name: 'Preferences', meta: 'Vibe & filters', icon: 'sparkle', kind: 'ink' },
  { name: 'History', meta: '47 activities', icon: 'calendar', kind: 'cream' },
  { name: 'Settings', meta: 'Account & privacy', icon: 'compass', kind: '' },
];

export function ProfilePage({ view }: { view: ProfileViewDTO }) {
  const { profile, stats, breakdown, history } = view;

  return (
    <div className="profile-shell">
      <header className="profile-header">
        <div className="profile-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatarUrl} alt="" />
        </div>
        <div>
          <h1 className="profile-name">{profile.name}</h1>
          <p className="profile-vibe">{profile.vibe}</p>
          <div className="profile-tags">
            {profile.tags.map((t) => (
              <span key={t.label} className={'profile-tag ' + (t.kind ?? '')}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
        <button type="button" className="profile-edit">
          <Icon name="sparkle" size={14} /> Edit profile
        </button>
      </header>

      <section className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={'stat-foot ' + (s.footKind ?? '')}>
              {s.footKind === 'up' && <Icon name="arrow-right" size={12} stroke={2} />}
              {s.footKind === 'warm' && <Icon name="fire" size={12} />}
              {s.foot}
            </div>
          </div>
        ))}
      </section>

      <section className="profile-actions-wrap">
        <div className="profile-actions">
          <h3>Quick Actions</h3>
          <div className="qa-grid">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.name} type="button" className="qa-btn">
                <span className={'qa-icon ' + a.kind}>
                  <Icon name={a.icon} size={18} />
                </span>
                <span>
                  <div>{a.name}</div>
                  <div className="qa-meta">{a.meta}</div>
                </span>
                <Icon name="chev-right" size={14} />
              </button>
            ))}
          </div>
        </div>

        <div className="category-card">
          <h3>Category Breakdown</h3>
          {breakdown.map((c) => (
            <div key={c.name} className="cat-row">
              <div className="cat-row-label">
                <Icon name={asIconName(c.iconKey)} size={14} /> {c.name}
              </div>
              <div className="cat-row-bar">
                <div
                  className={'cat-row-fill ' + (c.cool ? 'cool' : '')}
                  style={{ width: `${c.percent * 2.5}%` }}
                />
              </div>
              <div className="cat-row-val">{c.percent}%</div>
            </div>
          ))}
        </div>
      </section>

      <section className="activity-list">
        <h3>Recent Activity</h3>
        {history.map((a) => (
          <div key={a.id} className="activity-row">
            <div className="activity-thumb" style={{ backgroundImage: `url(${a.imageUrl})` }} />
            <div>
              <div className="activity-title">{a.title}</div>
              <div className="activity-meta">{a.meta}</div>
            </div>
            <div className="activity-date">{a.date}</div>
            <span className={'activity-status ' + a.status}>
              {a.status === 'went' ? 'Went' : a.status === 'saved' ? 'Saved' : 'Upcoming'}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
