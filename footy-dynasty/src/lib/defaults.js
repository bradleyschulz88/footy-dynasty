import { SEED, rand, pick, rng, seedRng } from './rng.js';
import { FIRST_NAMES, LAST_NAMES, generatePlayer } from './playerGen.js';
import { ALL_CLUBS } from '../data/pyramid.js';
import { TIER_FINANCE } from './finance/constants.js';

// `defaultFinance` now reads tier baselines from finance/constants.js.
// All numerical balance lives in one file. See finance/constants.js.
export function defaultFinance(tier) {
  const base = TIER_FINANCE[tier] || TIER_FINANCE[3];
  return {
    cash:            base.cash,
    annualIncome:    base.annualIncome,
    transferBudget:  base.transferBudget,
    wageBudget:      base.wageBudget,
    boardConfidence: 65,
    fanHappiness:    60,
  };
}

export const DEFAULT_FACILITIES = () => ({
  trainingGround: { level: 1, cost: 80000,  max: 5 },
  gym:            { level: 1, cost: 60000,  max: 5 },
  medical:        { level: 1, cost: 50000,  max: 5 },
  academy:        { level: 1, cost: 120000, max: 5 },
  stadium:        { level: 1, cost: 350000, max: 5 },
  recovery:       { level: 1, cost: 40000,  max: 5 },
});

export const DEFAULT_TRAINING = () => ({
  intensity: 60,
  focus: { skills: 30, fitness: 25, tactics: 25, recovery: 20 },
});

const SPONSOR_POOL = [
  { name: "Toyota",          category: "Auto",     baseValue: 1800000 },
  { name: "Coopers Brewery", category: "Beverage", baseValue: 900000 },
  { name: "Bunnings",        category: "Retail",   baseValue: 1500000 },
  { name: "ANZ Bank",        category: "Finance",  baseValue: 2500000 },
  { name: "Rip Curl",        category: "Apparel",  baseValue: 700000 },
  { name: "JB Hi-Fi",        category: "Tech",     baseValue: 800000 },
  { name: "Vegemite",        category: "Food",     baseValue: 600000 },
  { name: "Optus",           category: "Telco",    baseValue: 2000000 },
  { name: "Carlton Draught", category: "Beverage", baseValue: 1200000 },
  { name: "Akubra",          category: "Apparel",  baseValue: 400000 },
  { name: "Telstra",         category: "Telco",    baseValue: 1900000 },
  { name: "Bendigo Bank",    category: "Finance",  baseValue: 800000 },
  { name: "BCF",             category: "Retail",   baseValue: 500000 },
  { name: "Mitre 10",        category: "Retail",   baseValue: 350000 },
  { name: "Local Pub Co.",   category: "Beverage", baseValue: 80000 },
  { name: "Servo & Smash",   category: "Auto",     baseValue: 40000 },
];

export function generateSponsors(tier) {
  const tiers = { 1: [3, 8], 2: [2, 5], 3: [1, 3] };
  const [min, max] = tiers[tier] || [1, 3];
  const tierMult = tier === 1 ? 1 : tier === 2 ? 0.18 : 0.04;
  seedRng(SEED + 11);
  const count = rand(min, max);
  return Array.from({ length: count }, () => {
    const s = pick(SPONSOR_POOL);
    return {
      id: `sp_${rand(1000, 9999)}_${s.name}`,
      name: s.name,
      category: s.category,
      annualValue: Math.round(s.baseValue * tierMult * (0.7 + rng() * 0.6)),
      yearsLeft: rand(1, 4),
      type: pick(["Major", "Stadium", "Apparel", "Premier", "Community"]),
    };
  });
}

// Staff IDs must stay stable — training sessions reference s2–s5 by id.
export const STAFF_BLUEPRINT = [
  { id: "s1",  role: "Senior Coach",                    rating: [60, 88], wage: 450000 },
  { id: "s2",  role: "Assistant Coach (Forwards)",      rating: [55, 82], wage: 180000 },
  { id: "s3",  role: "Assistant Coach (Defence)",       rating: [55, 82], wage: 180000 },
  { id: "s4",  role: "Midfield Coach",                  rating: [55, 82], wage: 170000 },
  { id: "s5",  role: "Head of Strength & Conditioning", rating: [50, 80], wage: 150000 },
  { id: "s6",  role: "Head of Medical",                 rating: [55, 85], wage: 180000 },
  { id: "s7",  role: "Head Recruiter",                  rating: [55, 85], wage: 160000 },
  { id: "s8",  role: "Senior Scout",                    rating: [50, 80], wage: 110000 },
  { id: "s9",  role: "Academy Manager",                 rating: [50, 78], wage: 120000 },
  { id: "s10", role: "Performance Analyst",             rating: [50, 80], wage: 100000 },
];

