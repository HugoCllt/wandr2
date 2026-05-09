const HomePage = () => (
  <div className="shell">
    <Sidebar />
    <main className="main">
      <Hero />
      <MapSection />
      <Recommendations />
      <FooterBanner />
    </main>
  </div>
);

const App = () => {
  const [route, setRoute] = React.useState("home");

  React.useEffect(() => {
    const onHash = () => {
      const r = window.location.hash.replace("#", "");
      if (["home","sport","chat","profile"].includes(r)) setRoute(r);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    if (window.location.hash.replace("#","") !== route) {
      window.location.hash = route;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);

  return (
    <div className="page">
      <Nav route={route} setRoute={setRoute} />
      <div className="edge-art left"><EdgeArtLeft /></div>
      <div className="edge-art right"><EdgeArtRight /></div>

      {route === "home" && <HomePage />}
      {route === "sport" && (
        <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
          <main className="main"><SportPage /></main>
        </div>
      )}
      {route === "chat" && (
        <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
          <main className="main"><ChatPage /></main>
        </div>
      )}
      {route === "profile" && (
        <div className="shell" style={{ gridTemplateColumns: "1fr" }}>
          <main className="main"><ProfilePage /></main>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
