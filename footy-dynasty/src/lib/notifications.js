// ---------------------------------------------------------------------------
// Manager notification feed (the bell). Typed, actionable items that surface in
// the top-bar dropdown: staff wanting to leave/join, players requesting a move,
// rival clubs approaching the coach or poaching staff.
//
// These live alongside the internal advance-gating mirror rows in `career.inbox`
// (board / trade / draft), but are filtered into their own surface by kind.
// ---------------------------------------------------------------------------
import { rng, rand, pick } from './rng.js';
import { FIRST_NAMES, LAST_NAMES } from './playerGen.js';

/** Kinds shown in the notification bell (everything else is an internal mirror). */
export const NOTIFICATION_KINDS = [
  'job_offer',
  'player_transfer_request',
  'staff_leave',
  'volunteer_join',
  'staff_poach',
];

/** Major decisions pause calendar advance until answered; the rest are passive. */
export const BLOCKING_NOTIFICATION_KINDS = ['job_offer', 'player_transfer_request'];

export function isNotificationKind(kind) {
  return NOTIFICATION_KINDS.includes(kind);
}

export function isBlockingNotificationKind(kind) {
  return BLOCKING_NOTIFICATION_KINDS.includes(kind);
}

/** Items the bell should render (excludes resolved + internal mirrors). */
export function notificationItems(career) {
  return (career?.inbox || []).filter((m) => isNotificationKind(m.kind) && !m.resolved);
}

/** Count for the unread badge. */
export function notificationCount(career) {
  return notificationItems(career).length;
}

const pickName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

// --- Builders -------------------------------------------------------------

export function buildStaffLeaveNotice(staff, { poach = false } = {}) {
  return {
    id: `staff_${poach ? 'poach' : 'leave'}_${staff.id}_${rand(1000, 9999)}`,
    kind: poach ? 'staff_poach' : 'staff_leave',
    blocking: false,
    resolved: false,
    title: poach ? 'Staff poaching attempt' : 'Staff wants to move on',
    detail: poach
      ? `A rival club has made ${staff.name} (${staff.role}) an offer. Match it to keep them, or let them go.`
      : `${staff.name} (${staff.role}) is unsettled and may leave. Offer a renewal or let them walk.`,
    payload: { staffId: staff.id, staffName: staff.name, role: staff.role },
    actions: poach
      ? [{ id: 'match', label: 'Match offer' }, { id: 'let_go', label: 'Let go' }]
      : [{ id: 'renew', label: 'Offer renewal' }, { id: 'let_go', label: 'Let go' }],
  };
}

export function buildVolunteerJoinNotice(tier) {
  const name = pickName();
  const roles = tier === 1
    ? ['Analyst (intern)', 'Development coach', 'Recruiting assistant']
    : tier === 2
    ? ['Reserves assistant', 'Strength volunteer', 'Boundary runner']
    : ['Boundary runner (volunteer)', 'Goal umpire / timekeeper', 'Junior development volunteer', 'Trainer (volunteer)'];
  const role = pick(roles);
  const staff = {
    id: `vol_${rand(10000, 99999)}`,
    role,
    name,
    rating: rand(46, 64),
    wage: 0,
    volunteer: true,
    contract: 2,
    loyalty: 1,
  };
  return {
    id: `volunteer_${staff.id}`,
    kind: 'volunteer_join',
    blocking: false,
    resolved: false,
    title: 'Volunteer offer',
    detail: `${name} from around the club wants to help out as ${role}. Bring them on board?`,
    payload: { staff },
    actions: [{ id: 'accept', label: 'Welcome aboard' }, { id: 'decline', label: 'Politely decline' }],
  };
}

export function buildPlayerTransferRequestNotice(player) {
  const name = player.firstName ? `${player.firstName} ${player.lastName}` : (player.name || 'A player');
  return {
    id: `transfer_req_${player.id}`,
    kind: 'player_transfer_request',
    blocking: true,
    resolved: false,
    title: 'Transfer request',
    detail: `${name} (${player.overall} OVR) is unhappy with his role and has asked to be transfer-listed.`,
    payload: { playerId: player.id, playerName: name },
    actions: [{ id: 'approve', label: 'List him' }, { id: 'reject', label: 'Talk him round' }],
  };
}

// --- Off-season generation -------------------------------------------------

/**
 * Build the off-season notification batch for a club. Pure given the seeded RNG.
 * Cadence is deliberately light so the bell doesn't spam.
 */
export function generateOffseasonNotifications(career, tier) {
  const out = [];
  const squad = career.squad || [];
  const staff = career.staff || [];

  // Player transfer request — at most one, from the unhappiest fringe player.
  const unhappy = squad
    .filter((p) => (p.morale ?? 70) < 38 && (p.gamesPlayed ?? 0) < 8)
    .sort((a, b) => (a.morale ?? 70) - (b.morale ?? 70));
  if (unhappy.length > 0 && rng() < 0.6) {
    out.push(buildPlayerTransferRequestNotice(unhappy[0]));
  }

  // Paid staff can be poached (tier 1/2 mostly); volunteers don't get poached.
  const paidStaff = staff.filter((s) => !s.volunteer && (s.wage ?? 0) > 0);
  if (paidStaff.length > 0) {
    const poachChance = tier === 1 ? 0.30 : tier === 2 ? 0.20 : 0.06;
    if (rng() < poachChance) {
      // Better staff are more likely to be targeted.
      const target = [...paidStaff].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
      out.push(buildStaffLeaveNotice(target, { poach: true }));
    } else {
      // Long-serving staff are settled and won't ask to leave unprompted.
      const restless = paidStaff.filter((s) => (s.loyalty ?? 0) < 4);
      if (restless.length > 0 && rng() < 0.12) {
        out.push(buildStaffLeaveNotice(pick(restless), { poach: false }));
      }
    }
  }

  // Volunteers offer to join lower-tier clubs more often.
  const volunteerChance = tier === 3 ? 0.5 : tier === 2 ? 0.25 : 0.1;
  if (rng() < volunteerChance) {
    out.push(buildVolunteerJoinNotice(tier));
  }

  return out;
}
