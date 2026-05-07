// ---------------------------------------------------------------------------
// Player contract renewals — at season end, players with contract === 1 enter
// the renewal queue. Demand scales with age and form.
// ---------------------------------------------------------------------------
import { rng, rand } from '../rng.js';
import { RENEWAL_AGE_CURVE, formRenewalMultiplier } from './constants.js';
import { canAffordSigning } from './engine.js';

// Identify which age band a player falls into.
function ageBand(age) {
  if (age <= 22) return 'young';
  if (age <= 28) return 'prime';
  if (age <= 32) return 'vet';
  return 'twilight';
}

// Build a renewal proposal for a single player. Pure function — does not mutate.
export function proposeRenewal(player) {
  if (!player) return null;
  const band = ageBand(player.age ?? 24);
  const curve = RENEWAL_AGE_CURVE[band];
  const baseMult = curve.wageMult[0] + rng() * (curve.wageMult[1] - curve.wageMult[0]);
  const formMult = formRenewalMultiplier(player.form ?? 70);
  const wage = Math.round((player.wage ?? 100_000) * baseMult * formMult);
  const years = rand(curve.yearsRange[0], curve.yearsRange[1]);
  return {
    playerId: player.id,
    name:     `${player.firstName ?? ''} ${player.lastName ?? player.name ?? ''}`.trim(),
    age:      player.age,
    position: player.position,
    overall:  player.overall,
    currentWage:    player.wage,
    proposedWage:   wage,
    proposedYears:  years,
    band, formMult,
  };
}

// Build the renewal queue for the whole squad at season end.
// Players with contract <= 1 (will expire next season) get a proposal.
export function buildRenewalQueue(career) {
  return (career.squad || [])
    .filter(p => (p.contract ?? 0) <= 1)
    .map(proposeRenewal)
    .filter(Boolean);
}

// Accept a renewal — extends the player's contract + sets new wage.
// Returns a partial career patch (squad). Caller must check canAffordSigning.
export function applyRenewal(career, proposal) {
  if (!proposal) return null;
  return {
    squad: (career.squad || []).map(p =>
      p.id === proposal.playerId
        ? { ...p, wage: proposal.proposedWage, contract: (p.contract ?? 0) + proposal.proposedYears }
        : p,
    ),
  };
}

// Reject a renewal — player walks at the end of the season.
// We mark them with `_walking = true`; finishSeason handles removal + news.
export function applyRenewalRejection(career, proposal) {
  return {
    squad: (career.squad || []).map(p =>
      p.id === proposal.playerId ? { ...p, _walking: true } : p,
    ),
  };
}

// Whether the club can afford a renewal under the salary cap (+capOverflow).
export function canAffordRenewal(career, proposal) {
  const player = (career.squad || []).find(p => p.id === proposal?.playerId);
  if (!player) return false;
  const wageDelta = (proposal.proposedWage ?? 0) - (player.wage ?? 0);
  return canAffordSigning(career, wageDelta);
}
