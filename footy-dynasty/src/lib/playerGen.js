import { SEED, rng, seedRng, rand, pick, randNorm, TIER_SCALE } from './rng.js';

export const FIRST_NAMES = [
  "Jack","Tom","Sam","Charlie","Will","Patrick","Marcus","Luke","Dylan","Lachie","Bailey","Riley","Mitch","Harry","Noah","Hudson","Archie","Cooper","Levi","Oscar","Ollie","Tyler","Jed","Nick","Jordan","Bradley","Connor","Caleb","Kai","Toby","Zac","Beau","Ben","Christian","Adam","Steele","Hayden","Hugh","Liam","Reuben","Eli","Finn","Max","George","Joel","Daniel","Joe","Fletcher","Brodie","Touk","Isaac","Jye",
  "Angus","Xavier","Flynn","Callum","Jesse","Brayden","Travis","Joshua","Nathan","Shaun","Kade","Aaron","Mason","Blake","Ethan","Logan","Jayden","Taylor","Declan","Kysaiah","Brent","Corey","Tyson","Rhys","Lachlan","Ed","Jasper","Harvey","Hunter","Jaxon","Taj","Zane","Bodhi","Jett","Ky","River",
];
export const LAST_NAMES = [
  "Walsh","Petracca","Bontempelli","Daicos","Cripps","Heeney","Neale","Oliver","Steele","Macrae","Whitfield","Mitchell","Marshall","Sheezel","Sicily","Fyfe","Rowell","Anderson","Witts","Ginnivan","Stengle","Coleman","Ratugolea","Houston","Jones","Mills","McCartin","Roberton","English","Naughton","Treloar","Bruhn","Reid","Harrison","Madgen","Lloyd","Smith","Riewoldt","Brown","Kelly","Clark","Black","Watson","Lee","King","Chol","Gunston","Fletcher","Pickett","Maynard","Sidebottom","Pendlebury","Long","Phillips","Stewart","Tuohy","Henry","Holmes","Ah Chee","Worrell",
  "McDonald","Cameron","Andrews","Greenwood","Darcy","Gawn","Cotchin","Grundy","Parish","Weitering","McGovern","Zurhaar","Hipwood","McStay","McLean","Howe","Goldstein","Short","Vlastuin","Rioli","Hill","Thomas","Williams","Johnson","Martin","Zorko","Lyons","McKay","Curnow","Fantasia","Francis","Simpkin","Walters","McGrath","Sheed","Caldwell","Ridley","Colyer","van Rooyen",
];

/** FNV-1a 32-bit hash — stable name variety per club / season / slot. */
function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Pick first/last name from pools using club + season + index so different clubs and
 * new years don't all draw the same small set of combinations. Does not consume RNG
 * (player stat rolls stay reproducible for a given seed).
 */
export function pickPlayerNames(clubKey, season, playerIdx) {
  const base = String(clubKey ?? "");
  const y = Number(season) || 0;
  const idx = Number(playerIdx) || 0;
  const h1 = hash32(`${base}\0fname\0${y}\0${idx}`);
  const h2 = hash32(`${base}\0lname\0${y}\0${idx}`);
  const fname = FIRST_NAMES[h1 % FIRST_NAMES.length];
  const lname = LAST_NAMES[h2 % LAST_NAMES.length];
  return { firstName: fname, lastName: lname };
}

export const POSITIONS = ["KF","HF","C","HB","KB","R","RU","WG","UT"];
export const POSITION_NAMES = {
  KF: "Key Forward", HF: "Half Forward", C: "Centre Mid",
  HB: "Half Back", KB: "Key Back", R: "Rover/Mid",
  RU: "Ruck", WG: "Wing", UT: "Utility",
};

/** Line groups for match & training heuristics (secondary position counts). */
export const LINE_FWD = new Set(["KF", "HF"]);
export const LINE_MID = new Set(["C", "R", "WG"]);
export const LINE_BACK = new Set(["HB", "KB"]);
export const LINE_RUCK = new Set(["RU"]);

// Realistic secondary roles — kept disjoint from primary.
const SECONDARY_RELATED = {
  KF: ["HF", "KB", "UT", "RU"],
  HF: ["KF", "C", "WG", "UT"],
  C: ["R", "WG", "HF", "HB", "UT"],
  HB: ["KB", "C", "WG", "UT"],
  KB: ["HB", "KF", "RU", "UT"],
  R: ["C", "WG", "UT"],
  RU: ["KB", "HF", "C"],
  WG: ["HB", "HF", "R", "C", "UT"],
  UT: ["C", "R", "WG", "HF", "HB", "KF", "KB"],
};

export function playerHasPosition(player, pos) {
  if (!player || pos == null || pos === "" || pos === "ALL") return false;
  return player.position === pos || player.secondaryPosition === pos;
}

export function isForwardPreferred(p) {
  return p && (LINE_FWD.has(p.position) || LINE_FWD.has(p.secondaryPosition));
}

