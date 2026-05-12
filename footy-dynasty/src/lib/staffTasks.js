// Staff assignments & bonuses — recruited UX + simulation hooks (club tier staffing).
import { clamp } from './format.js';
import { rng } from './rng.js';

/**
 * @typedef {{
 *   recruitPriorityState: string | null,
 *   matchPrepTier: number,
 *   trainingLeadId: string | null,
 *   scoutLeadId: string | null,
 *   tradeNegotiatorId: string | null,
 * }} StaffTasks
 */

export const DEFAULT_STAFF_TASKS = () => ({
  recruitPriorityState: null,
  matchPrepTier: 0,
  trainingLeadId: null,
  scoutLeadId: null,
  tradeNegotiatorId: null,
});

function normalizeTaskStaffId(staff, id) {
  if (id == null || id === '') return null;
  const s = String(id);
  if (Array.isArray(staff) && staff.length > 0 && !staff.some((m) => m.id === s)) return null;
  return s;
}

/**
 * Normalise staffTasks from a save or partial object.
 * Pass `{ staff, staffTasks }` (e.g. career) to drop assignments when that staff member is gone.
 * Plain `{ staffTasks }` keeps ids even if unseen (legacy callers).
 */
export function ensureStaffTasks(ctx) {
  const d = DEFAULT_STAFF_TASKS();
  if (!ctx || typeof ctx !== 'object') return { ...d };
  const staff = ctx.staff;
  let raw = ctx.staffTasks;
  if (raw == null || typeof raw !== 'object') {
    if (
      'recruitPriorityState' in ctx ||
      'matchPrepTier' in ctx ||
      'trainingLeadId' in ctx ||
      'scoutLeadId' in ctx ||
      'tradeNegotiatorId' in ctx
    ) {
      raw = ctx;
    } else return { ...d };
  }
  return {
    recruitPriorityState:
      raw.recruitPriorityState == null || raw.recruitPriorityState === ''
        ? null
        : String(raw.recruitPriorityState),
    matchPrepTier: [0, 1, 2].includes(Number(raw.matchPrepTier)) ? Number(raw.matchPrepTier) : 0,
    trainingLeadId: normalizeTaskStaffId(staff, raw.trainingLeadId),
    scoutLeadId: normalizeTaskStaffId(staff, raw.scoutLeadId),
    tradeNegotiatorId: normalizeTaskStaffId(staff, raw.tradeNegotiatorId),
  };
}

/** Listed wage ceiling matching worst-case opening demand (legacy cap checkbox). */
export function tradeCapCheckListedWage(player) {
  return Number(player?.wage ?? 0);
}

/**
 * Upper demand bound (same formula family as negotiationDemandWage).
 * Uses assigned trade negotiator when set; otherwise head recruiter (s7).
 */
export function tradeCapCheckMaxDemandWage(player, staff, staffTasks = null) {
  const w = Number(player?.wage ?? 0);
  if (w <= 0) return 0;
  const tasks =
    staffTasks && typeof staffTasks === 'object' ? staffTasks : DEFAULT_STAFF_TASKS();
  const { hi } = negotiationDemandMultiplierRange(staff, tasks);
  return Math.ceil(w * hi);
}

/**
 * Trade ask band — driven by assigned negotiator or head recruiter (s7).
 */
export function negotiationDemandMultiplierRange(staff, staffTasks = null) {
  const tasks =
    staffTasks && typeof staffTasks === 'object' ? staffTasks : DEFAULT_STAFF_TASKS();
  let member =
    tasks.tradeNegotiatorId != null
      ? (staff || []).find((x) => x.id === tasks.tradeNegotiatorId)
      : null;
  if (!member) member = (staff || []).find((x) => x.id === 's7');
  const r = member ? Number(member.rating) || 62 : 52;
  const shrink = r >= 55 ? (Math.min(96, r) - 55) / 220 : 0;
  const lo = Math.max(1.03, 1.05 - shrink * 0.55);
  const hi = Math.max(lo + 0.04, 1.25 - shrink * 0.5);
  return { lo, hi };
}

export function negotiationDemandWage(listedWage, staff, staffTasks = null) {
  const w = Number(listedWage ?? 0);
  if (w <= 0) return 0;
  const tasks =
    staffTasks && typeof staffTasks === 'object' ? staffTasks : DEFAULT_STAFF_TASKS();
  const { lo, hi } = negotiationDemandMultiplierRange(staff, tasks);
  return Math.round(w * (lo + rng() * (hi - lo)));
}

/** Resolve who runs scouting travel / report quality for simulation. */
export function resolveScoutLeadMember(staff, staffTasks = null) {
  const tasks =
    staffTasks && typeof staffTasks === 'object' ? staffTasks : DEFAULT_STAFF_TASKS();
  if (tasks.scoutLeadId != null) {
    const picked = (staff || []).find((x) => x.id === tasks.scoutLeadId);
    if (picked) return picked;
  }
  return (staff || []).find((x) => x.id === 's8') || null;
}

/**
 * Scout accuracy for scoutedOverall — assigned scout lead, else senior scout (s8).
 * Non–s8 leads use a softer curve (e.g. coach doubling as scout at lower tiers).
 */
export function scoutAccuracyBonus(staff, staffTasks = null) {
  const member = resolveScoutLeadMember(staff, staffTasks);
  if (!member) return 0;
  const r = Number(member.rating) || 55;
  if (member.id === 's8') return clamp((r - 48) / 18, 0, 3.2);
  return clamp((r - 52) / 22, 0, 2.35);
}

/** @deprecated Use scoutAccuracyBonus(staff, staffTasks); kept for narrow imports. */
export function seniorScoutAccuracyBonus(staff) {
  return scoutAccuracyBonus(staff, DEFAULT_STAFF_TASKS());
}

/**
 * Extra scout-accuracy bonus on top of scout lead + difficulty (local interstate / priority region).
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
  const lead = resolveScoutLeadMember(staff, staffTasks);
  const r = lead ? Number(lead.rating) || 55 : 45;
  const discount = clamp((r - 48) / 180, 0, 0.32);
  let fee = Math.round(base * (1 - discount));
  const priority = ensureStaffTasks({ staffTasks }).recruitPriorityState;
  if (priority && priority === targetState) fee = Math.round(fee * 0.82);
  return Math.max(6000, fee);
}
