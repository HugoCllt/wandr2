const PROFILE_STATS = [
  { label: "Activities", value: "47", foot: "+8 this month", footKind: "up" },
  { label: "Saved", value: "23", foot: "Across 6 lists" },
  { label: "Top Category", value: "Sport", foot: "32% of plans", footKind: "warm" },
  { label: "Outings / mo", value: "12", foot: "+3 vs last", footKind: "up" },
  { label: "Trend Score", value: "84", foot: "Top 12% in MTL", footKind: "warm" },
];

const QUICK_ACTIONS = [
  { name: "Favorites", meta: "23 saved", icon: "heart", kind: "warm" },
  { name: "Preferences", meta: "Vibe & filters", icon: "sparkle", kind: "ink" },
  { name: "History", meta: "47 activities", icon: "calendar", kind: "cream" },
  { name: "Settings", meta: "Account & privacy", icon: "compass", kind: "" },
];

const CATEGORY_BREAKDOWN = [
  { name: "Sport", value: 32, icon: "ball" },
  { name: "Romantic", value: 18, icon: "heart" },
  { name: "Dining", value: 22, icon: "fork", cool: true },
  { name: "Cultural", value: 14, icon: "culture", cool: true },
  { name: "Outdoor", value: 14, icon: "mountain" },
];

const ACTIVITY_HISTORY = [
  { title: "Canadiens vs Bruins", meta: "Bell Centre", date: "May 04", status: "Went", kind: "went", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=200&q=80" },
  { title: "Rooftop Fridays", meta: "Terrasse Nelligan", date: "Apr 28", status: "Went", kind: "went", img: "https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=200&q=80" },
  { title: "Sunrise Yoga at Mont-Royal", meta: "Léa Bélanger", date: "May 11", status: "Saved", kind: "saved", img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=200&q=80" },
  { title: "F1 Canadian Grand Prix", meta: "Circuit Gilles-Villeneuve", date: "Jun 08", status: "Upcoming", kind: "upcoming", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80" },
];

const ProfilePage = () => (
  <div className="profile-shell">
    <header className="profile-header">
      <div className="profile-avatar">
        <img src={IMG.avatar} alt="" />
      </div>
      <div>
        <h1 className="profile-name">Étienne Lavoie</h1>
        <p className="profile-vibe">"Always one plan ahead — somewhere between a rink and a rooftop."</p>
        <div className="profile-tags">
          <span className="profile-tag warm">Sport-driven</span>
          <span className="profile-tag cool">Old Montreal regular</span>
          <span className="profile-tag">Foodie · curious</span>
        </div>
      </div>
      <button className="profile-edit">
        <Icon name="sparkle" size={14}/> Edit profile
      </button>
    </header>

    <section className="stats-grid">
      {PROFILE_STATS.map((s) => (
        <div key={s.label} className="stat-card">
          <div className="stat-label">{s.label}</div>
          <div className="stat-value">{s.value}</div>
          <div className={"stat-foot " + (s.footKind || "")}>
            {s.footKind === "up" && <Icon name="arrow-right" size={12} stroke={2}/>}
            {s.footKind === "warm" && <Icon name="fire" size={12}/>}
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
            <button key={a.name} className="qa-btn">
              <span className={"qa-icon " + a.kind}><Icon name={a.icon} size={18}/></span>
              <span>
                <div>{a.name}</div>
                <div className="qa-meta">{a.meta}</div>
              </span>
              <Icon name="chev-right" size={14}/>
            </button>
          ))}
        </div>
      </div>

      <div className="category-card">
        <h3>Category Breakdown</h3>
        {CATEGORY_BREAKDOWN.map((c) => (
          <div key={c.name} className="cat-row">
            <div className="cat-row-label">
              <Icon name={c.icon} size={14}/> {c.name}
            </div>
            <div className="cat-row-bar">
              <div className={"cat-row-fill " + (c.cool ? "cool" : "")} style={{ width: `${c.value * 2.5}%` }} />
            </div>
            <div className="cat-row-val">{c.value}%</div>
          </div>
        ))}
      </div>
    </section>

    <section className="activity-list">
      <h3>Recent Activity</h3>
      {ACTIVITY_HISTORY.map((a) => (
        <div key={a.title} className="activity-row">
          <div className="activity-thumb" style={{ backgroundImage: `url(${a.img})` }}/>
          <div>
            <div className="activity-title">{a.title}</div>
            <div className="activity-meta">{a.meta}</div>
          </div>
          <div className="activity-date">{a.date}</div>
          <span className={"activity-status " + a.kind}>{a.status}</span>
        </div>
      ))}
    </section>
  </div>
);

window.ProfilePage = ProfilePage;
