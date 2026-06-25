import React from "react";

const SIZES = {
  xs: "w-7 h-7 min-w-[1.75rem] text-[8px] rounded-md",
  sm: "w-9 h-9 min-w-[2.25rem] text-[9px] rounded-lg",
  md: "w-10 h-10 min-w-[2.5rem] text-[10px] rounded-lg",
  lg: "w-12 h-12 min-w-[3rem] text-xs rounded-xl",
};

// Show the short code only at sm and above; xs shows emblem only (stays legible).
const SHOW_SHORT = { xs: false, sm: true, md: true, lg: true };

/** Tiny deterministic string hash (FNV-1a style, 32-bit). */
function hashStr(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Relative luminance of a #rrggbb (or #rgb) color, 0..1. */
function luminance(hex) {
  let c = (hex || "").replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  if (c.length !== 6) return 0.3;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const LIGHT = "#f8fafc";
const DARK = "#0f172a";

/** Pick a readable ink (light/dark) for text/shapes sitting on `bg`. */
function inkFor(bg) {
  return luminance(bg) > 0.45 ? DARK : LIGHT;
}

/**
 * Emblem motifs. Each returns inline SVG drawn in a 40x40 viewBox.
 * `em` is the emblem color (already chosen to contrast the primary background),
 * `div` is a secondary/divider color.
 */
const MOTIFS = [
  // 0 sash — diagonal band
  (em) => (
    <polygon points="0,28 12,40 40,12 40,0 28,0 0,28" fill={em} opacity="0.92" />
  ),
  // 1 vertical stripe (pale band)
  (em, div) => (
    <>
      <rect x="15" y="0" width="10" height="40" fill={em} opacity="0.9" />
      <rect x="13.5" y="0" width="1.5" height="40" fill={div} opacity="0.6" />
      <rect x="25" y="0" width="1.5" height="40" fill={div} opacity="0.6" />
    </>
  ),
  // 2 chevron
  (em) => (
    <polygon points="20,8 36,26 36,34 20,16 4,34 4,26" fill={em} opacity="0.92" />
  ),
  // 3 star (5-point)
  (em) => (
    <polygon
      points="20,6 23.5,16 34,16 25.5,22.5 28.8,33 20,26.5 11.2,33 14.5,22.5 6,16 16.5,16"
      fill={em}
    />
  ),
  // 4 diagonal-half
  (em) => <polygon points="0,0 40,0 0,40" fill={em} opacity="0.85" />,
  // 5 hoops (two horizontal bands)
  (em) => (
    <>
      <rect x="0" y="10" width="40" height="6" fill={em} opacity="0.9" />
      <rect x="0" y="24" width="40" height="6" fill={em} opacity="0.9" />
    </>
  ),
  // 6 diamond
  (em, div) => (
    <>
      <polygon points="20,7 31,20 20,33 9,20" fill={em} opacity="0.92" />
      <polygon points="20,12 26,20 20,28 14,20" fill={div} opacity="0.55" />
    </>
  ),
  // 7 V
  (em) => (
    <polygon points="6,6 14,6 20,24 26,6 34,6 22,38 18,38" fill={em} opacity="0.92" />
  ),
];

/**
 * Named mascot / themed motifs for keyword-matched club names.
 * Each function takes (em, div) — the auto-contrast emblem + divider colors.
 * Also used to expand the hash-based procedural pool for generic clubs.
 */
const NAMED_MOTIFS = {
  // Eagle / Falcon / Hawk — wings spread with head spike
  wings: (em, div) => (
    <>
      <path d="M2,28 Q10,10 20,18 Q30,10 38,28 L32,26 Q24,14 20,18 Q16,14 8,26 Z" fill={em} opacity="0.9" />
      <polygon points="16,18 20,6 24,18" fill={em} opacity="0.8" />
    </>
  ),
  // Crow / Raven — bird in flight silhouette
  crow: (em) => (
    <path d="M3,30 L13,4 L20,18 L27,4 L37,30 L28,28 L20,36 L12,28 Z" fill={em} opacity="0.9" />
  ),
  // Magpie — clean vertical half split
  halfSplit: (em, div) => (
    <>
      <rect x="0" y="0" width="20" height="40" fill={div} opacity="0.2" />
      <rect x="20" y="0" width="20" height="40" fill={em} opacity="0.9" />
      <line x1="20" y1="0" x2="20" y2="40" stroke={div} strokeWidth="0.75" opacity="0.4" />
    </>
  ),
  // Swan / Seagull — graceful neck and body curve
  swan: (em) => (
    <path d="M10,34 Q10,22 18,16 Q24,10 32,12 Q30,18 24,20 Q28,24 28,32 L24,34 Q22,28 20,26 Q14,28 10,34 Z" fill={em} opacity="0.9" />
  ),
  // Lion — mane ring with inner circle and ear triangles
  lion: (em, div) => (
    <>
      <circle cx="20" cy="22" r="14" fill={em} opacity="0.85" />
      <circle cx="20" cy="22" r="10" fill={div} opacity="0.7" />
      <polygon points="10,13 15,4 18,13" fill={em} />
      <polygon points="22,13 25,4 30,13" fill={em} />
      <ellipse cx="20" cy="26" rx="3.5" ry="2" fill={em} opacity="0.85" />
    </>
  ),
  // Cat — triangular cat-head silhouette with ear points and eye dots
  cat: (em, div) => (
    <>
      <polygon points="8,34 14,8 20,20 26,8 32,34" fill={em} opacity="0.88" />
      <circle cx="15" cy="26" r="2.5" fill={div} />
      <circle cx="25" cy="26" r="2.5" fill={div} />
    </>
  ),
  // Tiger — three diagonal stripe bands
  tigerStripes: (em) => (
    <>
      <polygon points="2,6 12,0 24,0 14,6" fill={em} opacity="0.9" />
      <polygon points="7,24 22,0 34,0 19,24" fill={em} opacity="0.75" />
      <polygon points="12,40 34,10 40,10 18,40" fill={em} opacity="0.65" />
    </>
  ),
  // Panther / Wolf / Leopard — four-circle paw print
  paw: (em, div) => (
    <>
      <circle cx="20" cy="25" r="8" fill={em} opacity="0.88" />
      <circle cx="11" cy="16" r="4.5" fill={em} opacity="0.88" />
      <circle cx="20" cy="12" r="4.5" fill={em} opacity="0.88" />
      <circle cx="29" cy="16" r="4.5" fill={em} opacity="0.88" />
    </>
  ),
  // Bulldog — round head, nose ellipse, eye dots
  bulldog: (em, div) => (
    <>
      <path d="M10,14 Q10,6 20,6 Q30,6 30,14 L34,24 Q30,34 20,36 Q10,34 6,24 Z" fill={em} opacity="0.88" />
      <ellipse cx="20" cy="24" rx="4" ry="3" fill={div} />
      <circle cx="14" cy="16" r="2.5" fill={div} />
      <circle cx="26" cy="16" r="2.5" fill={div} />
    </>
  ),
  // Bull — upward-curving horns with head mound
  bull: (em, div) => (
    <>
      <path d="M4,20 Q4,8 14,8 Q16,12 20,14 Q24,12 26,8 Q36,8 36,20 Q30,16 20,18 Q10,16 4,20 Z" fill={em} opacity="0.9" />
      <ellipse cx="20" cy="24" rx="7" ry="5" fill={em} opacity="0.75" />
    </>
  ),
  // Bear — large paw with three claw dots
  bear: (em, div) => (
    <>
      <circle cx="20" cy="24" r="9" fill={em} opacity="0.88" />
      <circle cx="11" cy="15" r="5" fill={em} opacity="0.88" />
      <circle cx="20" cy="12" r="5" fill={em} opacity="0.88" />
      <circle cx="29" cy="15" r="5" fill={em} opacity="0.88" />
      <circle cx="14" cy="28" r="1.8" fill={div} opacity="0.7" />
      <circle cx="20" cy="30" r="1.8" fill={div} opacity="0.7" />
      <circle cx="26" cy="28" r="1.8" fill={div} opacity="0.7" />
    </>
  ),
  // Shark — dorsal fin rising from water line
  shark: (em) => (
    <path d="M8,36 Q12,16 20,8 Q24,20 38,36 L30,36 Q26,24 20,20 Q16,24 14,36 Z" fill={em} opacity="0.88" />
  ),
  // Dolphin / Coastal — S-curve wave with fill
  wave: (em, div) => (
    <>
      <path d="M2,30 Q8,18 14,22 Q18,26 22,20 Q28,14 34,18 Q38,22 38,30 L38,38 L2,38 Z" fill={em} opacity="0.65" />
      <path d="M2,26 Q8,14 14,18 Q18,22 22,16 Q28,10 34,14 Q38,18 38,26" fill="none" stroke={em} strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
    </>
  ),
  // Kangaroo — body ellipse + head + ear + tail + legs
  roo: (em) => (
    <>
      <ellipse cx="20" cy="22" rx="9" ry="6" fill={em} opacity="0.88" />
      <ellipse cx="29" cy="14" rx="5" ry="7" fill={em} opacity="0.88" />
      <line x1="29" y1="7" x2="27" y2="3" stroke={em} strokeWidth="2" strokeLinecap="round" />
      <path d="M11,26 Q6,32 8,38" fill="none" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="28" x2="13" y2="38" stroke={em} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="28" x2="26" y2="38" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // Dragon / Flame — fire tongue silhouette
  flame: (em) => (
    <path d="M14,38 Q8,28 12,20 Q10,24 16,18 Q14,22 18,14 Q16,18 22,10 Q20,16 24,12 Q22,18 26,14 Q26,20 30,16 Q32,22 28,28 Q32,34 26,38 Z" fill={em} opacity="0.88" />
  ),
  // Snake / Cobra — S-curve body
  snake: (em) => (
    <path d="M10,36 Q8,28 12,22 Q16,16 20,18 Q24,20 26,16 Q28,10 24,8 Q30,6 32,12 Q34,20 28,26 Q22,30 20,26 Q18,22 14,24 Q12,28 14,36 Z" fill={em} opacity="0.88" />
  ),
  // Demon / Devil — trident (3 tines + crossbar + handle)
  trident: (em) => (
    <>
      <line x1="20" y1="38" x2="20" y2="6" stroke={em} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="10" y1="6" x2="10" y2="20" stroke={em} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="6" x2="30" y2="20" stroke={em} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="10" y1="20" x2="30" y2="20" stroke={em} strokeWidth="2.5" />
    </>
  ),
  // Thunder / Power / Chargers — lightning bolt
  lightning: (em) => (
    <polygon points="24,4 13,22 22,22 16,38 27,20 18,20 24,4" fill={em} opacity="0.9" />
  ),
  // Sun — center circle with 8 radiating rays
  sun: (em) => (
    <>
      <circle cx="20" cy="20" r="6" fill={em} />
      <line x1="29" y1="20" x2="36" y2="20" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26.4" y1="26.4" x2="31.3" y2="31.3" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="29" x2="20" y2="36" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13.6" y1="26.4" x2="8.7" y2="31.3" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="11" y1="20" x2="4" y2="20" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13.6" y1="13.6" x2="8.7" y2="8.7" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="11" x2="20" y2="4" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26.4" y1="13.6" x2="31.3" y2="8.7" stroke={em} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // Anchor — ring + staff + crossbar + flukes
  anchor: (em) => (
    <>
      <circle cx="20" cy="11" r="5" fill="none" stroke={em} strokeWidth="2.5" />
      <line x1="20" y1="16" x2="20" y2="36" stroke={em} strokeWidth="2.5" />
      <line x1="11" y1="22" x2="29" y2="22" stroke={em} strokeWidth="2.5" />
      <path d="M11,34 Q14,40 20,36 Q26,40 29,34" fill="none" stroke={em} strokeWidth="2.5" />
    </>
  ),
  // King / Crown / Knight — five-point crown silhouette
  crown: (em) => (
    <polygon points="6,34 6,18 12,26 20,14 28,26 34,18 34,34" fill={em} opacity="0.88" />
  ),
  // Star / Ranger / Comet — bold 5-point star
  star: (em) => (
    <polygon
      points="20,5 23.8,15.6 35,15.6 26,22.6 29.2,33.2 20,26.2 10.8,33.2 14,22.6 5,15.6 16.2,15.6"
      fill={em}
    />
  ),
  // Saint / Cross — bold plus-cross
  cross: (em) => (
    <>
      <rect x="16.5" y="6" width="7" height="28" fill={em} rx="1.5" />
      <rect x="6" y="16.5" width="28" height="7" fill={em} rx="1.5" />
    </>
  ),
  // Stag / Deer / Buck — antler rack
  antler: (em) => (
    <path
      d="M17,36 L17,22 L11,14 L8,8 L13,10 L15,16 L17,20 L20,12 L18,6 L22,6 L20,12 L23,20 L25,16 L27,10 L32,8 L29,14 L23,22 L23,36 Z"
      fill={em}
      opacity="0.88"
    />
  ),
  // Giant / Mountain — twin mountain peaks
  mountain: (em) => (
    <polygon points="4,38 16,10 23,24 30,6 38,38" fill={em} opacity="0.88" />
  ),
};

/** Keyword → motif key for lower-tier club names. */
function motifKeyForName(name) {
  const n = (name || "").toLowerCase();
  if (/\b(eagle|falcon|condor|raptor|cockatoo|harrier)s?\b/.test(n)) return "wings";
  if (/\bhawks?\b/.test(n)) return "wings";
  if (/\bmagpies?\b/.test(n)) return "halfSplit";
  if (/\b(crow|raven)s?\b/.test(n)) return "crow";
  if (/\b(swan|seagull|gull)s?\b/.test(n)) return "swan";
  if (/\blions?\b/.test(n)) return "lion";
  if (/\bcats?\b/.test(n)) return "cat";
  if (/\btigers?\b/.test(n)) return "tigerStripes";
  if (/\b(panther|leopard|cheetah|jaguar)s?\b/.test(n)) return "paw";
  if (/\bwolves?|\bwolf\b/.test(n)) return "paw";
  if (/\bbulldogs?\b/.test(n)) return "bulldog";
  if (/\bbullants?\b/.test(n)) return "paw";
  if (/\bbulls?\b/.test(n)) return "bull";
  if (/\bbears?\b/.test(n)) return "bear";
  if (/\bsharks?\b/.test(n)) return "shark";
  if (/\b(dolphin|orca|whale)s?\b/.test(n)) return "wave";
  if (/\b(kangaroo|roo)s?\b/.test(n)) return "roo";
  if (/\bdragons?\b/.test(n)) return "flame";
  if (/\b(snake|cobra|viper|python|asp)s?\b/.test(n)) return "snake";
  if (/\bsaints?\b/.test(n)) return "cross";
  if (/\b(demon|devil)s?\b/.test(n)) return "trident";
  if (/\b(charger|thunder|bolt)s?\b/.test(n)) return "lightning";
  if (/\b(fire|flame|blaze|ember|phoenix|inferno)s?\b/.test(n)) return "flame";
  if (/\bsuns?\b/.test(n)) return "sun";
  if (/\b(pirate|anchor|docker)s?\b/.test(n)) return "anchor";
  if (/\b(king|royal|crown|knight)s?\b/.test(n)) return "crown";
  if (/\bstars?\b/.test(n)) return "star";
  if (/\b(wave|tide)s?\b/.test(n)) return "wave";
  if (/\b(coast|beach|bay|sea|ocean|marine)\b/.test(n)) return "wave";
  if (/\b(stag|deer|buck|elk)s?\b/.test(n)) return "antler";
  if (/\brooster?\b/.test(n)) return "wings";
  if (/\bgiants?\b/.test(n)) return "mountain";
  if (/\b(mountain|peak|highland|alpine)\b/.test(n)) return "mountain";
  if (/\b(ranger|rover|rebel|warrior|spartan|raider|viking)s?\b/.test(n)) return "star";
  if (/\b(jet|rocket|comet)s?\b/.test(n)) return "lightning";
  if (/\bpower\b/.test(n)) return "lightning";
  if (/\bport\b/.test(n)) return "anchor";
  return null;
}

// Combine geometric + named motifs for richer hash-based fallback (33 total)
const ALL_MOTIFS = [...MOTIFS, ...Object.values(NAMED_MOTIFS)];

/**
 * Hand-crafted AFL club motifs. Each function receives (c1, c2, c3) — the club's
 * actual colors — and returns SVG JSX drawn in the 40×40 viewBox.
 * Inspired by real team visual identities; all original geometry.
 */
const AFL_CLUB_MOTIFS = {
  // Adelaide Crows — navy/red/gold — crow in flight silhouette
  ade: (c1, c2, c3) => (
    <path d="M3,30 L13,4 L20,18 L27,4 L37,30 L28,28 L20,36 L12,28 Z" fill={c3} opacity="0.9" />
  ),
  // Brisbane Lions — maroon/blue/gold — lion mane ring
  bri: (c1, c2, c3) => (
    <>
      <circle cx="20" cy="22" r="14" fill={c3} opacity="0.85" />
      <circle cx="20" cy="22" r="10" fill={c2} />
      <polygon points="10,13 15,4 18,13" fill={c3} />
      <polygon points="22,13 25,4 30,13" fill={c3} />
      <ellipse cx="20" cy="26" rx="3.5" ry="2" fill={c3} opacity="0.85" />
    </>
  ),
  // Carlton Blues — navy/white — bold open-C letterform
  car: (c1, c2, c3) => (
    <path d="M28,9 Q12,9 11,20 Q12,31 28,31 L28,26 Q16,26 16,20 Q16,14 28,14 Z" fill={c2} />
  ),
  // Collingwood Magpies — black/white — clean vertical half split
  col: (c1, c2, c3) => (
    <>
      <rect x="0" y="0" width="20" height="40" fill={c1} />
      <rect x="20" y="0" width="20" height="40" fill={c2} />
      <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(128,128,128,0.3)" strokeWidth="0.75" />
    </>
  ),
  // Essendon Bombers — red/black — black shield with red sash (upper-left to lower-right)
  ess: (c1, c2, c3) => (
    <>
      <rect x="0" y="0" width="40" height="40" fill={c2} />
      <polygon points="0,2 14,0 40,26 40,38 26,40 0,14" fill={c1} opacity="0.92" />
    </>
  ),
  // Fremantle Dockers — purple/white — white anchor symbol
  fre: (c1, c2, c3) => (
    <>
      <circle cx="20" cy="11" r="5" fill="none" stroke={c2} strokeWidth="2.5" />
      <line x1="20" y1="16" x2="20" y2="36" stroke={c2} strokeWidth="2.5" />
      <line x1="11" y1="22" x2="29" y2="22" stroke={c2} strokeWidth="2.5" />
      <path d="M11,34 Q14,40 20,36 Q26,40 29,34" fill="none" stroke={c2} strokeWidth="2.5" />
    </>
  ),
  // Geelong Cats — navy/white — white cat face (triangular head + eye dots)
  gee: (c1, c2, c3) => (
    <>
      <polygon points="8,34 14,8 20,20 26,8 32,34" fill={c2} opacity="0.88" />
      <circle cx="15" cy="26" r="2.5" fill={c1} />
      <circle cx="25" cy="26" r="2.5" fill={c1} />
    </>
  ),
  // Gold Coast Suns — red/gold — gold sun burst (circle + 8 rays)
  gcs: (c1, c2, c3) => (
    <>
      <circle cx="20" cy="20" r="6" fill={c2} />
      <line x1="29" y1="20" x2="36" y2="20" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26.4" y1="26.4" x2="31.3" y2="31.3" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="29" x2="20" y2="36" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13.6" y1="26.4" x2="8.7" y2="31.3" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="11" y1="20" x2="4" y2="20" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13.6" y1="13.6" x2="8.7" y2="8.7" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="11" x2="20" y2="4" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="26.4" y1="13.6" x2="31.3" y2="8.7" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // GWS Giants — orange/charcoal — twin mountain peaks
  gws: (c1, c2, c3) => (
    <polygon points="4,38 16,10 23,24 30,6 38,38" fill={c2} opacity="0.88" />
  ),
  // Hawthorn Hawks — dark brown/gold — hawk wings spread + head spike
  haw: (c1, c2, c3) => (
    <>
      <path d="M2,28 Q10,10 20,18 Q30,10 38,28 L32,26 Q24,14 20,18 Q16,14 8,26 Z" fill={c2} opacity="0.9" />
      <polygon points="16,18 20,6 24,18" fill={c2} opacity="0.8" />
    </>
  ),
  // Melbourne Demons — navy/red — red trident (three tines + crossbar + handle)
  mel: (c1, c2, c3) => (
    <>
      <line x1="20" y1="38" x2="20" y2="6" stroke={c2} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="10" y1="6" x2="10" y2="20" stroke={c2} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="6" x2="30" y2="20" stroke={c2} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="10" y1="20" x2="30" y2="20" stroke={c2} strokeWidth="2.5" />
    </>
  ),
  // North Melbourne Kangaroos — navy/white — kangaroo silhouette
  nor: (c1, c2, c3) => (
    <>
      <ellipse cx="20" cy="22" rx="9" ry="6" fill={c2} opacity="0.88" />
      <ellipse cx="29" cy="14" rx="5" ry="7" fill={c2} opacity="0.88" />
      <line x1="29" y1="7" x2="27" y2="3" stroke={c2} strokeWidth="2" strokeLinecap="round" />
      <path d="M11,26 Q6,32 8,38" fill="none" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17" y1="28" x2="13" y2="38" stroke={c2} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="28" x2="26" y2="38" stroke={c2} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // Port Adelaide Power — teal/black — black shield with teal lightning bolt
  pad: (c1, c2, c3) => (
    <>
      <rect x="0" y="0" width="40" height="40" fill={c2} />
      <polygon points="24,4 13,22 22,22 16,38 27,20 18,20 24,4" fill={c1} opacity="0.9" />
    </>
  ),
  // Richmond Tigers — gold/black — black shield with three diagonal gold stripes
  ric: (c1, c2, c3) => (
    <>
      <rect x="0" y="0" width="40" height="40" fill={c2} />
      <polygon points="2,6 12,0 24,0 14,6" fill={c1} opacity="0.9" />
      <polygon points="7,24 22,0 34,0 19,24" fill={c1} opacity="0.75" />
      <polygon points="12,40 34,10 40,10 18,40" fill={c1} opacity="0.65" />
    </>
  ),
  // St Kilda Saints — red/black/white — white halo-and-cross saint symbol
  stk: (c1, c2, c3) => (
    <>
      <circle cx="20" cy="12" r="7" fill="none" stroke={c3} strokeWidth="2.5" />
      <line x1="20" y1="19" x2="20" y2="36" stroke={c3} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="27" x2="28" y2="27" stroke={c3} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  // Sydney Swans — red/white — white swan silhouette
  syd: (c1, c2, c3) => (
    <path
      d="M10,34 Q10,22 18,16 Q24,10 32,12 Q30,18 24,20 Q28,24 28,32 L24,34 Q22,28 20,26 Q14,28 10,34 Z"
      fill={c2}
      opacity="0.9"
    />
  ),
  // Tasmania FC — red/black — thylacine: dark oval body with red stripe markings
  tas: (c1, c2, c3) => (
    <>
      <path d="M10,18 Q20,10 30,18 Q32,26 28,34 Q20,38 12,34 Q8,26 10,18 Z" fill={c2} opacity="0.85" />
      <line x1="14" y1="22" x2="26" y2="22" stroke={c1} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="15" y1="27" x2="25" y2="27" stroke={c1} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="32" x2="24" y2="32" stroke={c1} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  // West Coast Eagles — navy/gold — gold eagle wings spread with head spike
  wce: (c1, c2, c3) => (
    <>
      <path d="M2,30 Q10,10 20,18 Q30,10 38,30 L32,26 Q24,14 20,18 Q16,14 8,26 Z" fill={c2} opacity="0.9" />
      <line x1="6" y1="28" x2="10" y2="16" stroke={c1} strokeWidth="1.2" opacity="0.5" />
      <line x1="34" y1="28" x2="30" y2="16" stroke={c1} strokeWidth="1.2" opacity="0.5" />
      <polygon points="16,18 20,8 24,18" fill={c2} opacity="0.8" />
    </>
  ),
  // Western Bulldogs — blue/red/white — white bulldog face with blue nose + eyes
  wbd: (c1, c2, c3) => (
    <>
      <path d="M10,14 Q10,6 20,6 Q30,6 30,14 L34,24 Q30,34 20,36 Q10,34 6,24 Z" fill={c3} opacity="0.88" />
      <ellipse cx="20" cy="24" rx="4" ry="3" fill={c1} />
      <circle cx="14" cy="16" r="2.5" fill={c1} />
      <circle cx="26" cy="16" r="2.5" fill={c1} />
      <path d="M7,24 Q10,30 9,36" fill="none" stroke={c1} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33,24 Q30,30 31,36" fill="none" stroke={c1} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

/**
 * Fictional, deterministic club crest built from pyramid colors + a hashed motif.
 * Original (non-trademarked) shapes only.
 */
export function ClubBadge({ club, size = "md", className = "" }) {
  const cls = `${SIZES[size] || SIZES.md} inline-flex items-center justify-center font-black tracking-tight text-white shadow-sm border border-white/25 shrink-0 overflow-hidden ${className}`;

  if (!club?.short) {
    return (
      <div
        className={cls}
        style={{ background: "linear-gradient(135deg,#475569 0%,#334155 100%)" }}
        aria-hidden
      >
        —
      </div>
    );
  }

  const [c1, c2] = club.colors?.length >= 2 ? club.colors : ["#334155", "#0f172a"];
  const c3 = club.colors?.[2] || c2;

  const seed = String(club.id ?? club.short ?? "");
  const hash = hashStr(seed);
  const motifIndex = hash % ALL_MOTIFS.length;
  // Stable, DOM-safe unique id for defs (avoids invalid chars / cross-badge clashes).
  const uid = `cb-${hash.toString(36)}`;

  // Choose an emblem color that contrasts the primary background.
  const baseLum = luminance(c1);
  const candidates = [c2, c3].filter(Boolean);
  // Prefer a club secondary that differs enough in luminance; else fall back to ink.
  let emblem =
    candidates.find((c) => Math.abs(luminance(c) - baseLum) > 0.18) || inkFor(c1);
  // Divider/inner color: the other club color, or ink, distinct from emblem.
  const divider = inkFor(c1) === emblem ? c2 : inkFor(c1);

  const ink = inkFor(c1);
  const showShort = SHOW_SHORT[size] ?? true;
  const short = String(club.short).slice(0, 3).toUpperCase();

  const clubId = String(club.id || "").toLowerCase();
  const customMotifFn = AFL_CLUB_MOTIFS[clubId];
  const namedKey = customMotifFn ? null : motifKeyForName(club.name);
  const motifEl = customMotifFn
    ? customMotifFn(c1, c2, c3)
    : namedKey && NAMED_MOTIFS[namedKey]
      ? NAMED_MOTIFS[namedKey](emblem, divider)
      : ALL_MOTIFS[motifIndex](emblem, divider);

  return (
    <div className={cls} title={club.name || club.short}>
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        role="img"
        aria-label={`${club.name || club.short} crest`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Shield clip so the crest reads as a crest at the rounded container edges */}
        <defs>
          <clipPath id={`crest-${uid}`}>
            <path d="M3,2 H37 V20 Q37,33 20,39 Q3,33 3,20 Z" />
          </clipPath>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>

        <g clipPath={`url(#crest-${uid})`}>
          {/* Primary background */}
          <rect x="0" y="0" width="40" height="40" fill={`url(#bg-${uid})`} />
          {/* Emblem motif — custom for AFL clubs, procedural for all others */}
          {motifEl}
          {/* Short code overlay (sm+) */}
          {showShort && (
            <text
              x="20"
              y={size === "lg" ? 27 : 26}
              textAnchor="middle"
              fontSize={size === "lg" ? 15 : 16}
              fontWeight="900"
              fill={ink}
              stroke={ink === LIGHT ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)"}
              strokeWidth="0.6"
              paintOrder="stroke"
              style={{ fontFamily: "inherit", letterSpacing: "-0.5px" }}
            >
              {short}
            </text>
          )}
        </g>
        {/* Crest outline for definition on dark UI */}
        <path
          d="M3,2 H37 V20 Q37,33 20,39 Q3,33 3,20 Z"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
