const SPORT_HERO_IMG = "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80";

const SPORT_TABS = [
  { id: "watch", name: "Watch Live", icon: "fire" },
  { id: "play", name: "Play Yourself", icon: "racket" },
  { id: "classes", name: "Group Classes", icon: "users" },
  { id: "deals", name: "Deals", icon: "sparkle" },
  { id: "outdoor", name: "Outdoor", icon: "mountain" },
];

const LIVE = [
  { title: "Canadiens vs Rangers", when: "Tonight • 7:00 PM", venue: "Bell Centre", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80", live: true },
  { title: "F1 Practice Session", when: "Sat • 1:30 PM", venue: "Circuit Gilles-Villeneuve", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80" },
  { title: "Impact FC vs Toronto", when: "Sun • 4:00 PM", venue: "Stade Saputo", img: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80" },
];

const PLAY = [
  { title: "Padel District", area: "Griffintown", price: "$28 / hr", deal: "20% off", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=700&q=80", icon: "racket" },
  { title: "Allez Up Climbing", area: "Saint-Henri", price: "$22 / day", img: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=700&q=80", icon: "climb" },
  { title: "Tennis 13 Indoor", area: "Laval", price: "$32 / hr", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=700&q=80", icon: "racket" },
  { title: "Bota Bota Pool", area: "Old Port", price: "$45 / day", deal: "New", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=700&q=80", icon: "spa" },
];

const CLASSES = [
  { title: "Sunrise Yoga at Mont-Royal", who: "with Léa Bélanger", when: "Sat 7:00 AM", img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=400&q=80", tag: "Free", tagKind: "" },
  { title: "Spinning — Studio Lacroix", who: "with Marc Tremblay", when: "Tue & Thu 6:30 PM", img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80", tag: "30% off", tagKind: "deal" },
  { title: "Boxing Fundamentals", who: "Underdog Boxing", when: "Mon–Fri 7:00 PM", img: "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=400&q=80", tag: "Drop-in", tagKind: "" },
  { title: "Group Run — Lafontaine", who: "Run Club MTL", when: "Wed 6:30 PM", img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80", tag: "Free", tagKind: "" },
  { title: "Kickboxing Cardio", who: "Vie Active", when: "Sat 11:00 AM", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80", tag: "First class free", tagKind: "deal" },
  { title: "Pilates Reformer", who: "Studio Method", when: "Daily", img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80", tag: "$28", tagKind: "" },
];

const SportPage = () => {
  const [tab, setTab] = React.useState("watch");
  return (
    <div className="page-section">
      <div className="sport-hero">
        <div className="sport-hero-img" style={{ backgroundImage: `url(${SPORT_HERO_IMG})` }} />
        <div className="sport-hero-inner">
          <div className="hero-eyebrow">SPORT IN MONTREAL</div>
          <h1>Watch the city play.</h1>
          <p>From front-row hockey nights to padel courts, climbing walls and sunrise yoga on the mountain — your sport, curated.</p>
        </div>
      </div>

      <div className="sport-tabs">
        {SPORT_TABS.map((t) => (
          <button key={t.id} className={"sport-tab " + (tab === t.id ? "active" : "")} onClick={() => setTab(t.id)}>
            <span className="ico"><Icon name={t.icon} size={14}/></span>
            {t.name}
          </button>
        ))}
      </div>

      <section className="sport-section">
        <div className="section-head">
          <div>
            <h2>Watch Live</h2>
            <p>Tickets and live action this week</p>
          </div>
          <a className="link" href="#" style={{ color: "var(--orange-2)", fontSize: 13, fontWeight: 600 }}>See all</a>
        </div>
        <div className="live-row">
          {LIVE.map((l, i) => (
            <article key={l.title} className="live-card" style={{ minHeight: i === 0 ? 320 : 240, cursor: "pointer" }}
              onClick={() => window.openActivity(toActivity({ title: l.title, img: l.img, when: l.when, where: l.venue, price: "$45+", flames: 4 }))}>
              <div className="live-img" style={{ backgroundImage: `url(${l.img})` }} />
              {l.live && <span className="live-pill"><span className="pulse" /> Live tonight</span>}
              <div className="live-content">
                <h4>{l.title}</h4>
                <div className="live-meta">
                  <span>{l.when}</span><span className="dot"/><span>{l.venue}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sport-section">
        <div className="section-head">
          <div>
            <h2>Play Yourself</h2>
            <p>Book a court, a wall, a wave</p>
          </div>
        </div>
        <div className="play-grid">
          {PLAY.map((p) => (
            <button key={p.title} className="play-card" onClick={() => window.openActivity(toActivity({ title: p.title, img: p.img, where: p.area, price: p.price, flames: 3 }))}>
              <div className="play-img" style={{ backgroundImage: `url(${p.img})` }}>
                {p.deal && <span className="play-deal">{p.deal}</span>}
              </div>
              <div className="play-body">
                <h4 className="play-title">{p.title}</h4>
                <div className="play-meta">{p.area}</div>
                <div className="play-foot">
                  <span className="play-price">{p.price}</span>
                  <FlameRow value={3} size={10} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="sport-section">
        <div className="section-head">
          <div>
            <h2>Group Classes</h2>
            <p>Sweat with the city</p>
          </div>
        </div>
        <div className="classes-grid">
          {CLASSES.map((c) => (
            <button key={c.title} className="class-card" onClick={() => window.openActivity(toActivity({ title: c.title, img: c.img, when: c.when, where: c.who, price: c.tag, flames: 3 }))}>
              <div className="class-img" style={{ backgroundImage: `url(${c.img})` }} />
              <div className="class-body">
                <h4 className="class-title">{c.title}</h4>
                <div className="class-row"><span className="who">{c.who}</span></div>
                <div className="class-row"><Icon name="calendar" size={12}/> {c.when}</div>
                <div className="class-foot">
                  <span className={"class-tag " + c.tagKind}>{c.tag}</span>
                  <FlameRow value={3} size={10} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

window.SportPage = SportPage;
