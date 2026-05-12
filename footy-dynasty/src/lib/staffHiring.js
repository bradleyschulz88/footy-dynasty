// Hiring professionals & community volunteers onto career.staff.
import { rand, seedRng, pick } from './rng.js';
import { FIRST_NAMES, LAST_NAMES } from './playerGen.js';
import { leagueTierOf } from './finance/engine.js';
import {
  STAFF_BLUEPRINT,
  EXPANDABLE_ROLE_IDS_BY_TIER,
  buildProfessionalStaffMember,
} from './defaults.js';
import { bumpCommitteeMood } from './community.js';

export const MAX_STAFF_ROWS = 22;

const PRO_HIRE_NEWS_CLOSERS = [
  'Paperwork filed.',
  'Desk sorted for Monday.',
  'Board quietly approved the basics.',
  'Welcome pack sent.',
  'Parking pass is in the mail.',
  'IT login provisioning queued.',
];

const VOLUNTEER_NEWS_CLOSERS = [
  'Committee noted the boost.',
  'Canteen roster just got easier.',
  'Match-day crew appreciates it.',
  'Signed on for community rates.',
  'Will wear the hi-vis with pride.',
];

/** Extra helpers — not blueprint ids; fine for staffTasks / flavour (training still keys s2–s5). */
export const VOLUNTEER_ROLE_TEMPLATES = [
  { role: 'Stats runner', rating: [46, 62] },
  { role: 'Goal-umpire assistant', rating: [44, 58] },
  { role: 'Match-day canteen lead', rating: [42, 56] },
  { role: 'Boundary / runner helper', rating: [48, 64] },
  { role: 'Junior clinic helper', rating: [50, 68] },
  { role: 'Ground setup crew', rating: [40, 55] },
];

export function professionalSigningFee(leagueTier, blueprintId) {
  const tier = leagueTier === 2 ? 2 : leagueTier === 3 ? 3 : 1;
  const base = tier === 1 ? 42_000 : tier === 2 ? 18_000 : 7500;
  const weight =
    blueprintId === 's10' || blueprintId === 's9'
      ? 0.88
      : blueprintId === 's8' || blueprintId === 's7'
        ? 1.05
        : blueprintId === 's3'
          ? 0.95
          : 1;
  return Math.round(base * weight);
}

/** Annual wage band for UI (deterministic — uses blueprint wage × tier scale). */
export function previewExpansionAnnualWage(leagueTier, blueprintId) {
  const b = STAFF_BLUEPRINT.find((x) => x.id === blueprintId);
  if (!b) return 0;
  const t = leagueTier === 2 ? 2 : leagueTier === 3 ? 3 : 1;
  const mult = t === 1 ? 1 : t === 2 ? 0.25 : 0.05;
  return Math.round(b.wage * mult);
}

export function listExpandableHires(career) {
  const tier = leagueTierOf(career);
  const pool = EXPANDABLE_ROLE_IDS_BY_TIER[tier] || [];
  const have = new Set((career.staff || []).map((s) => s.id));
  return pool.filter((id) => !have.has(id));
}

export function hireBlueprintStaff(career, blueprintId, nowMs = Date.now()) {
  const tier = leagueTierOf(career);
  const expandable = EXPANDABLE_ROLE_IDS_BY_TIER[tier] || [];
  if (!expandable.includes(blueprintId)) return { ok: false, reason: 'not_offered_at_tier' };
  if ((career.staff || []).some((s) => s.id === blueprintId)) return { ok: false, reason: 'already_employed' };
  if ((career.staff || []).length >= MAX_STAFF_ROWS) return { ok: false, reason: 'roster_full' };
  const fee = professionalSigningFee(tier, blueprintId);
  const cash = career.finance?.cash ?? 0;
  if (cash < fee) return { ok: false, reason: 'insufficient_cash' };
  seedRng((nowMs % 99_991) + blueprintId.charCodeAt(1) * 17);
  const member = buildProfessionalStaffMember(blueprintId, tier, { expansionHire: true });
  if (!member) return { ok: false, reason: 'unknown_role' };
  return {
    ok: true,
    staff: [...(career.staff || []), member],
    finance: { ...career.finance, cash: cash - fee },
    fee,
    newsLine: `📋 Signed ${member.role}: ${member.name} (${member.rating} OVR) — ${fmtFeeNews(fee)} signing fee. ${pick(PRO_HIRE_NEWS_CLOSERS)}`,
  };
}

function fmtFeeNews(fee) {
  if (fee >= 1000) return `$${Math.round(fee / 1000)}k`;
  return `$${fee}`;
}

export function buildVolunteerStaffMember(templateIndex, nowMs = Date.now()) {
  const tpl = VOLUNTEER_ROLE_TEMPLATES[templateIndex % VOLUNTEER_ROLE_TEMPLATES.length];
  seedRng((nowMs % 88_883) + templateIndex * 31);
  const id = `vol_${nowMs}_${rand(1000, 9999)}`;
  const role =
    tpl.role.toLowerCase().includes('volunteer')
      ? tpl.role
      : `${tpl.role} (volunteer)`;
  return {
    id,
    role,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    rating: rand(tpl.rating[0], tpl.rating[1]),
    wage: 0,
    volunteer: true,
    contract: rand(1, 3),
  };
}

export function recruitVolunteerStaff(career, templateIndex, nowMs = Date.now()) {
  if ((career.staff || []).length >= MAX_STAFF_ROWS) return { ok: false, reason: 'roster_full' };
  const member = buildVolunteerStaffMember(templateIndex, nowMs);
  let committee = career.committee;
  if (Array.isArray(committee) && committee.length > 0) {
    committee = bumpCommitteeMood(committee, 'Social Coordinator', 2);
    committee = bumpCommitteeMood(committee, 'Head Trainer', 1);
  }
  return {
    ok: true,
    staff: [...(career.staff || []), member],
    committee,
    newsLine: `🙌 Volunteer: ${member.name} — ${member.role}. ${pick(VOLUNTEER_NEWS_CLOSERS)}`,
  };
}

/** Random template — still deterministic seed from clock for variety. */
export function recruitRandomVolunteerStaff(career, nowMs = Date.now()) {
  seedRng((nowMs % 77_777) + (career.staff?.length ?? 0));
  const idx = rand(0, VOLUNTEER_ROLE_TEMPLATES.length - 1);
  return recruitVolunteerStaff(career, idx, nowMs + 1);
}
