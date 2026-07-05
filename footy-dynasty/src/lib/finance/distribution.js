// ---------------------------------------------------------------------------
// AFL central distribution & equalisation funding.
//
// Real AFL clubs' biggest income line is the league distribution, tilted so
// struggling clubs (low ladder finish, weak revenue) get a competitive-balance
// top-up. Pure and deterministic: same inputs → same dollars, no rng.
// ---------------------------------------------------------------------------
import { TIER_FINANCE, DISTRIBUTION_SHARES } from './constants.js';
import { clamp } from '../format.js';

/**
 * League distribution for one club-season.
 * @param {{tier:number, ladderPos:number, ladderSize:number, annualIncome:number}} args
 * @returns {{base:number, equalisation:number, total:number}} whole dollars; all zero for tiers without shares (T3/T4)
 */
export function seasonDistribution({ tier, ladderPos, ladderSize, annualIncome }) {
  const shares = DISTRIBUTION_SHARES[tier];
  const anchor = TIER_FINANCE[tier]?.annualIncome;
  if (!shares || !anchor) return { base: 0, equalisation: 0, total: 0 };

  const size = Math.max(2, Math.round(ladderSize) || 2);
  const pos = clamp(Math.round(ladderPos) || 1, 1, size);
  const ladderNeed = (pos - 1) / (size - 1); // 0 = premier, 1 = wooden spoon
  const income = Number.isFinite(annualIncome) && annualIncome > 0 ? annualIncome : anchor;
  const revenueNeed = clamp(1 - income / anchor, 0, 1);

  const base = Math.round(anchor * shares.base);
  const equalisation = Math.round(anchor * shares.eqMax * (0.7 * ladderNeed + 0.3 * revenueNeed));
  return { base, equalisation, total: base + equalisation };
}

/**
 * Career glue: derive the inputs from career state for the CURRENT season's
 * tier (so promotion/relegation pays the new competition's rate).
 * First season (no history) defaults to mid-table.
 */
export function careerSeasonDistribution(career, tier) {
  const ladderSize = (career?.ladder?.length) || (tier === 1 ? 18 : 10);
  const lastSeason = career?.history?.[career.history.length - 1];
  const ladderPos = lastSeason?.position || Math.ceil(ladderSize / 2);
  return seasonDistribution({
    tier,
    ladderPos,
    ladderSize,
    annualIncome: career?.finance?.annualIncome,
  });
}