// Tier 1 = full AFL department; tier 2 = state league skeleton (~7); tier 3 = volunteer club (~5 incl. medic).
const STAFF_IDS_BY_TIER = {
  1: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"],
  2: ["s1", "s2", "s4", "s5", "s6", "s7", "s8"],
  3: ["s1", "s2", "s4", "s5", "s6"],
};

/** Role ids you can add mid-career when missing from the list (by league tier). */
export const EXPANDABLE_ROLE_IDS_BY_TIER = {
  1: [],
  2: ["s3", "s9", "s10"],
  3: ["s3", "s7", "s8", "s9", "s10"],
};

/**
 * @param {string} blueprintId
 * @param {number} leagueTier 1 | 2 | 3
 * @param {{ expansionHire?: boolean }} opts expansionHire=true skips tier-3 baseline volunteer packaging for seeded roles.
 */
export function buildProfessionalStaffMember(blueprintId, leagueTier, opts = {}) {
  const expansionHire = !!opts.expansionHire;
  const b = STAFF_BLUEPRINT.find((x) => x.id === blueprintId);
  if (!b) return null;
  const t = leagueTier === 2 ? 2 : leagueTier === 3 ? 3 : 1;
  const mult = t === 1 ? 1 : t === 2 ? 0.25 : 0.05;
  let role = b.role;
  let volunteer = false;
  if (t === 3 && !expansionHire) {
    if (blueprintId === "s1") role = "Senior Coach (part-time)";
    if (blueprintId === "s2") {
      role = "Assistant / Forwards (volunteer)";
      volunteer = true;
    }
    if (blueprintId === "s4") {
      role = "Midfield / game-day (volunteer)";
      volunteer = true;
    }
    if (blueprintId === "s5") {
      role = "Runner / fitness (volunteer)";
      volunteer = true;
    }
    if (blueprintId === "s6") {
      role = "Club medic / first aid (volunteer)";
      volunteer = true;
    }
  } else if (t === 3 && expansionHire) {
    role = `${b.role} (contract)`;
  }
  let wage = Math.round(b.wage * mult);
  if (volunteer) wage = 0;
  else if (t === 3 && blueprintId === "s1") {
    wage = Math.max(8000, Math.round(b.wage * 0.07));
  }
  return {
    id: b.id,
    role,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    rating: rand(b.rating[0], b.rating[1]),
    wage,
    volunteer,
    contract: rand(1, 3),
  };
}

export function generateStaff(tier) {
  const t = tier === 2 ? 2 : tier === 3 ? 3 : 1;
  const ids = STAFF_IDS_BY_TIER[t] || STAFF_IDS_BY_TIER[3];
  seedRng(SEED + 19);
  return ids.map((id) => buildProfessionalStaffMember(id, tier, { expansionHire: false }));
}

export function defaultKits(colors) {
  return {
    home:  { primary: colors[0], secondary: colors[1], accent: colors[2], pattern: "solid",   numberColor: "#FFFFFF" },
    away:  { primary: "#FFFFFF", secondary: colors[0], accent: colors[1], pattern: "solid",   numberColor: colors[0] },
    clash: { primary: "#1A1A1A", secondary: colors[0], accent: colors[2], pattern: "stripes", numberColor: colors[1] },
  };
}

export function generateTradePool(leagueKey, season) {
  seedRng(season * 333 + 7);
  return Array.from({ length: 25 }, (_, i) => {
    const tierForPlayer = rand(1, 3);
    const p = generatePlayer(tierForPlayer, 5000 + i + season * 50, { clubId: 'trade', season });
    return { ...p, fromClub: pick(ALL_CLUBS).short };
  });
}
