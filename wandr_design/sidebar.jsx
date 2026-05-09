const Sidebar = () => {
  const [activeSection, setActive] = React.useState("For You");
  const [activeCat, setCat] = React.useState("All");

  return (
    <aside className="sidebar">
      <div className="side-eyebrow">Explore</div>
      <div className="side-list">
        {SIDEBAR_SECTIONS.map((s) => (
          <button
            key={s.name}
            className={"side-item " + (activeSection === s.name ? "active" : "")}
            onClick={() => setActive(s.name)}
          >
            <span className="ico"><Icon name={s.icon} size={17}/></span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      <div className="side-eyebrow">Categories</div>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c.name}
            className={"cat-chip " + (activeCat === c.name ? "active" : "")}
            onClick={() => setCat(c.name)}
          >
            <span className="ico"><Icon name={c.icon} size={14}/></span>
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      <div className="side-eyebrow">
        <span>Trending Now</span>
        <a className="link" href="#">See all</a>
      </div>
      <div className="trend-list">
        {TRENDING.map((t) => (
          <button key={t.title} className="trend-row">
            <span className="trend-thumb" style={{ backgroundImage: `url(${t.img})` }} />
            <span>
              <div className="trend-title">{t.title.split("\n").map((l, i) => <div key={i}>{l}</div>)}</div>
              <FlameRow value={t.flames} size={10} />
            </span>
          </button>
        ))}
      </div>

      <div className="side-eyebrow">
        <span>Saved Shortcuts</span>
        <a className="link" href="#">Manage</a>
      </div>
      <div className="shortcut-list">
        {SHORTCUTS.map((s) => (
          <button key={s.name} className="shortcut">
            <span className="ico"><Icon name={s.icon} size={16}/></span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      <button className="open-map-btn">
        <Icon name="map" size={16}/>
        Open Map
      </button>
    </aside>
  );
};

window.Sidebar = Sidebar;
