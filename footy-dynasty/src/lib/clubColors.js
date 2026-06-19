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

export function injectClubTheme(teamName) {
  const primary = getClubPrimary(teamName);
  let c;
  try { c = chroma(primary); } catch { c = chroma(FALLBACK); }

  const root = document.documentElement;
  // Subtle override — only change the accent colour, not the full theme
  root.style.setProperty('--club-primary',      c.hex());
  root.style.setProperty('--club-primary-dim',  c.alpha(0.15).css());
  root.style.setProperty('--club-primary-glow', c.brighten(0.5).hex());
  // Don't override --A-accent globally — just make club colour available
}

export function clearClubTheme() {
  const root = document.documentElement;
  root.style.removeProperty('--club-primary');
  root.style.removeProperty('--club-primary-dim');
  root.style.removeProperty('--club-primary-glow');
}