/** Midfield-ish workload — includes UT (rotates through centre/wing). */
export function isMidPreferred(p) {
  if (!p) return false;
  if (p.position === "UT" || p.secondaryPosition === "UT") return true;
  return LINE_MID.has(p.position) || LINE_MID.has(p.secondaryPosition);
}

export function isBackPreferred(p) {
  return p && (LINE_BACK.has(p.position) || LINE_BACK.has(p.secondaryPosition));
}

export function formatPositionSlash(p) {
  if (!p) return "";
  return p.secondaryPosition ? `${p.position} / ${p.secondaryPosition}` : p.position;
}

function rollSecondaryPosition(primary) {
  const thr = primary === "UT" ? 0.10 : primary === "RU" ? 0.55 : 0.28;
  if (rng() < thr) return null;
  const opts = (SECONDARY_RELATED[primary] || POSITIONS.filter((x) => x !== primary)).filter((x) => x !== primary);
  if (!opts.length) return null;
  return pick(opts);
}

/**
 * @param {number} clubTier
 * @param {number} idx  Slot / sequence index (feeds player id and name hashing).
 * @param {{ clubId?: string, season?: number } | null} [nameContext]  When set, names come from
 *   pickPlayerNames(clubId, season, idx) so lists vary by club and year. When null/omitted, uses
 *   generic pool key `_` and season 0 (still deterministic, no RNG consumed for names).
 */
export function generatePlayer(clubTier, idx, nameContext) {
  const tier = Math.max(1, Math.min(3, clubTier));
  const baseSkill = Math.max(42, Math.min(99, Math.round(randNorm(68, 11))));
  const positions = ["KF","HF","C","HB","KB","R","RU","WG","UT"];
  const weights = [2, 3, 4, 3, 2, 3, 1, 2, 2];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total, position = "C";
  for (let i = 0; i < positions.length; i++) {
    r -= weights[i];
    if (r <= 0) { position = positions[i]; break; }
  }
  const age = Math.max(17, Math.min(36, Math.round(randNorm(24, 4))));
  const attrs = {
    kicking:   Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 6)))),
    marking:   Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 6)))),
    handball:  Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 5)))),
    tackling:  Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 7)))),
    speed:     Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 7)))),
    endurance: Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 6)))),
    strength:  Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 7)))),
    decision:  Math.max(30, Math.min(99, Math.round(randNorm(baseSkill, 6)))),
  };
  if (position === "RU") { attrs.strength += 8; attrs.marking += 5; attrs.speed -= 6; }
  if (position === "WG" || position === "R") { attrs.speed += 6; attrs.endurance += 5; }
  if (position === "KF" || position === "KB") { attrs.marking += 6; attrs.strength += 4; }
  Object.keys(attrs).forEach(k => { attrs[k] = Math.max(30, Math.min(99, attrs[k])); });
  const overall = Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 8);
  const trueRating = Math.round(overall * (TIER_SCALE[tier] || 1.0));
  const potential = Math.min(99, overall + (age <= 21 ? rand(5, 18) : age <= 25 ? rand(0, 8) : rand(-2, 3)));
  const potentialTrue = Math.round(potential * (TIER_SCALE[tier] || 1.0));
  const secondaryPosition = rollSecondaryPosition(position);
  const nameKey = nameContext?.clubId != null ? String(nameContext.clubId) : "_";
  const nameSeason = nameContext?.season != null ? Number(nameContext.season) : 0;
  const { firstName: fname, lastName: lname } = pickPlayerNames(nameKey, nameSeason, idx);
  return {
    id: `p_${tier}_${idx}_${SEED}`,
    name: `${fname} ${lname}`,
    firstName: fname, lastName: lname,
    age, position, secondaryPosition, attrs, overall, trueRating, potential, potentialTrue, tier,
    fitness: rand(85, 100),
    morale: rand(60, 90),
    form: rand(50, 85),
    contract: rand(1, 4),
    wage: Math.round(overall * (tier === 1 ? 5800 : tier === 2 ? 1200 : 250) * (0.9 + rng() * 0.4)),
    value: Math.round(overall * overall * (tier === 1 ? 280 : tier === 2 ? 70 : 12) * (0.7 + rng() * 0.7)),
    goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0,
    injured: 0, rookie: age <= 19,
  };
}

/**
 * @param {string} clubId
 * @param {number} tier
 * @param {number} [size]
 * @param {number} [season]  When provided, mixes into RNG seed and name hashing so a new year
 *   refreshes AI/user lists without colliding with the previous season’s generator state.
 */
export function generateSquad(clubId, tier, size = 32, season) {
  const base = clubId.split("").reduce((a, c) => a + c.charCodeAt(0), 7);
  if (season == null) seedRng(base);
  else seedRng(base + Number(season) * 1000003);
  const nameSeason = season == null ? 0 : Number(season);
  return Array.from({ length: size }, (_, i) =>
    generatePlayer(tier, i, { clubId, season: nameSeason }),
  );
}
