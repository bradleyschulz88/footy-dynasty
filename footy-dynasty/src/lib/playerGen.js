import { SEED, rng, seedRng, rand, pick, randNorm, TIER_SCALE } from './rng.js';

export const FIRST_NAMES = ["Jack","Tom","Sam","Charlie","Will","Patrick","Marcus","Luke","Dylan","Lachie","Bailey","Riley","Mitch","Harry","Noah","Hudson","Archie","Cooper","Levi","Oscar","Ollie","Tyler","Jed","Nick","Jordan","Bradley","Connor","Caleb","Kai","Toby","Zac","Beau","Ben","Christian","Adam","Steele","Hayden","Hugh","Liam","Reuben","Eli","Finn","Max","George","Joel","Daniel","Joe","Fletcher","Brodie","Touk","Isaac","Jye"];
export const LAST_NAMES = ["Walsh","Petracca","Bontempelli","Daicos","Cripps","Heeney","Neale","Oliver","Steele","Macrae","Whitfield","Mitchell","Marshall","Sheezel","Sicily","Fyfe","Rowell","Anderson","Witts","Ginnivan","Stengle","Coleman","Ratugolea","Houston","Jones","Mills","McCartin","Roberton","English","Naughton","Treloar","Bruhn","Reid","Harrison","Madgen","Lloyd","Smith","Riewoldt","Brown","Kelly","Clark","Black","Watson","Lee","King","Chol","Gunston","Fletcher","Pickett","Maynard","Sidebottom","Pendlebury","Long","Phillips","Stewart","Tuohy","Henry","Holmes","Ah Chee","Worrell"];
export const POSITIONS = ["KF","HF","C","HB","KB","R","RU","WG","UT"];
export const POSITION_NAMES = {
  KF: "Key Forward", HF: "Half Forward", C: "Centre Mid",
  HB: "Half Back", KB: "Key Back", R: "Rover/Mid",
  RU: "Ruck", WG: "Wing", UT: "Utility",
};

export function generatePlayer(clubTier, idx) {
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
  const fname = pick(FIRST_NAMES);
  const lname = pick(LAST_NAMES);
  return {
    id: `p_${tier}_${idx}_${SEED}`,
    name: `${fname} ${lname}`,
    firstName: fname, lastName: lname,
    age, position, attrs, overall, trueRating, potential, potentialTrue, tier,
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

export function generateSquad(clubId, tier, size = 32) {
  seedRng(clubId.split("").reduce((a, c) => a + c.charCodeAt(0), 7));
  return Array.from({ length: size }, (_, i) => generatePlayer(tier, i));
}
