// Seeded LCG shared across gameplay (`rng`, `rand`, `pick`, `randNorm`).
// Call `seedRng(n)` when starting a new career or sim block so flows are reproducible.
// Note: timestamps in entity ids (e.g. `Date.now()` in UI-only rows) are not derived from this stream.

export let SEED = 42;

export const rng = (): number => {
  SEED = (SEED * 9301 + 49297) % 233280;
  return SEED / 233280;
};

export const seedRng = (s: number): void => { SEED = s; };

export const rand = (a: number, b: number): number => Math.floor(rng() * (b - a + 1)) + a;

export const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

export const randNorm = (mean: number, sd: number): number => {
  const u = rng(), v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(Math.max(u, 0.001))) * Math.cos(2 * Math.PI * v);
};

// Scaling factor applied to player overalls when computing absolute match strength.
// Tier-1 players are at full value; lower tiers are proportionally weaker.
export const TIER_SCALE: Record<number, number> = { 1: 1.00, 2: 0.80, 3: 0.64 };