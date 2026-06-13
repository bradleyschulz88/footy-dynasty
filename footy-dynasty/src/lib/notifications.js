// ---------------------------------------------------------------------------
// Manager notification feed (the bell). Typed, actionable items that surface in
// the top-bar dropdown: staff wanting to leave/join, players requesting a move,
// rival clubs approaching the coach or poaching staff.
//
// These live alongside the internal advance-gating mirror rows in `career.inbox`
// (board / trade / draft), but are filtered into their own surface by kind.
// ---------------------------------------------------------------------------
import { rng, rand, pick } from './rng.js';
import { FIRST_NAMES, LAST_NAMES, generatePlayer } from './playerGen.js';

/** Kinds shown in the notification bell (everything else is an internal mirror). */
export const NOTIFICATION_KINDS = [
  'job_offer',
  'player_transfer_request',
  'staff_leave',
  'volunteer_join',
  'staff_poach',
  'player_join',   // tier 3 — a local player / recommendation wants to sign
  'player_leave',  // tier 3 — a player is thinking of moving on
];

/** Major decisions pause calendar advance until answered; the rest are passive. */
export const BLOCKING_NOTIFICATION_KINDS = ['job_offer', 'player_transfer_request'];

export function isNotificationKind(kind) {
  return NOTIFICATION_KINDS.includes(kind);
}

export function isBlockingNotificationKind(kind) {
  return BLOCKING_NOTIFICATION_KINDS.includes(kind);
}

/** Items the bell should render (excludes resolved + internal mirrors). Blocking first. */
export function notificationItems(career) {
  return (career?.inbox || [])
    .filter((m) => isNotificationKind(m.kind) && !m.resolved)
    .sort((a, b) => (b.blocking ? 1 : 0) - (a.blocking ? 1 : 0));
}

/** Count for the unread badge. */
export function notificationCount(career) {
  return notificationItems(career).length;
}

/** True when at least one pending notification gates calendar advance. */
export function hasBlockingNotification(career) {
  return notificationItems(career).some((m) => m.blocking);
}

/** Already-actioned notifications, newest first — the bell's "Recently handled" trail. */
export function recentlyHandledNotifications(career, limit = 6) {
  return (career?.inbox || [])
    .filter((m) => isNotificationKind(m.kind) && m.resolved)
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
    .slice(0, limit);
}

/** Prune resolved notification rows so the inbox can't grow without bound. */
export function pruneHandledNotifications(inbox, keep = 15) {
  const list = inbox || [];
  const handled = list
    .filter((m) => isNotificationKind(m.kind) && m.resolved)
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));
  const keepIds = new Set(handled.slice(0, keep).map((m) => m.id));
  return list.filter((m) => !(isNotificationKind(m.kind) && m.resolved) || keepIds.has(m.id));
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
      ? `A rival club has made ${staff.name} (${staff.role}${staff.rating ? `, rated ${staff.rating}` : ''}) an offer. Match it to keep them, or let them go.`
      : `${staff.name} (${staff.role}${staff.rating ? `, rated ${staff.rating}` : ''}) is unsettled and may leave. Offer a renewal or let them walk.`,
    payload: { staffId: staff.id, staffName: staff.name, role: staff.role, rating: staff.rating },
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
    detail: `${name} from around the club wants to help out as ${role} (rated ${staff.rating}). Bring them on board?`,
    payload: { staff, rating: staff.rating, role },
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

// Tier-3 recruitment: a local player wants in — sometimes a walk-up, sometimes
// recommended by someone already at the club. Community terms (cheap).
export function buildPlayerJoinNotice(tier, { recommenderName } = {}) {
  const base = generatePlayer(3, rand(1000, 9999));
  const player = { ...base, wage: rand(2, 12) * 1000, contract: 2, seasonsAtClub: 0 };
  const name = `${player.firstName} ${player.lastName}`;
  return {
    id: `player_join_${player.id}`,
    kind: 'player_join',
    blocking: false,
    resolved: false,
    title: recommenderName ? 'Player recommendation' : 'Player wants to join',
    detail: recommenderName
      ? `${recommenderName} reckons his mate ${name} (${player.overall} OVR ${player.position}) is worth a run. Sign him on?`
      : `${name} (${player.overall} OVR ${player.position}) has been training with the group and wants to join. Sign him on?`,
    payload: { player, rating: player.overall },
    actions: [{ id: 'sign', label: 'Sign him' }, { id: 'decline', label: 'Not now' }],
  };
}

// Tier-3 departure: a player is thinking of moving on (no transfer fees here —
// they can just walk). You can try to talk them round.
export function buildPlayerDepartureNotice(player) {
  const name = player.firstName ? `${player.firstName} ${player.lastName}` : (player.name || 'A player');
  return {
    id: `player_leave_${player.id}_${rand(1000, 9999)}`,
    kind: 'player_leave',
    blocking: false,
    resolved: false,
    title: 'Player thinking of leaving',
    detail: `${name} (${player.overall} OVR) is weighing up walking away from the club. Have a word, or let him go.`,
    payload: { playerId: player.id, playerName: name, rating: player.overall },
    actions: [{ id: 'convince', label: 'Talk him round' }, { id: 'let_go', label: 'Let him go' }],
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

  // Tier 3 has no trade market — players arrive (and leave) by word of mouth.
  if (tier === 3) {
    if (rng() < 0.55) {
      const recommender = squad.length && rng() < 0.6 ? pick(squad) : null;
      out.push(buildPlayerJoinNotice(tier, {
        recommenderName: recommender ? `${recommender.firstName ?? ''} ${recommender.lastName ?? ''}`.trim() || null : null,
      }));
    }
    const leavers = squad.filter((p) => (p.age ?? 25) >= 30 || (p.morale ?? 70) < 45);
    if (leavers.length > 0 && rng() < 0.35) {
      out.push(buildPlayerDepartureNotice(pick(leavers)));
    }
  }

  return out;
}
