// Global activity-detail context. Any card on any page calls window.openActivity(activity).
// Activity shape (all optional except title + img):
//   { title, img, gallery: [], badges: [{label, kind}], flames, when, where, address,
//     duration, group, level, price, priceUnit, desc, tags: [], host: {name, role, avatar},
//     reviews: [{who, text}], pin: {x, y, color}, mapImg }

const ActivityContext = React.createContext({ open: () => {}, close: () => {} });

const ActivityProvider = ({ children }) => {
  const [activity, setActivity] = React.useState(null);
  const open = React.useCallback((a) => setActivity(a), []);
  const close = React.useCallback(() => setActivity(null), []);

  // Lock body scroll when open
  React.useEffect(() => {
    document.body.style.overflow = activity ? "hidden" : "";
    const onKey = (e) => { if (e.key === "Escape") close(); };
    if (activity) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activity, close]);

  // Expose globally for non-React callers / convenience
  React.useEffect(() => {
    window.openActivity = open;
    window.closeActivity = close;
  }, [open, close]);

  return (
    <ActivityContext.Provider value={{ open, close }}>
      {children}
      {activity && <ActivityModal activity={activity} onClose={close} />}
    </ActivityContext.Provider>
  );
};

const ActivityModal = ({ activity, onClose }) => {
  const a = activity;
  const gallery = a.gallery && a.gallery.length ? a.gallery : [a.img];
  const [main, setMain] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="act-overlay" onClick={onClose}>
      <div className="act-modal" onClick={(e) => e.stopPropagation()}>
        <button className="act-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>

        <div className="act-scroll">
          <div className="act-hero">
            <div className="act-hero-img" style={{ backgroundImage: `url(${gallery[main]})` }}/>
            <div className="act-hero-meta">
              <div>
                {a.badges && a.badges.length > 0 && (
                  <div className="act-badges">
                    {a.badges.map((b) => (
                      <span key={b.label} className={"act-badge " + (b.kind || "")}>
                        {b.kind === "warm" && <Icon name="fire" size={11}/>}
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}
                <h1 className="act-h1">{a.title}</h1>
              </div>
              {a.flames != null && (
                <div className="act-flames-pill">
                  <FlameRow value={a.flames} size={12}/>
                  <span>Trending</span>
                </div>
              )}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="act-thumbs">
              {gallery.slice(0, 5).map((g, i) => (
                <button
                  key={i}
                  className={"act-thumb " + (i === main ? "active" : "")}
                  style={{ backgroundImage: `url(${g})` }}
                  onClick={() => setMain(i)}
                  aria-label={`Photo ${i+1}`}
                />
              ))}
            </div>
          )}

          <div className="act-body">
            <div>
              <h3>About this activity</h3>
              <p className="act-desc">{a.desc}</p>

              <h3>Good to know</h3>
              <div className="act-info-grid">
                {a.when && <InfoItem icon="calendar" label="When" value={a.when}/>}
                {a.duration && <InfoItem icon="compass" label="Duration" value={a.duration}/>}
                {a.group && <InfoItem icon="users" label="Group size" value={a.group}/>}
                {a.level && <InfoItem icon="sparkle" label="Level" value={a.level}/>}
              </div>

              {a.tags && a.tags.length > 0 && (
                <>
                  <h3>Vibe</h3>
                  <div className="act-tag-row">
                    {a.tags.map((t) => <span key={t} className="act-tag">{t}</span>)}
                  </div>
                </>
              )}

              {a.host && (
                <>
                  <h3>Hosted by</h3>
                  <div className="act-host">
                    <div className="act-host-avatar" style={{ backgroundImage: `url(${a.host.avatar})` }}/>
                    <div>
                      <div className="act-host-name">{a.host.name}</div>
                      <div className="act-host-meta">{a.host.role}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="act-side">
              {a.address && (
                <>
                  <h3>Location</h3>
                  <div className="act-mini-map">
                    <MiniMap pin={a.pin} mapImg={a.mapImg}/>
                  </div>
                  <div className="act-address">
                    <span className="ico"><Icon name="pin" size={14}/></span>
                    <span>{a.address}</span>
                  </div>
                  <a className="act-directions" href="#">
                    Get directions <Icon name="arrow-right" size={13}/>
                  </a>
                </>
              )}

              {a.reviews && a.reviews.length > 0 && (
                <>
                  <h3 style={{ marginTop: 8 }}>What people say</h3>
                  <div className="act-reviews">
                    {a.reviews.map((r, i) => (
                      <p key={i} className="act-review">
                        <span className="who">{r.who}</span>
                        "{r.text}"
                      </p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="act-footer">
          <div className="act-price-blk">
            {a.price && <span className="act-price-num">{a.price}</span>}
            {a.priceUnit && <span className="act-price-unit">{a.priceUnit}</span>}
            {!a.price && <span className="act-price-unit">Free entry</span>}
          </div>
          <div className="act-cta-row">
            <button
              className={"act-secondary " + (saved ? "saved" : "")}
              onClick={() => setSaved(!saved)}
            >
              <Icon name={saved ? "save-fill" : "save"} size={14}/>
              {saved ? "Saved" : "Save"}
            </button>
            <button className="act-cta">
              Book this <Icon name="arrow-right" size={14}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="act-info">
    <span className="ico"><Icon name={icon} size={15}/></span>
    <div>
      <div className="act-info-key">{label}</div>
      <div className="act-info-val">{value}</div>
    </div>
  </div>
);

// Tiny map for the modal — reuses inline SVG style of main map.
const MiniMap = ({ pin, mapImg }) => {
  const p = pin || { x: 50, y: 55, color: "orange" };
  return (
    <>
      <svg viewBox="0 0 400 320" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <rect width="400" height="320" fill="#EFE6D2"/>
        <path d="M0 240 C 80 230, 160 260, 260 232 C 340 210, 400 220, 400 220 L 400 320 L 0 320 Z" fill="#C7DAE6"/>
        <ellipse cx="100" cy="120" rx="36" ry="28" fill="#D4E3C8"/>
        <ellipse cx="300" cy="80" rx="28" ry="22" fill="#D4E3C8"/>
        <g stroke="#D8CCAE" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M0 70 L 400 100"/>
          <path d="M0 150 L 400 180"/>
          <path d="M120 0 L 180 320"/>
          <path d="M280 0 L 340 320"/>
        </g>
        <g stroke="#E2D7B8" strokeWidth="2" fill="none">
          <path d="M0 200 L 400 220"/>
          <path d="M60 0 L 100 320"/>
          <path d="M220 0 L 260 320"/>
        </g>
      </svg>
      <div className={"map-pin " + (p.color || "orange")} style={{ left: `${p.x}%`, top: `${p.y}%`, position: "absolute" }}>
        <span className="pin-bubble">
          <Icon name="pin" size={13}/>
        </span>
      </div>
    </>
  );
};

window.ActivityProvider = ActivityProvider;
window.ActivityContext = ActivityContext;
