// ---------------------------------------------------------------------------
// Sponsor lifecycle — yearly tick, expiry, renewal proposals,
// performance-weighted new offers.
// ---------------------------------------------------------------------------
import { rand, rng, pick } from '../rng.js';
import { getDifficultyConfig } from '../difficulty.js';
import { SPONSOR_RENEWAL } from './constants.js';
import { generateSponsors } from '../defaults.js';

// Decrement yearsLeft on every active sponsor at season end.
// Returns { active, expired } split arrays.
export function tickSponsorYears(sponsors) {
  const next = (sponsors || []).map(s => ({ ...s, yearsLeft: (s.yearsLeft ?? 1) - 1 }));
  return {
    active:  next.filter(s => s.yearsLeft > 0),
    expired: next.filter(s => s.yearsLeft <= 0),
  };
}

// Estimate club performance for sponsor logic.
// Returns one of: 'contending' | 'average' | 'losing'.
function performanceTier(career) {
  const ladder = (career.ladder || []).slice().sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
  const idx = ladder.findIndex(r => r.id === career.clubId);
  if (idx < 0 || ladder.length === 0) return 'average';
  const pct = idx / Math.max(1, ladder.length - 1);
  if (pct <= 0.30) return 'contending';
  if (pct >= 0.70) return 'losing';
  return 'average';
}

// Build a renewal proposal for a sponsor that's expiring at season end.
// Multipliers driven by current performance + difficulty.
export function proposalForRenewal(sponsor, career) {
  const cfg = getDifficultyConfig(career.difficulty);
  const perf = performanceTier(career);
  const range = perf === 'contending' ? SPONSOR_RENEWAL.contendingBump
              : perf === 'losing'      ? SPONSOR_RENEWAL.losingDiscount
              :                          SPONSOR_RENEWAL.averageBump;
  const valueMult = range[0] + rng() * (range[1] - range[0]);
  const proposedValue = Math.round((sponsor.annualValue ?? 0) * valueMult * (cfg.sponsorMultiplier ?? 1.0));
  const proposedYears = perf === 'contending' ? rand(2, 4) : perf === 'losing' ? 1 : rand(1, 3);
  return {
    sponsorId:    sponsor.id,
    name:         sponsor.name,
    category:     sponsor.category,
    currentValue: sponsor.annualValue,
    proposedValue,
    proposedYears,
    valueMult,
    perf,
  };
}

// Build a fresh round of sponsor offers for clubs that need to backfill expired
// deals. Performance + reputation-weighted.
export function generateSponsorOffers(career, leagueTier, count = 3) {
  const cfg = getDifficultyConfig(career.difficulty);
  const perf = performanceTier(career);
  // Reputation also nudges valuation
  const repMult = (career.coachReputation ?? 30) >= 60 ? 1.10
                : (career.coachReputation ?? 30) >= 40 ? 1.00
                : 0.92;
  const perfMult = perf === 'contending' ? 1.10 : perf === 'losing' ? 0.85 : 1.0;
  const raw = generateSponsors(leagueTier);
  const offers = raw.slice(0, count).map(s => ({
    ...s,
    annualValue: Math.round(s.annualValue * (cfg.sponsorMultiplier ?? 1.0) * repMult * perfMult),
    offerKind: 'new',
    offerId:  `offer_${s.id}`,
  }));
  return offers;
}

// Startup/offers when the club has no signed sponsors yet (career creation, new job).
export function buildInitialSponsorOffers(args) {
  const { leagueTier, difficulty, clubId, ladder, coachReputation = 30 } = args;
  const stub = {
    difficulty: difficulty || 'contender',
    clubId: clubId || '',
    ladder: ladder || [],
    coachReputation,
  };
  return generateSponsorOffers(stub, leagueTier, 4);
}

// Auto-accept a renewal proposal — applies the new annualValue + years.
export function applyRenewalAcceptance(career, proposal) {
  return {
    sponsors: (career.sponsors || []).map(s =>
      s.id === proposal.sponsorId
        ? { ...s, annualValue: proposal.proposedValue, yearsLeft: (s.yearsLeft ?? 0) + proposal.proposedYears }
        : s,
    ),
  };
}

// Decline a renewal — sponsor expires.
export function applyRenewalDecline(career, proposal) {
  return {
    sponsors: (career.sponsors || []).filter(s => s.id !== proposal.sponsorId),
  };
}

// Add a brand-new sponsor offer to the active list.
export function applySponsorOfferAcceptance(career, offer) {
  // Strip the "offer*" fields; persist as a real sponsor.
  const { offerKind, offerId, ...sponsor } = offer;
  return { sponsors: [...(career.sponsors || []), sponsor] };
}
