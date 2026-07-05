// ---------------------------------------------------------------------------
// Football-department soft cap — the AFL's second cap, on staff/coaching spend.
// Soft: never blocks a hire; going over incurs a luxury tax on the excess at
// season end. Pure + deterministic.
// ponytail: only the player's club is levied — the finance engine doesn't model
// AI club cash; extend here if AI budgets ever become real.
// ---------------------------------------------------------------------------
import { TIER_FINANCE, FOOTBALL_DEPT_CAP_SHARE, FOOTBALL_DEPT_LEVY_RATE } from './constants.js';

/** Soft cap for a tier in dollars, or null where no cap applies (T3/T4/unknown). */
export function footballDeptCap(tier) {
  const share = FOOTBALL_DEPT_CAP_SHARE[tier];
  const wageBudget = TIER_FINANCE[tier]?.wageBudget;
  if (!share || !wageBudget) return null;
  return Math.round(wageBudget * share);
}

/**
 * Cap position + season-end levy for a staff-wage total.
 * @returns {{cap:number|null, spend:number, over:number, levy:number}}
 */
export function footballDeptLevy({ tier, staffWages }) {
  const cap = footballDeptCap(tier);
  const spend = Number.isFinite(staffWages) && staffWages > 0 ? Math.round(staffWages) : 0;
  if (cap == null) return { cap: null, spend, over: 0, levy: 0 };
  const over = Math.max(0, spend - cap);
  return { cap, spend, over, levy: Math.round(over * FOOTBALL_DEPT_LEVY_RATE) };
}

/** Convenience: cap position for a career's current staff list. */
export function careerFootballDept(career, tier) {
  const staffWages = (career?.staff || []).reduce((a, s) => a + (s?.wage || 0), 0);
  return footballDeptLevy({ tier, staffWages });
}
