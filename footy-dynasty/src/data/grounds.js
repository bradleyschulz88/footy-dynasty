// Home venue metadata (Tier-1 AFL from spec; Tier 2/3 synthesised).
// Pyramid club entries stay minimal — this map keys off `club.id`.

/** @typedef {{
 *   name: string,
 *   shortName: string,
 *   suburb: string,
 *   city: string,
 *   state: string,
 *   capacity: number,
 *   surfaceType: 'grass'|'synthetic',
 *   roofed: boolean,
 *   atmosphere: number,
 *   homeAdvantageBase: number,
 *   description: string,
 * }} GroundDef */

const g = (
  name,
  shortName,
  suburb,
  city,
  state,
  capacity,
  roofed,
  atmosphere,
  homeAdvantageBase,
  description,
  surfaceType = "grass",
) => ({
  name,
  shortName,
  suburb,
  city,
  state,
  capacity,
  surfaceType,
  roofed,
  tierHint: 1,
  atmosphere,
  homeAdvantageBase,
  description,
});

/** Tier-1 AFL venues (club id → ground). Shared venues repeated per club. */
export const GROUND_BY_CLUB_ID = {
  mel: g(
    "Melbourne Cricket Ground",
    "MCG",
    "Yarra Park",
    "Melbourne",
    "VIC",
    100_024,
    false,
    95,
    10,
    "The spiritual home of the game — 100,024 on the biggest days.",
  ),
  col: g(
    "Melbourne Cricket Ground",
    "MCG",
    "Yarra Park",
    "Melbourne",
    "VIC",
    100_024,
    false,
    95,
  10,
    "Collingwood share the MCG with Melbourne — massive crowds, big noise.",
  ),
  ric: g(
    "Melbourne Cricket Ground",
    "MCG",
    "Yarra Park",
    "Melbourne",
    "VIC",
    100_024,
    false,
    95,
    10,
    "Punt Road ends at the 'G — Tigerland when the stands fill.",
  ),
  ess: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 8, "Indoor Docklands deck — fast, modern, great for night footy."),
  car: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 8, "Blues home at Marvel — roof on, crowd roaring."),
  stk: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 8, "Saints pack Marvel on their home dates."),
  nor: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 7, "Kangaroos' Melbourne home — Marvel's closed roof."),
  wbd: g("Mars Stadium", "Mars", "Ballarat", "Ballarat", "VIC", 13_500, false, 80, 7, "Regional Ballarat venue — cold winds, honest footy.", "grass"),
  gee: g("GMHBA Stadium", "GMHBA", "South Geelong", "Geelong", "VIC", 36_000, false, 88, 9, "The Cattery — intimate, loud, can feel like ten goals."),
  haw: g("University of Tasmania Stadium", "UTAS", "Invermay", "Launceston", "TAS", 22_000, false, 85, 8, "Hawks' Tasmanian fortress — travel hits visitors."),
  bri: g("The Gabba", "Gabba", "Woolloongabba", "Brisbane", "QLD", 42_000, false, 87, 9, "Queensland sun sets on the Gabba — bouncing deck."),
  gcs: g("People First Stadium", "PFS", "Carrara", "Gold Coast", "QLD", 25_000, false, 72, 7, "Carrara oval — holiday strip footy."),
  gws: g("ENGIE Stadium", "ENGIE", "Homebush", "Sydney", "NSW", 24_000, false, 70, 7, "Western Sydney showground — still building tradition."),
  syd: g("Sydney Cricket Ground", "SCG", "Moore Park", "Sydney", "NSW", 48_000, false, 88, 9, "The SCG — short boundaries, long memories."),
  ade: g("Adelaide Oval", "AO", "North Adelaide", "Adelaide", "SA", 53_583, false, 90, 9, "The cathedral of sport — Crows' Adelaide home."),
  pad: g("Adelaide Oval", "AO", "North Adelaide", "Adelaide", "SA", 53_583, false, 90, 9, "Port's same deck — fierce Showdown crowds."),
  wce: g("Optus Stadium", "Optus", "Burswood", "Perth", "WA", 65_000, false, 91, 10, "The Palace — noisy, steep, West Coast stronghold."),
  fre: g("Optus Stadium", "Optus", "Burswood", "Perth", "WA", 65_000, false, 91, 9, "Dockers share Optus — Derby days are electric."),
  tas: g("Blundstone Arena", "Blundstone", "Bellerive", "Hobart", "TAS", 23_000, false, 83, 8, "Bellerive — Tassie devils hunting under the hill."),
};

