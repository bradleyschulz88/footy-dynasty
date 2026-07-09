// ---------------------------------------------------------------------------
// AFLW program (lean first slice). An AFL-tier club can field a women's side;
// each season it plays an ABSTRACT, deterministic campaign and returns a
// result (ladder finish, record, premiership). No global rng — the outcome is a
// pure function of club strength and a season seed, so it's reproducible.
// ponytail: no AFLW list/fixtures of its own yet — that's the documented
// ceiling; a full women's program is a later expansion.
// ---------------------------------------------------------------------------
import { clamp } from './format.js';
import { TIER_FINANCE } from './finance/constants.js';

export const AFLW_LADDER_SIZE = 10;
const PROGRAM_COST_SHARE = 0.02; // 2% of the tier wage budget per season

/** Deterministic float in [0,1) from an integer seed (single Lehmer step). */
function det(seed) {
  let x = Math.abs(Math.round(seed)) % 2147483647;
  if (x === 0) x = 1;
  return ((x * 48271) % 2147483647) / 2147483647;
}

/** Only AFL-tier (1) clubs field an AFLW side in this slice. */
export function aflwProgramCost(tier) {
  if (tier !== 1) return 0;
  return Math.round((TIER_FINANCE[1]?.wageBudget || 0) * PROGRAM_COST_SHARE);
}

/** Strength of the club's AFLW side (0–100), abstracted from the men's club. */
export function clubAflwStrength(career) {
  const rep = clamp(career?.coachReputation ?? 40, 0, 100);
  const conf = clamp(career?.finance?.boardConfidence ?? 55, 0, 100);
  return clamp(Math.round(rep * 0.5 + conf * 0.5), 20, 95);
}

/**
 * Abstract AFLW season result.
 * @param {number} strength 20–95
 * @param {number} seed     season (or any integer) for reproducibility
 * @returns {{position:number, wins:number, losses:number, premiers:boolean}}
 */
export function simulateAflwSeason(strength, seed) {
  const s = clamp(Number.isFinite(strength) ? strength : 60, 20, 95);
  const rounds = AFLW_LADDER_SIZE; // ~one game vs each rival
  const n1 = det(seed);
  const n2 = det(seed + 101);
  // Wins scale with strength plus bounded noise.
  const wins = clamp(Math.round(rounds * (s / 100) + (n1 - 0.5) * 3), 0, rounds);
  const losses = rounds - wins;
  // More wins → higher ladder finish; noise breaks ties without overturning form.
  const position = clamp(
    Math.round(1 + (rounds - wins) * ((AFLW_LADDER_SIZE - 1) / rounds) + (n2 - 0.5) * 2),
    1,
    AFLW_LADDER_SIZE,
  );
  const premiers = position === 1 && det(seed + 202) < 0.6; // minor premier wins the flag 60%
  return { position, wins, losses, premiers };
}

export function aflwActive(career) {
  return !!career?.aflw?.active;
}

/** Establish the program (T1 only). Returns the new aflw state, or null. */
export function establishAflw(career, tier) {
  if (tier !== 1 || aflwActive(career)) return null;
  return { active: true, lastResult: null, premierships: career?.aflw?.premierships ?? 0 };
}
