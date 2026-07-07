// ---------------------------------------------------------------------------
// High-performance / sports-science department. Turns the medical-staff injury
// reduction into a fundable, tiered program: injury rate, recovery speed and
// pre-season fitness all scale with investment. Pure + deterministic.
// ---------------------------------------------------------------------------
import { TIER_FINANCE, HP_LEVELS } from './constants.js';

/**
 * The club's HP investment level, clamped to what the tier allows.
 * T3/T4 community clubs are pinned to level 0 (volunteer baseline); T1/T2
 * default to Standard (level 1) on new/old saves.
 */
export function hpLevelFor(career, tier) {
  if (tier >= 3) return 0; // volunteer only
  const raw = career?.hpLevel;
  const lvl = Number.isInteger(raw) ? raw : 1; // default Standard
  return Math.max(0, Math.min(HP_LEVELS.length - 1, lvl));
}

/**
 * Effects + annual cost for an investment level at a tier.
 * @returns {{level:number, label:string, injuryRateMult:number, recoveryWeeksBonus:number, preseasonFitnessBonus:number, cost:number}}
 */
export function hpEffects(level, tier) {
  const lvl = Math.max(0, Math.min(HP_LEVELS.length - 1, Number.isInteger(level) ? level : 0));
  const def = HP_LEVELS[lvl];
  const wageBudget = TIER_FINANCE[tier]?.wageBudget || 0;
  // T3/T4 never pay (costShare is 0 at volunteer anyway, but guard the anchor too).
  const cost = tier <= 2 ? Math.round(wageBudget * def.costShare) : 0;
  return {
    level: lvl,
    label: def.label,
    injuryRateMult: def.injuryMult,
    recoveryWeeksBonus: def.recoveryBonus,
    preseasonFitnessBonus: def.fitnessBonus,
    cost,
  };
}

/** Effects for the career's current (tier-clamped) level. */
export function careerHpEffects(career, tier) {
  return hpEffects(hpLevelFor(career, tier), tier);
}
