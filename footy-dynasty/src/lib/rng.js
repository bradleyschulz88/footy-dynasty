// Seeded pseudo-random number generator shared across the whole game.
// All game systems read/write through this single SEED so results are
// reproducible when you call seedRng() with a known value before generation.

export let SEED = 42;

export const rng = () => {
  SEED = (SEED * 9301 + 49297) % 233280;
  return SEED / 233280;
};

export const seedRng = (s) => { SEED = s; };

export const rand = (a, b) => Math.floor(rng() * (b - a + 1)) + a;

export const pick = (arr) => arr[Math.floor(rng() * arr.length)];

export const randNorm = (mean, sd) => {
  const u = rng(), v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(Math.max(u, 0.001))) * Math.cos(2 * Math.PI * v);
};

// Scaling factor applied to player overalls when computing absolute match strength.
// Tier-1 players are at full value; lower tiers are proportionally weaker.
export const TIER_SCALE = { 1: 1.00, 2: 0.80, 3: 0.64 };
