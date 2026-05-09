const PROMPTS = [
  { text: "Romantic activity tonight in Old Montreal", icon: "heart", kind: "warm" },
  { text: "Cheap sport activity near downtown", icon: "ball", kind: "cool" },
  { text: "Hidden gem this weekend", icon: "gem", kind: "cream" },
  { text: "Group plan for 6 people", icon: "users", kind: "cool" },
  { text: "Best rooftop with a sunset view", icon: "sparkle", kind: "warm" },
  { text: "Quiet café for a long read", icon: "fork", kind: "cream" },
];

const CHAT_REPLY_CARDS = [
  { title: "Le Mas des Oliviers", meta: "Old Montreal • $$$", price: "$$$", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80" },
  { title: "Bota Bota Floating Spa", meta: "Old Port • Spa", price: "$45+", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80" },
  { title: "Terrasse Nelligan", meta: "Old MTL • Rooftop", price: "$$", img: "https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=400&q=80" },
  { title: "Jazz at Le Balcon", meta: "Le Plateau • Live", price: "$30", img: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=400&q=80" },
];

const ChatPage = () => {
  const [thread, setThread] = React.useState([]);
  const [draft, setDraft] = React.useState("");

  const send = (text) => {
    const t = (text ?? draft).trim();
    if (!t) return;
    setDraft("");
    setThread((prev) => [
      ...prev,
      { who: "user", text: t },
      {
        who: "ai",
        text: "Here's a curated short-list — warm, intimate spots that match your vibe tonight.",
        cards: CHAT_REPLY_CARDS,
      },
    ]);
  };

  return (
    <div className="chat-wrap">
      {thread.length === 0 ? (
        <>
          <div className="chat-eyebrow">Wandr Assistant</div>
          <h1 className="chat-title">What do you feel like<br/>doing today?</h1>
          <p className="chat-sub">Ask anything — a vibe, a budget, a neighborhood. We'll find the rest.</p>
        </>
      ) : null}

      <div className="chat-input">
        <textarea
          placeholder="Tell me your mood, and I'll find the night…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <div className="chat-input-foot">
          <div className="chat-input-tools">
            <button className="chat-tool"><Icon name="pin" size={13}/> Near me</button>
            <button className="chat-tool"><Icon name="calendar" size={13}/> Tonight</button>
            <button className="chat-tool"><Icon name="users" size={13}/> Solo</button>
          </div>
          <button className="chat-send" onClick={() => send()} aria-label="Send">
            <Icon name="arrow-right" size={16}/>
          </button>
        </div>
      </div>

      {thread.length === 0 && (
        <>
          <div className="chat-prompt-eyebrow">Try one of these</div>
          <div className="chat-prompts">
            {PROMPTS.map((p) => (
              <button key={p.text} className="chat-prompt" onClick={() => send(p.text)}>
                <span className={"ico " + p.kind}><Icon name={p.icon} size={16}/></span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {thread.length > 0 && (
        <div className="chat-thread">
          {thread.map((m, i) => m.who === "user" ? (
            <div key={i} className="chat-msg-user">{m.text}</div>
          ) : (
            <div key={i} className="chat-msg-ai">
              <div className="chat-ai-avatar">W</div>
              <div className="chat-ai-bubble">
                <p>{m.text}</p>
                <div className="chat-cards">
                  {m.cards.map((c) => (
                    <button key={c.title} className="chat-card">
                      <div className="chat-card-img" style={{ backgroundImage: `url(${c.img})` }}/>
                      <div className="chat-card-body">
                        <div className="chat-card-title">{c.title}</div>
                        <div className="chat-card-meta">{c.meta}</div>
                        <div className="chat-card-foot">
                          <FlameRow value={3} size={9}/>
                          <span className="chat-card-price">{c.price}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.ChatPage = ChatPage;
