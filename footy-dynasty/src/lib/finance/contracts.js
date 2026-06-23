// ---------------------------------------------------------------------------
// Player contract renewals — at season end, players with contract === 1 enter
// the renewal queue. Demand scales with age and form.
// ---------------------------------------------------------------------------
import { rng, rand, seedRng, SEED } from '../rng.js';
import { RENEWAL_AGE_CURVE, formRenewalMultiplier } from './constants.js';
import { canAffordSigning } from './engine.js';

// Identify which age band a player falls into.
function ageBand(age) {
  if (age <= 22) return 'young';
  if (age <= 28) return 'prime';
  if (age <= 32) return 'vet';
  return 'twilight';
}

/** Deterministic seed for in-season extension offers (stable until season/week changes). */
export function renewalExtensionStableKey(career, playerId) {
  const season = career?.season ?? 2026;
  const week = career?.week ?? 0;
  const pid = String(playerId ?? '');
  let h = 2166136261;
  for (const ch of `${pid}|${season}|${week}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildProposalFromCurrentRng(player) {
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

/**
 * Build a renewal proposal for a single player. Pure function — does not mutate.
 * Pass `{ stableKey }` (e.g. from renewalExtensionStableKey) so UI extensions don’t
 * re-roll on every click; omit for EOS queue randomness.
 */
export function proposeRenewal(player, options = {}) {
  if (!player) return null;
  const sk = options.stableKey;
  if (sk != null && sk !== '') {
    const prev = SEED;
    seedRng(Number(sk) >>> 0);
    const out = buildProposalFromCurrentRng(player);
    seedRng(prev);
    return out;
  }
  return buildProposalFromCurrentRng(player);
}

// Build the renewal queue for the whole squad at season end.
// tier 1: all expiring players get formal offers.
// tier 2: top 12 by overall rating get formal offers; rest auto-renew (see buildAutoRenewList).
// tier 3: top 6 by overall rating get formal offers; rest auto-renew.
export function buildRenewalQueue(career, opts = {}) {
  const tier = opts.tier ?? 1;
  // Tier 4 junior clubs have no player contracts — kids play on registration, not agreements.
  if (tier === 4) return [];
  const expiring = (career.squad || []).filter(p => (p.contract ?? 0) <= 1);
  if (tier === 1) return expiring.map(p => proposeRenewal(p)).filter(Boolean);
  const sorted = [...expiring].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const formalCap = tier === 2 ? 12 : 6;
  return sorted.slice(0, formalCap).map(p => proposeRenewal(p)).filter(Boolean);
}

// Players who bypass the formal renewal queue at tier 2/3 and auto-renew at current terms.
// Returns raw player objects (not proposals). Empty array for tier 1 and tier 4.
export function buildAutoRenewList(career, opts = {}) {
  const tier = opts.tier ?? 1;
  if (tier === 1 || tier === 4) return [];
  const expiring = (career.squad || []).filter(p => (p.contract ?? 0) <= 1);
  const sorted = [...expiring].sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));
  const formalCap = tier === 2 ? 12 : 6;
  return sorted.slice(formalCap);
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
