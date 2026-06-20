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

// ─── NFNL (Northern Football Netball League, tier 3) ──────────────────────────
// Real community home grounds in Melbourne's north-east. Open suburban reserves:
// small/no seating, grass, modest home advantage. Entries marked "approx" use a
// plausible local venue where the exact senior ground couldn't be firmly verified.
GROUND_BY_CLUB_ID.nfnl_banyule = g("Yallambie Park", "Yallambie", "Yallambie", "Melbourne", "VIC", 3_000, false, 38, 3, "Quiet riverside reserve below the Plenty — locals ring the fence on a Saturday."); // approx (exact senior ground unconfirmed)
GROUND_BY_CLUB_ID.nfnl_bundoora = g("La Trobe Sports Park", "La Trobe", "Bundoora", "Melbourne", "VIC", 4_000, false, 42, 3, "Open university-precinct oval — wide wings and a cold northerly off the parkland.");
GROUND_BY_CLUB_ID.nfnl_diamond_creek = g("Coventry Oval", "Coventry", "Diamond Creek", "Melbourne", "VIC", 4_000, false, 46, 4, "Tidy creekside ground hemmed by gums — vocal Creekers crowd right on the boundary.");
GROUND_BY_CLUB_ID.nfnl_eltham = g("Eltham Central Park", "Central Park", "Eltham", "Melbourne", "VIC", 5_000, false, 48, 4, "Leafy Panther home by the trestle bridge — big banks, big noise on finals day.");
GROUND_BY_CLUB_ID.nfnl_epping = g("Epping Recreation Reserve", "Epping Rec", "Epping", "Melbourne", "VIC", 3_500, false, 40, 3, "Flat northern-suburbs reserve — exposed and windy, honest contested footy.");
GROUND_BY_CLUB_ID.nfnl_fitzroy_stars = g("Sir Doug Nicholls Oval", "Nicholls Oval", "Thornbury", "Melbourne", "VIC", 3_000, false, 50, 4, "Proud Indigenous club's home beside the Advancement League — tight, passionate crowd.");
GROUND_BY_CLUB_ID.nfnl_greensborough = g("War Memorial Park", "War Memorial", "Greensborough", "Melbourne", "VIC", 5_000, false, 48, 4, "The Boro's hilly home off Henry Street — steep grass banks pen the visitors in.");
GROUND_BY_CLUB_ID.nfnl_heidelberg = g("Warringal Park", "Warringal", "Heidelberg", "Melbourne", "VIC", 5_000, false, 48, 4, "Tigers' deck by the Yarra flats — long history, loud terrace under the gums.");
GROUND_BY_CLUB_ID.nfnl_heidelberg_west = g("Heidelberg Park", "Heidelberg Pk", "Heidelberg West", "Melbourne", "VIC", 2_500, false, 36, 3, "Modest flat reserve — tin-roof clubrooms and a hand-turned scoreboard.");
GROUND_BY_CLUB_ID.nfnl_hurstbridge = g("Ben Frilay Oval", "Ben Frilay", "Hurstbridge", "Melbourne", "VIC", 3_000, false, 42, 4, "Outer-fringe bush ground — gum-lined wings and a one-eyed home pocket.");
GROUND_BY_CLUB_ID.nfnl_ivanhoe = g("Ivanhoe Park", "Ivanhoe Pk", "Ivanhoe", "Melbourne", "VIC", 3_500, false, 42, 3, "Genteel reserve off The Boulevard — close fences, polite-but-pointed home crowd.");
GROUND_BY_CLUB_ID.nfnl_kilmore = g("J.J. Clancy Reserve", "Clancy", "Kilmore", "Kilmore", "VIC", 4_000, false, 44, 4, "Country-town oval an hour north — wide open, cold, and a long trip for visitors.");
GROUND_BY_CLUB_ID.nfnl_kinglake = g("Kinglake Memorial Oval", "Kinglake", "Kinglake", "Kinglake", "VIC", 2_500, false, 40, 4, "Ranges ground up in the cool air — misty, tight, the Lakers know every divot.");
GROUND_BY_CLUB_ID.nfnl_lalor = g("Lalor Recreation Reserve", "Lalor Rec", "Lalor", "Melbourne", "VIC", 3_500, false, 40, 3, "Honest suburban reserve — flat turf, canteen chips, fence-side regulars.");
GROUND_BY_CLUB_ID.nfnl_laurimar = g("Laurimar Reserve", "Laurimar", "Doreen", "Melbourne", "VIC", 3_500, false, 42, 3, "Newer estate ground on the growth fringe — open, breezy, a young Power crowd.");
GROUND_BY_CLUB_ID.nfnl_lower_plenty = g("Montmorency Park (upper oval)", "Para Road", "Montmorency", "Melbourne", "VIC", 3_000, false, 40, 3, "Bears share the Para Road green belt — Plenty River on one wing, gums on the other.");
GROUND_BY_CLUB_ID.nfnl_macleod = g("De Winton Park", "De Winton", "Rosanna", "Melbourne", "VIC", 4_000, false, 44, 4, "Long-standing Rosanna home — tight boundary and a fiercely local terrace.");
GROUND_BY_CLUB_ID.nfnl_mernda = g("Waterview Recreation Reserve", "Waterview", "Mernda", "Melbourne", "VIC", 3_500, false, 42, 3, "Growth-corridor reserve — open lakeside ground, fast-rising Demons support.");
GROUND_BY_CLUB_ID.nfnl_montmorency = g("Montmorency Park", "Monty Park", "Montmorency", "Melbourne", "VIC", 4_000, false, 46, 4, "Monty's green-belt home between Para Road and the river — gum trees right on the fence.");
GROUND_BY_CLUB_ID.nfnl_north_heidelberg = g("Shelley Reserve", "Shelley", "Heidelberg Heights", "Melbourne", "VIC", 3_500, false, 44, 4, "Bulldogs' tight Shelley Street deck — narrow ground, vocal crowd on top of you.");
GROUND_BY_CLUB_ID.nfnl_northcote_park = g("Bill Lawry Oval", "Bill Lawry", "Northcote", "Melbourne", "VIC", 4_000, false, 46, 4, "Cougars' home by Merri Creek off Westgarth Street — inner-north terrace noise.");
GROUND_BY_CLUB_ID.nfnl_old_eltham_collegian = g("Eltham College", "Eltham College", "Research", "Melbourne", "VIC", 2_500, false, 34, 3, "School-grounds home of the Turtles — modest fences, tight-knit old-collegian crowd."); // approx (school venue, exact senior oval unconfirmed)
GROUND_BY_CLUB_ID.nfnl_old_paradians = g("Garvey Oval", "Garvey", "Bundoora", "Melbourne", "VIC", 3_000, false, 36, 3, "Parade College oval — old-boys' home, manicured turf and a partisan pocket.");
GROUND_BY_CLUB_ID.nfnl_panton_hill = g("Panton Hill Recreation Reserve", "Panton Hill", "Panton Hill", "Melbourne", "VIC", 2_500, false, 40, 4, "Rural bush ground in the hills — gum-lined, remote, the Redbacks love the trek.");
GROUND_BY_CLUB_ID.nfnl_reservoir = g("Crispe Park", "Crispe", "Reservoir", "Melbourne", "VIC", 3_500, false, 42, 4, "Mustangs' long-time home off Gloucester Street — flat, fast, fence-side faithful.");
GROUND_BY_CLUB_ID.nfnl_south_morang = g("Mill Park Lakes Recreation Reserve", "Mill Park Lakes", "South Morang", "Melbourne", "VIC", 3_500, false, 42, 3, "Lakeside estate reserve — twin ovals, lights, an up-and-coming Lions crowd.");
GROUND_BY_CLUB_ID.nfnl_st_mary_s = g("Whatmough Park", "Whatmough", "Greensborough", "Melbourne", "VIC", 3_000, false, 38, 3, "Family club's hillside reserve off Kalparrin Avenue — small, friendly, loud."); // approx (exact senior ground unconfirmed)
GROUND_BY_CLUB_ID.nfnl_thomastown = g("Main Street Reserve", "Main Street", "Thomastown", "Melbourne", "VIC", 3_000, false, 40, 3, "Classic flat northern reserve on Main Street — chips, kelpies and a one-eyed pocket.");
GROUND_BY_CLUB_ID.nfnl_wallan = g("Greenhill Reserve", "Greenhill", "Wallan", "Wallan", "VIC", 3_500, false, 42, 4, "Country home off the Northern Highway — open, cold, a long haul for city sides.");
GROUND_BY_CLUB_ID.nfnl_watsonia = g("Binnak Park", "Binnak", "Watsonia", "Melbourne", "VIC", 3_500, false, 42, 4, "Saints' revamped reserve — new pavilion, electronic board, tight home terrace.");
GROUND_BY_CLUB_ID.nfnl_west_preston_lakesid = g("J.E. Moore Park", "J.E. Moore", "Reservoir", "Melbourne", "VIC", 3_500, false, 42, 4, "Roosters' home off Tyler Street — flat northern deck, raucous fence-side support.");
GROUND_BY_CLUB_ID.nfnl_whittlesea = g("Whittlesea Showgrounds", "Showgrounds", "Whittlesea", "Whittlesea", "VIC", 4_000, false, 44, 4, "Town showgrounds oval at the ranges' foot — Eagles fly on a long away trip.");

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
