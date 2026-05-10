const Hero = () => {
  const [idx, setIdx] = React.useState(0);
  const slide = HEROES[idx];
  const next = () => setIdx((i) => (i + 1) % HEROES.length);
  const prev = () => setIdx((i) => (i - 1 + HEROES.length) % HEROES.length);

  return (
    <section className="hero">
      <div className="hero-card">
        <div className="hero-img" style={{ backgroundImage: `url(${slide.img})` }} />
        <div className="hero-content">
          <div>
            <div className="hero-eyebrow">{slide.eyebrow}</div>
            <h1 className="hero-title">{slide.title.split("\n").map((l, i) => <div key={i}>{l}</div>)}</h1>
            <p className="hero-sub">{slide.sub}</p>
          </div>
          <div className="hero-cta-row">
            <button className="btn-primary" onClick={() => window.openActivity(toActivity({ title: slide.title, img: slide.img, when: "Featured this week", where: "Montreal", price: "From $45" }))}>
              Explore Now
              <Icon name="arrow-right" size={15} />
            </button>
          </div>
        </div>
        <button className="hero-arrow prev" onClick={prev} aria-label="Previous"><Icon name="chev-left" size={18}/></button>
        <button className="hero-arrow next" onClick={next} aria-label="Next"><Icon name="chev-right" size={18}/></button>
        <div className="hero-dots">
          {HEROES.map((_, i) => (
            <button key={i} className={"hero-dot " + (i === idx ? "active" : "")} onClick={() => setIdx(i)} aria-label={`Slide ${i+1}`} />
          ))}
        </div>
      </div>

      <div className="hero-side">
        {HERO_SIDE.map((c) => (
          <button key={c.title} className="side-card" onClick={() => window.openActivity(toActivity(c))}>
            <div className="side-card-img" style={{ backgroundImage: `url(${c.img})` }} />
            <div className="side-card-body">
              <h4>{c.title.split("\n").map((l, i) => <div key={i}>{l}</div>)}</h4>
              <FlameRow value={c.flames} size={11} dimColor="dim-light" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

window.Hero = Hero;
