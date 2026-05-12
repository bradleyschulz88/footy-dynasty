// Staff assignments & bonuses — recruited UX + simulation hooks (club tier staffing).
import { clamp } from './format.js';
import { rng } from './rng.js';

/** @typedef {{ recruitPriorityState: string | null, matchPrepTier: number, trainingLeadId: string | null }} StaffTasks */

export const DEFAULT_STAFF_TASKS = () => ({
  recruitPriorityState: null,
  matchPrepTier: 0,
  trainingLeadId: null,
});

export function ensureStaffTasks(career) {
  const d = DEFAULT_STAFF_TASKS();
  const t = career?.staffTasks;
  if (!t || typeof t !== 'object') return { ...d };
  return {
    recruitPriorityState: t.recruitPriorityState == null || t.recruitPriorityState === '' ? null : String(t.recruitPriorityState),
    matchPrepTier: [0, 1, 2].includes(Number(t.matchPrepTier)) ? Number(t.matchPrepTier) : 0,
    trainingLeadId: t.trainingLeadId == null || t.trainingLeadId === '' ? null : String(t.trainingLeadId),
  };
}

/** Listed wage ceiling matching worst-case opening demand (legacy cap checkbox). */
export function tradeCapCheckListedWage(player) {
  return Number(player?.wage ?? 0);
}

/** Upper demand bound (same formula family as negotiationDemandWage). */
export function tradeCapCheckMaxDemandWage(player, staff) {
  const w = Number(player?.wage ?? 0);
  if (w <= 0) return 0;
  const { hi } = negotiationDemandMultiplierRange(staff);
  return Math.ceil(w * hi);
}

/**
 * Recruiter (s7) tightens the multiplier band — less aggressive asks on average.
 * Returns { lo, hi } multipliers applied to listed wage.
 */
export function negotiationDemandMultiplierRange(staff) {
  const s7 = (staff || []).find((x) => x.id === 's7');
  const r = s7 ? Number(s7.rating) || 62 : 52;
  const shrink = r >= 55 ? (Math.min(96, r) - 55) / 220 : 0;
  const lo = Math.max(1.03, 1.05 - shrink * 0.55);
  const hi = Math.max(lo + 0.04, 1.25 - shrink * 0.5);
  return { lo, hi };
}

export function negotiationDemandWage(listedWage, staff) {
  const w = Number(listedWage ?? 0);
  if (w <= 0) return 0;
  const { lo, hi } = negotiationDemandMultiplierRange(staff);
  return Math.round(w * (lo + rng() * (hi - lo)));
}

/** Senior scout (s8) improves scout accuracy (passed into scoutedOverall noise reduction). */
export function seniorScoutAccuracyBonus(staff) {
  const s = (staff || []).find((x) => x.id === 's8');
  if (!s) return 0;
  const r = Number(s.rating) || 55;
  return clamp((r - 48) / 18, 0, 3.2);
}

/**
 * Extra scout-accuracy bonus on top of senior scout + difficulty (local interstate / priority region).
 */
export function recruitFocusIncrementalBonus(staffTasks, opts = {}) {
  const priority = ensureStaffTasks({ staffTasks }).recruitPriorityState;
  let bonus = 0;
  if (opts.interstate) bonus += 0.48;
  if (opts.leagueState && priority && opts.leagueState === priority) bonus += 0.38;
  return clamp(bonus, 0, 1.1);
}

/** Medical officer (s6) stacks with facility medical — soft-tissue mitigation. */
export function medicalStaffMitigation(staff) {
  const m = (staff || []).find((s) => s.id === 's6');
  if (!m) return { probReduce: 0, weekReduce: 0 };
  const r = Number(m.rating) || 55;
  let probReduce = 0;
  let weekReduce = 0;
  if (r >= 78) {
    probReduce = 0.004;
    weekReduce = 1;
  } else if (r >= 65) {
    probReduce = 0.0025;
    weekReduce = 1;
  } else if (r >= 52) {
    probReduce = 0.001;
    weekReduce = 0;
  }
  return { probReduce, weekReduce };
}

export const INTERSTATE_SCOUT_BASE_FEE = 28_000;

export function interstateScoutFee(staff, staffTasks, targetState, homeState) {
  if (!targetState || targetState === homeState) return 0;
  const base = INTERSTATE_SCOUT_BASE_FEE;
  const s8 = (staff || []).find((x) => x.id === 's8');
  const r = s8 ? Number(s8.rating) || 55 : 45;
  const discount = clamp((r - 48) / 180, 0, 0.32);
  let fee = Math.round(base * (1 - discount));
  const priority = ensureStaffTasks({ staffTasks }).recruitPriorityState;
  if (priority && priority === targetState) fee = Math.round(fee * 0.82);
  return Math.max(6000, fee);
}
