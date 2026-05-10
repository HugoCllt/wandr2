const Recommendations = () => {
  const [activeChip, setChip] = React.useState("All");
  const [saved, setSaved] = React.useState({});
  const toggleSave = (i) => setSaved((s) => ({ ...s, [i]: !s[i] }));

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Recommended for You</h2>
          <p>Curated picks based on your vibe</p>
        </div>
      </div>

      <div className="rec-controls">
        {REC_CHIPS.map((c) => (
          <button
            key={c.name}
            className={"chip " + (activeChip === c.name ? "active" : "")}
            onClick={() => setChip(c.name)}
          >
            {c.icon ? <Icon name={c.icon} size={13}/> : null}
            {c.name}
          </button>
        ))}
        <span className="spacer" />
        <button className="sort-btn">
          Sort
          <Icon name="chev-down" size={14}/>
        </button>
      </div>

      <div className="rec-grid">
        {RECS.map((r, i) => (
          <article key={r.title} className="rec-card" onClick={() => window.openActivity(toActivity(r))}>
            <div className="rec-img" style={{ backgroundImage: `url(${r.img})` }} />
            <span className={"rec-badge " + r.badge.kind}>{r.badge.label}</span>
            <button
              className={"rec-save " + (saved[i] ? "saved" : "")}
              onClick={(e) => { e.stopPropagation(); toggleSave(i); }}
              aria-label={saved[i] ? "Saved" : "Save"}
            >
              <Icon name="fire" size={14} />
            </button>
            <div className="rec-content">
              <h3 className="rec-title">{r.title.split("\n").map((l, k) => <div key={k}>{l}</div>)}</h3>
              <div className="rec-meta-row">
                <div className="rec-meta">
                  <div>{r.when}</div>
                  <div className="dim">{r.where}</div>
                </div>
                <div className="rec-price">{r.price}</div>
              </div>
            </div>
            <div className="rec-foot">
              <span className="rec-foot-left">
                <Icon name="pin" size={13}/>
                View on Map
              </span>
              <button className="rec-bookmark" aria-label="Bookmark">
                <Icon name="bookmark" size={15}/>
              </button>
            </div>
          </article>
        ))}
        <button className="rec-side-arrow right" aria-label="More">
          <Icon name="chev-right" size={16}/>
        </button>
      </div>
    </section>
  );
};

const FooterBanner = () => (
  <section className="footer-cta">
    <div>
      <h3>Make every day an adventure.</h3>
      <p>Discover plans that match your mood, your people, your city.</p>
    </div>
    <div className="skyline">
      <FooterSkyline />
    </div>
    <button className="btn-primary">
      Let's Explore
      <Icon name="sparkle" size={14}/>
    </button>
  </section>
);

window.Recommendations = Recommendations;
window.FooterBanner = FooterBanner;
