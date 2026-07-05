// ---------------------------------------------------------------------------
// Member numbers — the off-field ladder. A pure re-expression of the existing
// membershipBase health multiplier as a fan-visible count; the milestone
// system in engine.js remains the only thing that moves it.
// ---------------------------------------------------------------------------
import { MEMBER_BASE } from './constants.js';
import { clamp } from '../format.js';

/** Visible member count for a tier at a given membership health (0.5–2.5). */
export function memberCount(tier, membershipBase) {
  const base = MEMBER_BASE[tier];
  if (!base) return 0;
  const health = clamp(Number.isFinite(membershipBase) ? membershipBase : 1.0, 0.5, 2.5);
  return Math.round(base * health);
}

/** Member count for a career's current state (old saves default to health 1.0). */
export function careerMemberCount(career, tier) {
  return memberCount(tier, career?.membershipBase ?? 1.0);
}
