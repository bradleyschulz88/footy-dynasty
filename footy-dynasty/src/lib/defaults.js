import { SEED, rand, pick, rng, seedRng } from './rng.js';
import { FIRST_NAMES, LAST_NAMES, generatePlayer } from './playerGen.js';
import { ALL_CLUBS } from '../data/pyramid.js';

export function defaultFinance(tier) {
  const cashByTier   = { 1: 8000000,  2: 800000,  3: 90000 };
  const incomeByTier = { 1: 95000000, 2: 4500000, 3: 320000 };
  return {
    cash:            cashByTier[tier]   || 50000,
    annualIncome:    incomeByTier[tier] || 200000,
    transferBudget:  tier === 1 ? 1500000 : tier === 2 ? 200000 : 25000,
    wageBudget:      tier === 1 ? 14000000 : tier === 2 ? 1200000 : 80000,
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

export function generateStaff(tier) {
  const mult = tier === 1 ? 1 : tier === 2 ? 0.25 : 0.05;
  return [
    { id: "s1",  role: "Senior Coach",                    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(60, 88), wage: Math.round(450000 * mult), contract: rand(1, 3) },
    { id: "s2",  role: "Assistant Coach (Forwards)",      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(55, 82), wage: Math.round(180000 * mult), contract: rand(1, 3) },
    { id: "s3",  role: "Assistant Coach (Defence)",       name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(55, 82), wage: Math.round(180000 * mult), contract: rand(1, 3) },
    { id: "s4",  role: "Midfield Coach",                  name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(55, 82), wage: Math.round(170000 * mult), contract: rand(1, 3) },
    { id: "s5",  role: "Head of Strength & Conditioning", name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(50, 80), wage: Math.round(150000 * mult), contract: rand(1, 3) },
    { id: "s6",  role: "Head of Medical",                 name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(55, 85), wage: Math.round(180000 * mult), contract: rand(1, 3) },
    { id: "s7",  role: "Head Recruiter",                  name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(55, 85), wage: Math.round(160000 * mult), contract: rand(1, 3) },
    { id: "s8",  role: "Senior Scout",                    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(50, 80), wage: Math.round(110000 * mult), contract: rand(1, 3) },
    { id: "s9",  role: "Academy Manager",                 name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(50, 78), wage: Math.round(120000 * mult), contract: rand(1, 3) },
    { id: "s10", role: "Performance Analyst",             name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, rating: rand(50, 80), wage: Math.round(100000 * mult), contract: rand(1, 3) },
  ];
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
    const p = generatePlayer(tierForPlayer, 5000 + i + season * 50);
    return { ...p, fromClub: pick(ALL_CLUBS).short };
  });
}
