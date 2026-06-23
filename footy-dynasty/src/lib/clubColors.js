import chroma from 'chroma-js';

// Primary hex colors for known clubs (AFL + major state leagues)
const CLUB_COLORS = {
  // AFL
  'Adelaide Crows':      '#002B5C',
  'Brisbane Lions':      '#A30046',
  'Carlton':             '#003087',
  'Collingwood':         '#000000',
  'Essendon':            '#CC2031',
  'Fremantle':           '#2C1F6E',
  'Geelong Cats':        '#1C3C76',
  'Gold Coast Suns':     '#E41D2B',
  'GWS Giants':          '#F15C22',
  'Hawthorn':            '#4D2004',
  'Melbourne':           '#CC2031',
  'North Melbourne':     '#013B9F',
  'Port Adelaide':       '#01B5B1',
  'Richmond':            '#FFD200',
  'St Kilda':            '#ED0F05',
  'Sydney Swans':        '#ED171F',
  'West Coast Eagles':   '#002B7F',
  'Western Bulldogs':    '#0057A5',
  // Tasmanian Devils (expansion 2028)
  'Tasmanian Devils':    '#008000',
};

const FALLBACK = '#00da9b'; // default teal accent

export function getClubPrimary(teamName) {
  if (!teamName) return FALLBACK;
  // Try exact match first, then partial
  if (CLUB_COLORS[teamName]) return CLUB_COLORS[teamName];
  const key = Object.keys(CLUB_COLORS).find(k => teamName.includes(k) || k.includes(teamName));
  return key ? CLUB_COLORS[key] : FALLBACK;
}

// Lift a club colour into something that reads as a legible accent on a dark
// panel. Very dark clubs (Collingwood black, Hawthorn brown) would otherwise
// vanish, so we floor luminance and keep enough saturation to stay "club".
function deriveAccent(c) {
  let accent = c;
  let guard = 0;
  // Push toward a target luminance window that's legible on both dark and
  // light surfaces without going washed-out.
  while (accent.luminance() < 0.18 && guard < 12) {
    accent = accent.brighten(0.35);
    guard += 1;
  }
  while (accent.luminance() > 0.6 && guard < 24) {
    accent = accent.darken(0.3);
    guard += 1;
  }
  // Keep it saturated so it still feels like a team colour, not grey.
  if (accent.get('hsl.s') < 0.35) {
    accent = accent.set('hsl.s', 0.5);
  }
  return accent;
}

export function injectClubTheme(teamName) {
  const primary = getClubPrimary(teamName);
  let c;
  try { c = chroma(primary); } catch { c = chroma(FALLBACK); }

  const accent = deriveAccent(c);
  const root = document.documentElement;
  // Make a coherent, chroma-derived club palette available as CSS vars.
  // Deliberately NOT touching --A-accent so the theme system stays in charge.
  root.style.setProperty('--club-primary',       c.hex());
  root.style.setProperty('--club-primary-dim',   c.alpha(0.15).css());
  root.style.setProperty('--club-glow',          c.brighten(0.8).hex());
  // Back-compat alias for the old var name.
  root.style.setProperty('--club-primary-glow',  c.brighten(0.8).hex());
  root.style.setProperty('--club-accent',        accent.hex());
  // Pick black/white text for sitting *on* the club primary, by luminance.
  root.style.setProperty('--club-contrast-text', c.luminance() > 0.4 ? '#0b0f14' : '#ffffff');
}

export function clearClubTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--club-primary');
  root.style.removeProperty('--club-primary-dim');
  root.style.removeProperty('--club-glow');
  root.style.removeProperty('--club-primary-glow');
  root.style.removeProperty('--club-accent');
  root.style.removeProperty('--club-contrast-text');
}
