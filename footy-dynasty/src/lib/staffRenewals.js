// ---------------------------------------------------------------------------
// Staff contract renewals — ticks at season end with player renewals.
// ---------------------------------------------------------------------------
import { pick, rand, rng, seedRng } from './rng.js';
import { FIRST_NAMES, LAST_NAMES } from './playerGen.js';
import { canAffordSigning } from './finance/engine.js';

export function proposeStaffRenewal(staffMember) {
  if (!staffMember || staffMember.contract > 0) return null;
  const volunteer = !!staffMember.volunteer;
  const years = volunteer ? rand(1, 2) : rand(1, 3);
  const wage = staffMember.wage ?? 0;
  const proposedWage = volunteer ? 0 : Math.max(0, Math.round(wage * (1.05 + rng() * 0.12)));
  return {
    staffId: staffMember.id,
    name: staffMember.name,
    role: staffMember.role,
    volunteer,
    currentWage: wage,
    proposedWage,
    proposedYears: years,
  };
}

export function buildStaffRenewalQueue(staffList) {
  return (staffList || [])
    .filter((s) => (s.contract ?? 0) <= 0)
    .map(proposeStaffRenewal)
    .filter(Boolean);
}

export function canAffordStaffRenewal(career, proposal) {
  if (!proposal || proposal.volunteer) return true;
  const wageDelta = (proposal.proposedWage ?? 0) - (proposal.currentWage ?? 0);
  return canAffordSigning(career, wageDelta);
}

export function applyStaffRenewalAccept(career, proposal) {
  if (!proposal) return null;
  return {
    staff: (career.staff || []).map((s) =>
      s.id === proposal.staffId
        ? { ...s, contract: proposal.proposedYears, wage: proposal.proposedWage }
        : s,
    ),
  };
}

/** Roll a replacement like the Staff tab “Replace” action. */
export function rollStaffReplacement(prev, leagueTier, idx) {
  seedRng(Date.now() % 100000 + idx * 17 + (prev.id || '').length);
  const newRating = Math.max(35, Math.min(95, (prev.rating ?? 60) + rand(-8, 14)));
  let newWage;
  if (prev.volunteer) newWage = 0;
  else if (leagueTier === 3 && prev.id === 's1') newWage = Math.round((newRating / 75) * 35000);
  else newWage = Math.round((newRating / 75) * 80000);
  return {
    ...prev,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    rating: newRating,
    wage: newWage,
    volunteer: !!prev.volunteer,
    contract: rand(1, 3),
  };
}

export function applyStaffRenewalReject(career, proposal, leagueTier) {
  if (!proposal) return null;
  const tier = leagueTier ?? 1;
  const idx = (career.staff || []).findIndex((s) => s.id === proposal.staffId);
  if (idx < 0) return { staff: career.staff };
  const prev = career.staff[idx];
  const newStaff = [...career.staff];
  newStaff[idx] = rollStaffReplacement(prev, tier, idx);
  return { staff: newStaff };
}

/** When the season proper begins, unhandled staff renewals auto-hire replacements. */
export function flushUnhandledStaffRenewals(career, leagueTier) {
  const tier = leagueTier ?? 1;
  const queue = career.pendingStaffRenewals || [];
  let staff = [...(career.staff || [])];
  const extraNews = [];
  const week = career.week ?? 0;
  for (const r of queue) {
    if (r._handled) continue;
    const idx = staff.findIndex((s) => s.id === r.staffId);
    if (idx < 0) continue;
    const prev = staff[idx];
    staff[idx] = rollStaffReplacement(prev, tier, idx);
    extraNews.push({
      week,
      type: 'info',
      text: `🤝 ${r.role}: contract window closed — hired ${staff[idx].name} instead.`,
    });
  }
  const pendingStaffRenewals = queue.map((r) =>
    r._handled ? r : { ...r, _handled: 'auto_replaced' },
  );
  return { staff, pendingStaffRenewals, extraNews };
}
