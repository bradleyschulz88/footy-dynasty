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

export function generateStaffMarket(career, league) {
  const tier = league?.tier ?? 3;
  if (tier > 3) return [];

  // Tier 3 community clubs get 1 candidate with a lower rating ceiling (72).
  const maxCandidates = tier <= 2 ? 3 : 1;
  const ratingCap = tier <= 2 ? 95 : 72;

  const coreRoleIds = ['s1', 's2', 's3', 's4', 's5'];
  const upgradeable = coreRoleIds.filter(id => {
    const existing = (career.staff || []).find(s => s.id === id);
    return existing && (existing.rating ?? 60) < (ratingCap - 5);
  });

  if (upgradeable.length === 0) return [];

  return upgradeable.slice(0, maxCandidates).map((id, i) => {
    const current = (career.staff || []).find(s => s.id === id);
    // Use a local deterministic hash rather than reseeding the shared RNG,
    // which would corrupt all downstream randomness in the same finishSeason call.
    // Stateful local PRNG: advance the seed each call so the upgrade amount and
    // the two name indices are independent draws (a stateless Math.sin(h) would
    // return the same value every call, locking names to the rating).
    let seed = ((career.season ?? 1) * 1000 + id.charCodeAt(1) * 37 + i * 13) | 0;
    const localRng = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const upgradeAmount = 6 + Math.floor(localRng() * 15);
    const newRating = Math.min(ratingCap, (current?.rating ?? 60) + upgradeAmount);
    const wageMult = 1 + (newRating - (current?.rating ?? 60)) * 0.025;
    const newWage = Math.round((current?.wage ?? 50_000) * wageMult);
    const fnIdx = Math.floor(localRng() * FIRST_NAMES.length);
    const lnIdx = Math.floor(localRng() * LAST_NAMES.length);
    const name = `${FIRST_NAMES[fnIdx]} ${LAST_NAMES[lnIdx]}`;

    return {
      marketId:      `mkt_${id}_${career.season ?? 1}`,
      staffId:       id,
      name,
      rating:        newRating,
      wage:          newWage,
      contractYears: 2 + Math.round(localRng()),
      signingFee:    Math.round(newWage * 0.4),
      roleLabel:     current?.role ?? id,
      currentRating: current?.rating ?? 60,
    };
  });
}
