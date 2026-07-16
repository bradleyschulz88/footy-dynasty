// Derby / rivalry detection for fixtures. Real AFL rivalries keyed by pyramid
// club id (the short-id + missing-city club data made the old city matcher
// return false for every AFL pair). Named marquee clashes get their real name.

/** [idA, idB, label] — the established AFL derbies and traditional rivalries. */
export const RIVALRIES = [
  ['ade', 'pad', '🔥 Showdown'],
  ['fre', 'wce', '🔥 Western Derby'],
  ['bri', 'gcs', '🔥 QClash'],
  ['gws', 'syd', '🔥 Sydney Derby'],
  ['car', 'col', '🔥 Carlton v Collingwood'],
  ['col', 'ess', '🔥 Anzac Day'],
  ['car', 'ric', '🔥 Carlton v Richmond'],
  ['col', 'mel', "🔥 King's Birthday"],
  ['gee', 'haw', '🔥 Geelong v Hawthorn'],
  ['ess', 'haw', '🔥 Essendon v Hawthorn'],
  ['col', 'ric', '🔥 Collingwood v Richmond'],
];

const RIVAL_KEY = (a, b) => [a, b].sort().join('|');
const RIVAL_MAP = new Map(RIVALRIES.map(([a, b, label]) => [RIVAL_KEY(a, b), label]));

/** True when two clubs are established rivals (order-independent). */
export function isDerbyMatch(homeId, awayId) {
  if (!homeId || !awayId || homeId === awayId) return false;
  return RIVAL_MAP.has(RIVAL_KEY(homeId, awayId));
}

/** Short label for UI ribbons — the named clash where there is one. */
export function derbyLabel(homeId, awayId) {
  return RIVAL_MAP.get(RIVAL_KEY(homeId, awayId)) || null;
}
