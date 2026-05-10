// Saved + booked activities, anchored to a real-feeling May 2026 calendar.
// kind: "booked" (orange) | "saved" (blue) | "past" (ink, faded)

const CAL_EVENTS = [
  // Past
  { date: "2026-05-04", title: "Canadiens vs Bruins", venue: "Bell Centre", time: "7:00 PM", kind: "past", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80", price: "$89" },
  { date: "2026-05-06", title: "Run Club — Lafontaine", venue: "Plateau", time: "6:30 PM", kind: "past", img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80", price: "Free" },
  { date: "2026-05-08", title: "Rooftop Fridays", venue: "Terrasse Nelligan", time: "9:00 PM", kind: "past", img: "https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=400&q=80", price: "$25" },
  // This week (around May 9)
  { date: "2026-05-09", title: "Sunrise Yoga", venue: "Mont-Royal", time: "7:00 AM", kind: "booked", img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=400&q=80", price: "Free" },
  { date: "2026-05-09", title: "Padel District", venue: "Griffintown", time: "6:30 PM", kind: "booked", img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=400&q=80", price: "$28" },
  { date: "2026-05-11", title: "Jazz at Le Balcon", venue: "Le Plateau", time: "8:30 PM", kind: "booked", img: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=400&q=80", price: "$30" },
  { date: "2026-05-13", title: "Bota Bota Spa", venue: "Old Port", time: "5:00 PM", kind: "saved", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80", price: "$45" },
  { date: "2026-05-14", title: "Boxing Fundamentals", venue: "Underdog Boxing", time: "7:00 PM", kind: "saved", img: "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=400&q=80", price: "$22" },
  { date: "2026-05-15", title: "Canadiens vs Rangers", venue: "Bell Centre", time: "7:00 PM", kind: "booked", img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&q=80", price: "$89" },
  { date: "2026-05-15", title: "Rooftop Fridays", venue: "Terrasse Nelligan", time: "10:00 PM", kind: "saved", img: "https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=400&q=80", price: "$25" },
  { date: "2026-05-16", title: "Mural Festival", venue: "Saint-Laurent", time: "Noon", kind: "booked", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80", price: "Free" },
  { date: "2026-05-17", title: "Sunset Sail", venue: "St. Lawrence", time: "6:30 PM", kind: "saved", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80", price: "$65" },
  { date: "2026-05-18", title: "Allez Up Climbing", venue: "Saint-Henri", time: "7:00 PM", kind: "saved", img: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=400&q=80", price: "$22" },
  { date: "2026-05-21", title: "Pilates Reformer", venue: "Studio Method", time: "8:00 AM", kind: "booked", img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80", price: "$28" },
  { date: "2026-05-23", title: "Satay Brothers", venue: "Village", time: "8:00 PM", kind: "saved", img: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80", price: "$25" },
  { date: "2026-05-24", title: "Lafontaine Run Club", venue: "Plateau", time: "6:30 PM", kind: "booked", img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80", price: "Free" },
  { date: "2026-05-25", title: "Jazz at Le Balcon", venue: "Le Plateau", time: "8:30 PM", kind: "saved", img: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=400&q=80", price: "$30" },
  { date: "2026-05-29", title: "Spinning — Lacroix", venue: "Studio Lacroix", time: "6:30 PM", kind: "booked", img: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=400&q=80", price: "$22" },
  { date: "2026-05-30", title: "Kickboxing Cardio", venue: "Vie Active", time: "11:00 AM", kind: "saved", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80", price: "Free" },
  { date: "2026-06-08", title: "F1 Canadian GP", venue: "Circuit G.-Villeneuve", time: "1:00 PM", kind: "booked", img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=400&q=80", price: "$220" },
];

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function fmtDate(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function buildMonthGrid(y, m) {
  const first = new Date(y, m, 1);
  // Make Monday = 0
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ y, m: m-1, d: daysInPrev - i, outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ y, m, d, outside: false });
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length-1];
    let nd = last.d + 1;
    let nm = last.m;
    let ny = last.y;
    if (last.outside === false && d > 1) { /* no-op */ }
    if (nd > new Date(ny, nm+1, 0).getDate()) {
      nd = 1; nm += 1;
      if (nm > 11) { nm = 0; ny += 1; }
    }
    cells.push({ y: ny, m: nm, d: nd, outside: nm !== m });
    if (cells.length >= 42) break;
  }
  return cells;
}

const CalendarPage = () => {
  // Anchor "today" to May 9 2026
  const TODAY = { y: 2026, m: 4, d: 9 };
  const [view, setView] = React.useState({ y: 2026, m: 4 });
  const [selected, setSelected] = React.useState("2026-05-09");

  const cells = React.useMemo(() => buildMonthGrid(view.y, view.m), [view]);
  const eventsByDate = React.useMemo(() => {
    const map = {};
    CAL_EVENTS.forEach(e => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  }, []);

  const goPrev = () => setView(({y,m}) => m === 0 ? {y: y-1, m: 11} : {y, m: m-1});
  const goNext = () => setView(({y,m}) => m === 11 ? {y: y+1, m: 0} : {y, m: m+1});
  const goToday = () => { setView({y: TODAY.y, m: TODAY.m}); setSelected(fmtDate(TODAY.y, TODAY.m, TODAY.d)); };

  const upcoming = CAL_EVENTS
    .filter(e => e.date >= "2026-05-09")
    .slice(0, 6);

  const monthEvents = CAL_EVENTS.filter(e => e.date.startsWith(`${view.y}-${String(view.m+1).padStart(2,"0")}`));
  const stats = {
    booked: monthEvents.filter(e => e.kind === "booked").length,
    saved: monthEvents.filter(e => e.kind === "saved").length,
    past: monthEvents.filter(e => e.kind === "past").length,
    total: monthEvents.length,
  };

  const openEvent = (e) => {
    window.openActivity(toActivity({
      title: e.title, img: e.img, when: `${MONTHS[parseInt(e.date.slice(5,7))-1]} ${parseInt(e.date.slice(8,10))} • ${e.time}`,
      where: e.venue, price: e.price, flames: 3,
    }));
  };

  return (
    <div className="cal-shell">
      <div className="cal-main">
        <div className="cal-header">
          <div>
            <h1>Your Calendar</h1>
            <p>Everything you've booked, saved or want to revisit — in one place.</p>
          </div>
          <div className="cal-toolbar">
            <button className="chat-tool" onClick={goToday}>Today</button>
            <div className="cal-month">
              <button className="cal-icon-btn" onClick={goPrev} aria-label="Previous month"><Icon name="chev-left" size={14}/></button>
              <span className="cal-month-name">{MONTHS[view.m]} {view.y}</span>
              <button className="cal-icon-btn" onClick={goNext} aria-label="Next month"><Icon name="chev-right" size={14}/></button>
            </div>
            <div className="cal-view-toggle">
              <button className="active">Month</button>
              <button>Week</button>
              <button>List</button>
            </div>
          </div>
        </div>

        <div className="cal-grid">
          <div className="cal-grid-head">
            {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="cal-grid-body">
            {cells.map((c, i) => {
              const ds = fmtDate(c.y, c.m, c.d);
              const evs = eventsByDate[ds] || [];
              const isToday = c.y === TODAY.y && c.m === TODAY.m && c.d === TODAY.d;
              const isSel = ds === selected;
              return (
                <div
                  key={i}
                  className={"cal-cell" + (c.outside ? " outside" : "") + (isToday ? " today" : "") + (isSel ? " selected" : "")}
                  onClick={() => setSelected(ds)}
                >
                  <span className="cal-day">{c.d}</span>
                  {evs.slice(0, 3).map((e, k) => {
                    const cls = e.kind === "saved" ? "cool" : e.kind === "past" ? "ink faded" : "";
                    return (
                      <div key={k} className={"cal-event " + cls}
                        onClick={(ev) => { ev.stopPropagation(); openEvent(e); }}
                        title={`${e.time} — ${e.title}`}>
                        <span className="cal-event-dot"/>
                        <span style={{overflow:"hidden", textOverflow:"ellipsis"}}>{e.title}</span>
                      </div>
                    );
                  })}
                  {evs.length > 3 && <span className="cal-more">+{evs.length - 3} more</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="cal-side">
        <div className="cal-card">
          <h3>This month</h3>
          <p>{MONTHS[view.m]} at a glance</p>
          <div className="cal-stats">
            <div className="cal-stat"><div className="cal-stat-val">{stats.booked}</div><div className="cal-stat-key">Booked</div></div>
            <div className="cal-stat"><div className="cal-stat-val">{stats.saved}</div><div className="cal-stat-key">Saved</div></div>
            <div className="cal-stat"><div className="cal-stat-val">{stats.past}</div><div className="cal-stat-key">Attended</div></div>
            <div className="cal-stat"><div className="cal-stat-val">{stats.total}</div><div className="cal-stat-key">Total plans</div></div>
          </div>
        </div>

        <div className="cal-card">
          <h3>Upcoming</h3>
          <p>Next 6 plans on your calendar</p>
          <div className="cal-upcoming">
            {upcoming.map((e, i) => {
              const mo = MONTHS[parseInt(e.date.slice(5,7))-1].slice(0,3);
              const d = parseInt(e.date.slice(8,10));
              return (
                <button key={i} className="cal-up-row" onClick={() => openEvent(e)}>
                  <div className="cal-up-date">
                    <div className="mo">{mo}</div>
                    <div className="d">{d}</div>
                  </div>
                  <div>
                    <div className="cal-up-title">{e.title}</div>
                    <div className="cal-up-meta">
                      <span>{e.time}</span><span className="dot"/><span>{e.venue}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="cal-card">
          <h3>Legend</h3>
          <div className="cal-legend" style={{ marginTop: 6 }}>
            <div className="cal-legend-row"><span className="cal-legend-swatch"/> Booked — confirmed</div>
            <div className="cal-legend-row"><span className="cal-legend-swatch cool"/> Saved — to plan</div>
            <div className="cal-legend-row"><span className="cal-legend-swatch ink"/> Attended — past</div>
          </div>
        </div>
      </aside>
    </div>
  );
};

window.CalendarPage = CalendarPage;
