// Continuous-line edge decoration. Two long thin SVGs pinned to page edges.
// Charcoal stroke on cream — designed to feel hand-drawn / editorial.

const EdgeArtLeft = () => (
  <svg viewBox="0 0 110 980" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
    <g fill="none" stroke="#2A241D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
      {/* CN-tower-ish skyline silhouette */}
      <path d="M2 40 C 18 60, 24 40, 30 60 L 30 90 L 36 90 L 36 70 L 42 70 L 42 35 L 50 35 L 50 30 L 54 30 L 54 18 L 56 12 L 58 18 L 58 30 L 62 30 L 62 40 L 70 40 L 70 60 L 78 60 L 78 75 L 86 75 L 86 50 L 96 50 L 96 90 L 108 90"/>
      {/* flowing connector down to bicycle */}
      <path d="M108 90 C 108 130, 70 140, 50 170 C 28 200, 30 230, 50 260"/>
      {/* bicycle */}
      <g transform="translate(20 280)">
        <circle cx="14" cy="36" r="14"/>
        <circle cx="58" cy="36" r="14"/>
        <path d="M14 36 L 38 36 L 50 12 L 32 12 L 26 22"/>
        <path d="M50 12 L 58 36"/>
        <path d="M38 36 L 44 16"/>
        <path d="M44 16 L 52 16"/>
        <circle cx="38" cy="36" r="2" fill="#2A241D"/>
      </g>
      {/* connector to coffee cup */}
      <path d="M50 330 C 30 360, 20 400, 30 440 C 40 470, 70 480, 60 510"/>
      {/* coffee cup */}
      <g transform="translate(20 520)">
        <path d="M4 14 C 4 10, 8 8, 12 8 L 50 8 C 54 8, 58 10, 58 14 L 56 56 C 56 62, 50 66, 44 66 L 18 66 C 12 66, 6 62, 6 56 Z"/>
        <path d="M58 18 C 70 18, 76 26, 76 36 C 76 46, 70 52, 58 52"/>
        {/* steam swirl */}
        <path d="M22 2 C 26 -2, 22 -6, 26 -10"/>
        <path d="M34 2 C 38 -2, 34 -6, 38 -10"/>
      </g>
      {/* descending curve trailing off */}
      <path d="M50 600 C 30 640, 60 680, 30 720 C 10 750, 40 790, 30 830 C 20 870, 50 900, 30 950"/>
    </g>
  </svg>
);

const EdgeArtRight = () => (
  <svg viewBox="0 0 110 980" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
    <g fill="none" stroke="#2A241D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
      {/* opening curl */}
      <path d="M86 20 C 60 30, 70 70, 50 90 C 30 110, 60 140, 50 170"/>
      {/* F1 car silhouette */}
      <g transform="translate(8 175)">
        {/* nose & body */}
        <path d="M2 50 L 22 46 L 38 38 L 56 36 L 70 30 L 84 32 L 96 38 L 96 54 L 84 54 L 78 58 L 70 56 L 60 56 L 56 60 L 38 60 L 32 56 L 22 56 L 16 58 L 6 56 Z"/>
        {/* cockpit halo */}
        <path d="M50 36 C 52 26, 60 24, 64 30"/>
        {/* rear wing */}
        <path d="M84 24 L 96 22 L 96 36"/>
        {/* front wing */}
        <path d="M2 50 L 0 56 L 12 58"/>
        {/* wheels */}
        <circle cx="22" cy="58" r="9"/>
        <circle cx="78" cy="58" r="9"/>
      </g>
      {/* connector to cocktail */}
      <path d="M50 260 C 70 290, 30 320, 50 350"/>
      {/* cocktail (martini) */}
      <g transform="translate(28 360)">
        <path d="M2 4 L 54 4 L 28 38 Z"/>
        <path d="M28 38 L 28 70"/>
        <path d="M14 70 L 42 70"/>
        {/* olive on a stick */}
        <path d="M28 18 L 38 8"/>
        <circle cx="40" cy="6" r="3"/>
      </g>
      {/* connector to tennis racket */}
      <path d="M56 440 C 80 470, 40 510, 60 540"/>
      {/* tennis racket */}
      <g transform="translate(18 560)">
        <ellipse cx="32" cy="32" rx="26" ry="30"/>
        <path d="M14 14 L 50 50 M50 14 L 14 50 M32 4 L 32 60 M6 32 L 58 32"/>
        <path d="M44 56 L 70 84"/>
        <path d="M70 84 L 76 90 L 72 96 L 64 92 Z"/>
      </g>
      {/* tiny tennis ball */}
      <circle cx="80" cy="690" r="5"/>
      {/* connector to dancing couple */}
      <path d="M80 698 C 60 730, 80 760, 60 790"/>
      {/* dancing couple — abstract continuous figures */}
      <g transform="translate(8 800)">
        {/* lead figure */}
        <circle cx="26" cy="10" r="6"/>
        <path d="M26 16 L 22 50 L 14 90"/>
        <path d="M26 16 L 32 50 L 28 92"/>
        <path d="M22 28 L 8 30"/>
        <path d="M32 28 L 50 22"/>
        {/* partner figure */}
        <circle cx="62" cy="14" r="6"/>
        <path d="M62 20 L 58 56 L 62 96"/>
        <path d="M62 20 L 68 56 L 76 90"/>
        <path d="M58 32 L 50 22"/>
        <path d="M68 32 L 80 36"/>
      </g>
      {/* trailing curl */}
      <path d="M40 920 C 60 940, 30 960, 50 980"/>
    </g>
  </svg>
);

window.EdgeArtLeft = EdgeArtLeft;
window.EdgeArtRight = EdgeArtRight;

// Mini skyline for the footer banner
const FooterSkyline = () => (
  <svg viewBox="0 0 720 80" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <g fill="none" stroke="#2A241D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
      <path d="M0 70 L 40 70 L 40 50 L 60 50 L 60 70 L 90 70 L 90 30 L 110 30 L 110 70 L 140 70 L 140 40 L 160 40 L 160 70 L 190 70 L 190 22 L 200 16 L 210 22 L 210 70 L 240 70 L 240 36 L 270 36 L 270 70 L 300 70 L 300 14 L 310 8 L 320 14 L 320 70 L 360 70 L 360 32 L 380 28 L 380 70 L 420 70 L 420 18 L 432 12 L 444 18 L 444 70 L 480 70 L 480 44 L 510 44 L 510 70 L 540 70 L 540 26 L 562 24 L 562 70 L 600 70 L 600 38 L 620 38 L 620 70 L 650 70 L 650 50 L 680 50 L 680 70 L 720 70" />
      {/* Olympic stadium dome */}
      <path d="M380 70 C 400 40, 440 40, 460 70" />
      <path d="M420 40 L 420 18" />
    </g>
  </svg>
);

window.FooterSkyline = FooterSkyline;
