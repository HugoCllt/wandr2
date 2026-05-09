// Inline SVG "Montreal" map. Hand-tuned shapes — looks like a real map at a glance.
const MapSvg = () => (
  <svg viewBox="0 0 600 320" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
    <defs>
      <pattern id="cream-noise" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#EFE6D2" />
      </pattern>
    </defs>
    {/* land */}
    <rect width="600" height="320" fill="#EFE6D2" />
    {/* river St. Lawrence */}
    <path d="M 0 250 C 80 240, 160 270, 260 240 C 340 215, 420 240, 520 220 C 560 213, 600 220, 600 220 L 600 320 L 0 320 Z" fill="#C7DAE6" />
    {/* secondary water */}
    <path d="M 410 0 C 412 60, 444 110, 470 140 C 488 162, 500 200, 530 220 L 540 220 L 540 0 Z" fill="#C7DAE6" />
    {/* parks */}
    <ellipse cx="160" cy="120" rx="46" ry="38" fill="#D4E3C8" />
    <ellipse cx="380" cy="80" rx="34" ry="26" fill="#D4E3C8" />
    {/* roads */}
    <g stroke="#D8CCAE" strokeWidth="6" fill="none" strokeLinecap="round">
      <path d="M0 60 L 600 100" />
      <path d="M0 130 L 600 170" />
      <path d="M0 200 L 600 230" />
      <path d="M120 0 L 200 320" />
      <path d="M280 0 L 360 320" />
      <path d="M440 0 L 510 320" />
    </g>
    <g stroke="#E2D7B8" strokeWidth="2.5" fill="none">
      <path d="M0 90 L 600 130" />
      <path d="M60 0 L 110 320" />
      <path d="M220 0 L 270 320" />
      <path d="M360 0 L 420 320" />
    </g>
    {/* major route highlight */}
    <path d="M40 70 C 200 90, 350 100, 580 80" stroke="#EAE0C2" strokeWidth="9" fill="none" strokeLinecap="round" />
    {/* labels */}
    <g fill="#7A6F5A" fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="600" letterSpacing="0.06em">
      <text x="200" y="80" textAnchor="middle">PLATEAU-MONT-ROYAL</text>
      <text x="450" y="115" textAnchor="middle">OLD MONTREAL</text>
      <text x="280" y="262" textAnchor="middle">VERDUN</text>
    </g>
    <g fill="#3A332B" fontFamily="Bricolage Grotesque, sans-serif" fontSize="22" fontWeight="500" letterSpacing="-0.01em">
      <text x="220" y="170" textAnchor="middle">Montreal</text>
    </g>
  </svg>
);

const Pin = ({ pin }) => {
  if (pin.color === "me") {
    return <div className="map-dot-me" style={{ left: `${pin.x}%`, top: `${pin.y}%` }} />;
  }
  return (
    <div className={"map-pin " + pin.color} style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
      <span className="pin-bubble">
        {pin.color === "orange"
          ? <Icon name="fire" size={14}/>
          : <Icon name="pin" size={13}/>}
      </span>
    </div>
  );
};

const MapSection = () => (
  <section className="row-2">
    <div>
      <div className="section-head">
        <div>
          <h2>Explore Near You</h2>
          <p>Handpicked activities around Montreal</p>
        </div>
      </div>
      <div className="map-card">
        <MapSvg />
        {PINS.map((p, i) => <Pin key={i} pin={p} />)}
        <div className="map-controls">
          <button className="map-btn" aria-label="Zoom in"><Icon name="plus" size={16}/></button>
          <button className="map-btn" aria-label="Zoom out"><Icon name="minus" size={16}/></button>
          <button className="map-btn" aria-label="Locate me"><Icon name="locate" size={16}/></button>
        </div>
      </div>
    </div>

    <div>
      <div className="section-head" style={{ visibility: "hidden", height: 0, marginBottom: 0, padding: 0 }}>
        <div><h2>spacer</h2></div>
      </div>
      <div className="from-map">
        <div className="from-map-head">
          <h3>From the Map</h3>
          <a className="link" href="#">See what's around you</a>
        </div>
        <div className="from-map-grid">
          {FROM_MAP.map((c) => (
            <button key={c.title} className="fm-card">
              <div className="fm-img" style={{ backgroundImage: `url(${c.img})` }} />
              <div className="fm-body">
                <div className="fm-title">{c.title.split("\n").map((l, i) => <div key={i}>{l}</div>)}</div>
                <div className="fm-meta">
                  <span>{c.dist}</span>
                  <span className="dot"/>
                  <span>{c.area}</span>
                </div>
                <div className="fm-foot">
                  <span className="fm-price">{c.price}</span>
                  <FlameRow value={c.flames} size={9} />
                </div>
              </div>
            </button>
          ))}
        </div>
        <button className="fm-scroll-btn" aria-label="Scroll right">
          <Icon name="chev-right" size={16}/>
        </button>
      </div>
    </div>
  </section>
);

window.MapSection = MapSection;
