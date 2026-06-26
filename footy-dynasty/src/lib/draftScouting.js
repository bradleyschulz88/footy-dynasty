/** Combine scouting tiers & draft-pool visibility (deterministic display — no render-time RNG). */
import { rng } from './rng.js';

/** Cost per combine scouting run (reveals next tier on several prospects). */
export const COMBINE_SCOUT_COST = 25_000;

/** Clamp scouting tier 0–3 (0 = hidden, 3 = fully revealed). */
export function scoutRevealTier(p) {
  const n = Number(p?.scoutReveal);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(3, Math.round(n)));
}

/** Attach defaults when generating a new draft pool. */
export function withDraftScoutingDefaults(player) {
  return { ...player, scoutReveal: scoutRevealTier(player) };
}

function stableSkew(id, salt, magnitude) {
  const s = String(id ?? "");
  let h = (salt | 0) >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i);
  const u = (h >>> 0) / 4294967295;
  return Math.round((u * 2 - 1) * magnitude);
}

function clampVal(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * After season ends, legacy saves had full visibility — treat as tier 3.
 */
export function migrateDraftPoolScouting(pool) {
  if (!Array.isArray(pool)) return [];
  return pool.map((p) => ({
    ...p,
    scoutReveal: p.scoutReveal != null ? scoutRevealTier(p) : 3,
  }));
}

/** Display helpers for blurred ratings at low scout tiers. */
export function displayDraftOverall(p, scoutRating = 70) {
  const t = scoutRevealTier(p);
  const o = Number(p.overall);
  if (!Number.isFinite(o)) return { label: "?", hint: "Unscouted" };
  if (t <= 0) return { label: "?", hint: "Run combine scouting" };
  if (t === 1) return { label: `${Math.round(o / 10) * 10}`, hint: "Rough band (~±10)" };
  if (t === 2) {
    const magnitude = clampVal(Math.round(4 * (1.5 - scoutRating / 140)), 2, 8);
    const d = stableSkew(p.id, 401, magnitude);
    return { label: `${clampVal(Math.round(o + d), 40, 95)}`, hint: `Scout estimate (~±${magnitude})` };
  }
  return { label: String(Math.round(o)), hint: null };
}

export function displayDraftPotential(p, scoutRating = 70) {
  const t = scoutRevealTier(p);
  const pot = Number(p.potential);
  if (!Number.isFinite(pot)) return { label: "?", hint: null };
  if (t <= 1) return { label: "?", hint: t === 0 ? null : "Potential still fuzzy" };
  if (t === 2) {
    const magnitude = clampVal(Math.round(6 * (1.5 - scoutRating / 140)), 3, 12);
    const d = stableSkew(p.id, 509, magnitude);
    return { label: `${clampVal(Math.round(pot + d), 45, 99)}`, hint: "Ceiling estimate" };
  }
  return { label: String(Math.round(pot)), hint: null };
}

export function displayDraftWageEstimate(rookieWage, scoutTier) {
  if (scoutTier <= 1) return { label: "?", hint: "Confirm wage after scouting" };
  return { label: `$${(rookieWage / 1000).toFixed(0)}k`, hint: null };
}

/**
 * Scouting quality for a prospect given the club's home state.
 * Clubs have a natural +20% quality advantage scouting in their own state.
 */
export function regionalScoutQuality(baseQuality, clubState, prospectState) {
  if (!clubState || !prospectState) return baseQuality;
  if (clubState === prospectState) return Math.min(100, Math.round(baseQuality * 1.2));
  return baseQuality;
}

/**
 * Increase scoutReveal on up to `maxProspects` lowest-tier prospects by 1 (cap 3).
 */
export function applyCombineScoutingRound(pool, maxProspects = 14) {
  const arr = Array.isArray(pool) ? pool.map((p) => ({ ...p })) : [];
  const sortedIdx = arr
    .map((p, i) => ({ i, t: scoutRevealTier(p) }))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((x) => x.i);
  let n = 0;
  for (const i of sortedIdx) {
    if (n >= maxProspects) break;
    const t = scoutRevealTier(arr[i]);
    if (t >= 3) continue;
    arr[i].scoutReveal = t + 1;
    n++;
  }
  return arr;
}

/**
 * Get the scout rating (0–100) for a career. Looks for role 'Scout' or id 's8'.
 * Falls back to 50 if no scout is on staff.
 * ponytail: linear scan over staff array — typically <15 members, O(n) is fine.
 */
export function getScoutRating(career) {
  const staff = career?.staff || [];
  const scout = staff.find((s) => s.id === 's8') ||
    staff.find((s) => typeof s.role === 'string' && s.role.toLowerCase().includes('scout'));
  return Number(scout?.rating) || 50;
}

/**
 * Stamp trueOverall, scoutedOverall, and scoutConfidence onto every prospect in
 * the pool. Consumes rng() — must be called while the draft rng is seeded.
 *
 * scoutRating 0–100:
 *   <60  → low    (error ±15 → shown as "~65?")
 *   60-79 → medium (error ±5–15 → shown as "~67")
 *   80+   → high   (error ±2–5 → shown as "68")
 */
export function stampScoutingUncertainty(pool, scoutRating = 50) {
  const r = clampVal(Number(scoutRating) || 50, 0, 100);
  // ponytail: formula from spec — errorRange 2–17 inversely scaled to scout rating
  const errorRange = Math.max(2, Math.round(17 - (r / 100) * 15));
  const conf = r >= 80 ? 'high' : r >= 60 ? 'medium' : 'low';
  return pool.map((p) => {
    // Skip if already stamped (idempotent on re-seed)
    if (p.trueOverall != null) return p;
    const trueOverall = Number(p.overall) || 60;
    const error = Math.round((rng() * 2 - 1) * errorRange);
    const scoutedOverall = clampVal(trueOverall + error, 40, 99);
    return { ...p, trueOverall, scoutedOverall, scoutConfidence: conf };
  });
}
