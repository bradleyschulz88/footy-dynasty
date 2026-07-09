// ---------------------------------------------------------------------------
// Stadium naming rights — an opt-in annual income stream that scales with tier
// and stadium size. Pure valuation; the sponsor name is picked deterministically
// so a given career/season signs a stable deal.
// ---------------------------------------------------------------------------
import { TIER_FINANCE, NAMING_RIGHTS } from './constants.js';

/** Annual naming-rights value for a tier + stadium level ($). 0 for community grounds. */
export function namingRightsValue(tier, stadiumLevel) {
  if (!tier || tier > NAMING_RIGHTS.minTier) return 0;
  const annualIncome = TIER_FINANCE[tier]?.annualIncome || 0;
  const lvl = Math.max(1, Math.round(stadiumLevel) || 1);
  const factor = 1 + (lvl - 1) * NAMING_RIGHTS.perLevel;
  return Math.round(annualIncome * NAMING_RIGHTS.baseShare * factor);
}

/** Deterministic sponsor name for a career/season (stable per signing). */
export function generateSponsorName(seed = 0) {
  const names = NAMING_RIGHTS.sponsorNames;
  const i = ((Math.abs(Math.round(seed)) % names.length) + names.length) % names.length;
  return `${names[i]} Park`;
}

/** The active deal, or null (also treats an expired/old-save value as null). */
export function activeNamingRights(career) {
  const d = career?.namingRights;
  return d && d.yearsLeft > 0 && d.annualValue > 0 ? d : null;
}

/** Build a fresh deal for the club's current tier + stadium (does not mutate). */
export function signNamingRights(career, tier) {
  const stadiumLevel = career?.facilities?.stadium?.level ?? 1;
  const annualValue = namingRightsValue(tier, stadiumLevel);
  if (annualValue <= 0) return null;
  return {
    name: generateSponsorName((career?.season ?? 0) + stadiumLevel),
    annualValue,
    yearsLeft: NAMING_RIGHTS.termYears,
  };
}
