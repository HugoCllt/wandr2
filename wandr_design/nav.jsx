// Routing context. App.jsx provides setRoute via window.
const Nav = ({ route, setRoute }) => {
  const links = [
    { name: "Home", icon: "home", id: "home" },
    { name: "Sport", icon: "sport", id: "sport" },
    { name: "Chat", icon: "chat", id: "chat" },
    { name: "Profile", icon: "profile", id: "profile" },
  ];
  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="logo" href="#" onClick={(e) => { e.preventDefault(); setRoute("home"); }}>
          <span>wandr</span>
          <span className="logo-spark">✦</span>
        </a>
        <label className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search activities, places, sports, vibes…" />
          <span className="search-kbd">⌘ K</span>
        </label>
        <div className="nav-links">
          {links.map((l) => (
            <a
              key={l.id}
              className={"nav-link " + (route === l.id ? "active" : "")}
              href="#"
              onClick={(e) => { e.preventDefault(); setRoute(l.id); }}
            >
              <Icon name={l.icon} size={16}/> {l.name}
            </a>
          ))}
        </div>
        <a className="avatar" href="#" aria-label="Profile" onClick={(e) => { e.preventDefault(); setRoute("profile"); }}>
          <img src={IMG.avatar} alt="" />
        </a>
      </div>
    </nav>
  );
};

window.Nav = Nav;
