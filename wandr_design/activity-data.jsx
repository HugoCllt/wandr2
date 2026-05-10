// Builders that turn the lighter card data into a richer Activity for the modal.
// Falls back to sensible defaults so any card can be opened.

const ACTIVITY_DETAILS = {
  "Canadiens vs Rangers": {
    badges: [{ label: "Trending", kind: "warm" }, { label: "Tonight" }],
    flames: 4,
    when: "Tonight • 7:00 PM",
    duration: "~2.5 hours",
    group: "Solo or up to 8",
    level: "All ages",
    address: "1909 Avenue des Canadiens-de-Montréal, Montréal, QC",
    pin: { x: 60, y: 50, color: "orange" },
    price: "$89+",
    priceUnit: "/ ticket",
    desc: "Bell Centre packs out for an Original Six rivalry — two hours of red-and-blue chaos, pre-game tailgate vibes on Avenue des Canadiens, and the city's loudest goal horn. Lower-bowl seats run hot; sections 300+ are the steal.",
    tags: ["Energy", "Iconic", "Group-friendly", "Indoor", "Late-night ready"],
    host: { name: "Bell Centre", role: "Official venue · 21K seats", avatar: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=200&q=80" },
    reviews: [
      { who: "Mathieu, last week", text: "Worth every dollar — the building was electric from puck drop." },
      { who: "Sara, 2 weeks ago", text: "Get there 45 min early. The walk-up bar in section 226 is the move." },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1515703407324-5f51c2ee87ff?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1580693292936-9a31a1717b8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80",
    ],
  },
  "Rooftop Fridays\nOld Montreal": {
    badges: [{ label: "Popular", kind: "warm" }],
    flames: 4,
    when: "Fri, May 24 • 9:00 PM",
    duration: "Until 2 AM",
    group: "Best for 2–6",
    level: "21+",
    address: "Terrasse Nelligan, 106 Saint-Paul St W, Montréal, QC",
    pin: { x: 70, y: 38, color: "orange" },
    price: "$25+",
    priceUnit: "cover",
    desc: "Eight floors up, a low-lit DJ set rolls from house to disco and the Old Port glitters underneath you. Reservations land you a couch by the railing; walk-ins get the bar.",
    tags: ["Date night", "Skyline", "DJ set", "Cocktails", "Dressy"],
    reviews: [
      { who: "Camille, last weekend", text: "Sunset hour is unreal. Order the negroni flight." },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519214605650-76a613ee3245?auto=format&fit=crop&w=900&q=80",
    ],
  },
  "Jazz Night at Le Balcon": {
    badges: [{ label: "Hot", kind: "warm" }],
    flames: 4,
    when: "Sat, May 25 • 8:30 PM",
    duration: "Two sets · 90 min",
    group: "2–10",
    level: "All ages",
    address: "463 Saint-Catherine St W, Montréal, QC",
    pin: { x: 42, y: 55, color: "orange" },
    price: "$30+",
    priceUnit: "+ menu",
    desc: "A 9-piece brass collective takes over Le Balcon's mezzanine. Tables sit close to the band — book early for the upper-tier banquettes.",
    tags: ["Live music", "Date night", "Cabaret", "Dinner included"],
    gallery: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80",
    ],
  },
  "Clip 'n Climb Montreal": {
    badges: [{ label: "New" }],
    flames: 3,
    when: "Open daily • 10 AM – 10 PM",
    duration: "1–2 hours",
    group: "1–8",
    level: "Beginner friendly",
    address: "1010 Saint-Maurice St, Griffintown, Montréal",
    pin: { x: 38, y: 60, color: "blue" },
    price: "$22+",
    priceUnit: "/ pass",
    desc: "30+ themed climbing challenges, auto-belays included. No experience needed — kids 4+ welcome. Birthday packages run on weekends.",
    tags: ["Active", "Indoor", "Kid-friendly", "Group plan"],
    gallery: [
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=80",
    ],
  },
};

// Build an activity object from any card-shaped data on any page.
function toActivity(card) {
  const detail = ACTIVITY_DETAILS[card.title] || {};
  const fallbackDesc = `Discover ${card.title.replace(/\n/g, " ")} — one of the picks our community is buzzing about right now in Montreal.`;
  return {
    title: card.title,
    img: card.img,
    flames: card.flames ?? 3,
    badges: card.badge ? [{ label: card.badge.label, kind: card.badge.kind === "trending" || card.badge.kind === "hot" || card.badge.kind === "popular" ? "warm" : "" }] : [],
    when: card.when,
    where: card.where,
    price: card.price,
    desc: fallbackDesc,
    address: card.where || "Montréal, QC",
    pin: { x: 50, y: 50, color: "orange" },
    tags: ["Trending in MTL"],
    ...detail,
  };
}

window.toActivity = toActivity;
window.ACTIVITY_DETAILS = ACTIVITY_DETAILS;
