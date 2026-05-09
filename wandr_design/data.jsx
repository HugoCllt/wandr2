// Image URLs use stable Unsplash photo IDs. All copy/data is fictional.
const IMG = {
  f1: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1600&q=80",
  hockey: "https://images.unsplash.com/photo-1515703407324-5f51c2ee87ff?auto=format&fit=crop&w=900&q=80",
  rooftop: "https://images.unsplash.com/photo-1519214605650-76a613ee3245?auto=format&fit=crop&w=900&q=80",
  jazz: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=900&q=80",
  hockey2: "https://images.unsplash.com/photo-1580693292936-9a31a1717b8b?auto=format&fit=crop&w=600&q=80",
  food: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
  rooftop2: "https://images.unsplash.com/photo-1542315192-1f61a1792f33?auto=format&fit=crop&w=600&q=80",
  habs: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=400&q=80",
  terrasse: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=700&q=80",
  padel: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=700&q=80",
  park: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=700&q=80",
  satay: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=700&q=80",
  climb: "https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80",
  hockeyRec: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=900&q=80",
  rooftopRec: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=900&q=80",
  jazzRec: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
};

const HEROES = [
  {
    eyebrow: "FEATURED THIS WEEK",
    title: "Formula 1\nCanadian Grand Prix",
    sub: "The city. The speed. The energy.",
    img: IMG.f1,
  },
  {
    eyebrow: "TRENDING IN MONTREAL",
    title: "Mural Festival\non Saint-Laurent",
    sub: "Six blocks of color, sound, and street food.",
    img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80",
  },
  {
    eyebrow: "UPCOMING MUST-DO",
    title: "Sunset Sail\non the St. Lawrence",
    sub: "Two hours of skyline, breeze, and rosé.",
    img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
  },
  {
    eyebrow: "HIDDEN GEM",
    title: "Bota Bota\nFloating Spa",
    sub: "Steam, river views, and an evening of stillness.",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80",
  },
];

const HERO_SIDE = [
  { title: "Canadiens\nPlayoff Rush", img: IMG.hockey, flames: 4 },
  { title: "Rooftop Fridays\nOld Montreal", img: IMG.rooftop, flames: 4 },
  { title: "Jazz Night\nLe Balcon", img: IMG.jazz, flames: 4 },
];

const SIDEBAR_SECTIONS = [
  { name: "For You", icon: "compass", active: true },
  { name: "Trending Now", icon: "fire" },
  { name: "This Weekend", icon: "calendar" },
  { name: "New & Notable", icon: "sparkle" },
  { name: "Hidden Gems", icon: "gem" },
];

const CATEGORIES = [
  { name: "All", icon: "grid", active: true },
  { name: "Sport", icon: "ball" },
  { name: "Dining", icon: "fork" },
  { name: "Music", icon: "music" },
  { name: "Culture", icon: "culture" },
  { name: "Outdoor", icon: "leaf" },
  { name: "Nightlife", icon: "moon" },
  { name: "Wellness", icon: "spa" },
];

const TRENDING = [
  { title: "F1 Canadian\nGrand Prix", img: IMG.f1, flames: 4 },
  { title: "Jazz Night at\nLe Balcon", img: IMG.food, flames: 3 },
  { title: "Rooftop Fridays\nOld MTL", img: IMG.rooftop2, flames: 3 },
  { title: "Canadiens\nPlayoff Rush", img: IMG.habs, flames: 3 },
];

const SHORTCUTS = [
  { name: "Date Night Ideas", icon: "heart" },
  { name: "Weekend with Friends", icon: "users" },
  { name: "Outdoor Adventures", icon: "mountain" },
];

// Pin positions are percentages of the map card.
const PINS = [
  { x: 38, y: 18, color: "blue", label: "Plateau" },
  { x: 64, y: 22, color: "orange", label: "F1" },
  { x: 70, y: 36, color: "blue", label: "Old Montreal" },
  { x: 28, y: 50, color: "blue", label: "Verdun" },
  { x: 38, y: 73, color: "orange", label: "Verdun food" },
  { x: 70, y: 70, color: "orange", label: "Old port" },
  { x: 50, y: 56, color: "me" },
];

const FROM_MAP = [
  { title: "Terrasse Nelligan", dist: "450 m", area: "Old MTL", price: "$$$", flames: 3, img: IMG.terrasse },
  { title: "Padel District", dist: "1.2 km", area: "Griffintown", price: "$$", flames: 4, img: IMG.padel },
  { title: "Lafontaine Park\nRun Club", dist: "1.6 km", area: "Plateau", price: "Free", flames: 3, img: IMG.park },
  { title: "Satay Brothers", dist: "850 m", area: "Village", price: "$$", flames: 4, img: IMG.satay },
];

const REC_CHIPS = [
  { name: "All", icon: null, active: true },
  { name: "Popular", icon: "fire" },
  { name: "This Weekend", icon: "calendar" },
  { name: "Near You", icon: "pin" },
];

const RECS = [
  {
    badge: { label: "Trending", kind: "trending" },
    title: "Canadiens vs Rangers",
    img: IMG.hockeyRec,
    when: "Tonight • 7:00 PM",
    where: "Bell Centre • 1.2 km",
    price: "$89+",
  },
  {
    badge: { label: "Popular", kind: "popular" },
    title: "Rooftop Fridays\nOld Montreal",
    img: IMG.rooftopRec,
    when: "Fri, May 24 • 9:00 PM",
    where: "Old Montreal • 650 m",
    price: "$25+",
  },
  {
    badge: { label: "Hot", kind: "hot" },
    title: "Jazz Night at Le Balcon",
    img: IMG.jazzRec,
    when: "Sat, May 25 • 8:30 PM",
    where: "Le Plateau • 2.1 km",
    price: "$30+",
  },
  {
    badge: { label: "New", kind: "new" },
    title: "Clip 'n Climb Montreal",
    img: IMG.climb,
    when: "Anytime",
    where: "Griffintown • 1.4 km",
    price: "$22+",
  },
];

window.IMG = IMG;
window.HEROES = HEROES;
window.HERO_SIDE = HERO_SIDE;
window.SIDEBAR_SECTIONS = SIDEBAR_SECTIONS;
window.CATEGORIES = CATEGORIES;
window.TRENDING = TRENDING;
window.SHORTCUTS = SHORTCUTS;
window.PINS = PINS;
window.FROM_MAP = FROM_MAP;
window.REC_CHIPS = REC_CHIPS;
window.RECS = RECS;