const GROUND_SUFFIXES = [
  "Oval",
  "Reserve",
  "Recreation Reserve",
  "Sports Ground",
  "Park",
  "Community Ground",
  "Recreation Oval",
  "Sports Reserve",
];

const STATE_CITY = {
  VIC: "Melbourne",
  SA: "Adelaide",
  WA: "Perth",
  TAS: "Hobart",
  NT: "Darwin",
  QLD: "Brisbane",
  NSW: "Sydney",
  ACT: "Canberra",
  NAT: "Melbourne",
};

/** Tier-3 community table: stadium facility level → capacity & home base. */
const COMMUNITY_BY_LEVEL = [
  { cap: 1_500, base: 3, atmos: 45, desc: "Local oval — tin shed change rooms and a hand-painted scoreboard." },
  { cap: 3_500, base: 4, atmos: 55, desc: "Decent community ground — small stand, canteen opens late morning." },
  { cap: 6_000, base: 5, atmos: 65, desc: "Suburban deck — electronic board, covered hill." },
  { cap: 10_000, base: 6, atmos: 73, desc: "Regional venue — grandstand, club rooms, media nook." },
  { cap: 18_000, base: 7, atmos: 80, desc: "Major community stadium — boxes, lights, big finals feel." },
];

/**
 * @param {import('./pyramid.js').ClubLike} club
 * @param {number} stadiumLevel 1–5 from career.facilities.stadium.level
 * @returns {GroundDef}
 */
export function synthesizeCommunityGround(club, stadiumLevel = 1) {
  const lvl = Math.max(1, Math.min(5, stadiumLevel || 1));
  const row = COMMUNITY_BY_LEVEL[lvl - 1];
  const prefix = (club.name || club.short || "Local").split(" ")[0];
  const h = (club.id || prefix).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const name = `${prefix} ${GROUND_SUFFIXES[h % GROUND_SUFFIXES.length]}`;
  const city = STATE_CITY[club.state] || "Regional";
  return {
    name,
    shortName: `${club.short} Ground`,
    suburb: city,
    city,
    state: club.state || "VIC",
    capacity: row.cap,
    surfaceType: "grass",
    roofed: false,
    tierHint: 3,
    atmosphere: row.atmos,
    homeAdvantageBase: row.base,
    description: row.desc,
  };
}

/**
 * Plausible state-league venue when not in AFL map.
 * @param {import('./pyramid.js').ClubLike} club
 * @param {number} leagueTier
 */
export function synthesizeStateLeagueGround(club, leagueTier = 2) {
  const city = STATE_CITY[club.state] || "Regional";
  const cap = club.state === "SA" || club.state === "WA" ? 9_500 : club.state === "TAS" ? 6_800 : 5_200;
  const atm = 68 + ((club.id || "").length % 8);
  return {
    name: `${club.name || club.short} Football Ground`,
    shortName: `${club.short} FG`,
    suburb: city,
    city,
    state: club.state || "VIC",
    capacity: cap,
    surfaceType: "grass",
    roofed: false,
    tierHint: leagueTier,
    atmosphere: Math.min(82, atm),
    homeAdvantageBase: leagueTier === 2 ? 5 : 4,
    description: `State-league home — hard turf, loyal locals, ~${cap.toLocaleString()} on a good day.`,
  };
}

/**
 * Resolved ground for any club in the pyramid.
 * @param {import('./pyramid.js').ClubLike|null|undefined} club
 * @param {number} [stadiumLevel] player stadium (tier 3 only)
 * @param {number} [leagueTier] current league tier (2 = state/community synthesised oval; 3+ = suburban)
 */
export function getClubGround(club, stadiumLevel = 3, leagueTier) {
  if (!club) {
    return synthesizeCommunityGround({ name: "Local", short: "LOC", state: "VIC" }, stadiumLevel);
  }
  const fixed = GROUND_BY_CLUB_ID[club.id];
  if (fixed) return { ...fixed };
  const tier = leagueTier ?? club.tier ?? 2;
  if (tier >= 3) return synthesizeCommunityGround(club, stadiumLevel);
  return synthesizeStateLeagueGround(club, 2);
}
