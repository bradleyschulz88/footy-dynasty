// ---------------------------------------------------------------------------
// Sponsor lifecycle — yearly tick, expiry, renewal proposals,
// performance-weighted new offers.
// ---------------------------------------------------------------------------
import { rand, rng } from '../rng.js';
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
// deals. Performance + reputation-weighted. Losing clubs receive fewer and lower offers.
export function generateSponsorOffers(career, leagueTier, count = 3) {
  const cfg = getDifficultyConfig(career.difficulty);
  const perf = performanceTier(career);
  // Performance shifts both offer count and value
  const adjustedCount = perf === 'contending' ? count + 1
                      : perf === 'losing'     ? Math.max(1, count - 2)
                      : count;
  const repMult = (career.coachReputation ?? 30) >= 60 ? 1.10
                : (career.coachReputation ?? 30) >= 40 ? 1.00
                : 0.92;
  const perfMult = perf === 'contending' ? 1.15 : perf === 'losing' ? 0.72 : 1.0;
  const raw = generateSponsors(leagueTier);
  return raw.slice(0, adjustedCount).map(s => ({
    ...s,
    annualValue: Math.round(s.annualValue * (cfg.sponsorMultiplier ?? 1.0) * repMult * perfMult),
    offerKind: 'new',
    offerId:  `offer_${s.id}`,
  }));
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

// Sponsors a club already has on the books at career start.
// A new club isn't flooded with lucrative offers — it starts with a modest base
// of signed deals (one of which is up for renewal so it surfaces immediately),
// and earns further interest as the club's reputation and results grow.
export function buildStartingSponsors(leagueTier) {
  const t = leagueTier === 1 ? 1 : leagueTier === 2 ? 2 : 3;
  const count = t === 1 ? 3 : t === 2 ? 2 : 1;
  const signed = generateSponsors(t).slice(0, count);
  if (signed.length === 0) return signed;
  // The first deal is expiring — it "wants to renew" on the first end-of-season tick.
  return signed.map((s, i) => ({
    ...s,
    yearsLeft: i === 0 ? 1 : Math.max(2, s.yearsLeft ?? 2),
    type: s.type || 'Community',
  }));
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
  const { offerKind: _offerKind, offerId: _offerId, ...sponsor } = offer;
  return { sponsors: [...(career.sponsors || []), sponsor] };
}

// ---------------------------------------------------------------------------
// Interactive negotiation — Accept / Counter / Decline + performance clauses.
// Offer/sponsor objects use `annualValue` as the headline figure (see
// generateSponsors in defaults.js); we read that, falling back to common
// aliases for safety.
// ---------------------------------------------------------------------------

// Pull the base annual figure from an offer/sponsor regardless of field name.
function offerBaseValue(offer) {
  return offer?.annualValue ?? offer?.value ?? offer?.amount ?? 0;
}

// Probability the sponsor accepts a counter-offer at `counterValue`.
// 1.0× base = certain; 1.5× base or higher = they walk; linear in between.
export function sponsorCounterAcceptChance(offer, counterValue) {
  const base = offerBaseValue(offer);
  if (base <= 0) return 0;
  const ratio = counterValue / base;
  if (ratio <= 1.0) return 1.0;
  if (ratio >= 1.5) return 0;
  return 1 - (ratio - 1.0) / 0.5;
}

/**
 * Evaluate a counter-offer on a sponsor deal.
 * @returns {{ accepted: boolean, finalValue: number, note: string }}
 */
export function evaluateSponsorCounter(offer, counterValue) {
  const base = offerBaseValue(offer);
  if (base <= 0) return { accepted: false, finalValue: base, note: 'No base value to negotiate.' };
  const acceptChance = sponsorCounterAcceptChance(offer, counterValue);
  const roll = Math.random();
  const accepted = roll < acceptChance;
  return accepted
    ? { accepted: true, finalValue: Math.round(counterValue), note: 'Sponsor agreed to your terms.' }
    : { accepted: false, finalValue: base, note: 'Sponsor walked away from the table.' };
}

/**
 * A performance-clause variant: lower guaranteed base, bonus on success.
 * The bonus pays out when the club finishes/sits top-4 (see annualSponsorIncome
 * in engine.js, which applies it when career ladder position <= 4).
 * @returns {{ base: number, bonus: number, clause: string }}
 */
export function sponsorClauseTerms(offer) {
  const base = offerBaseValue(offer);
  return {
    base: Math.round(base * 0.8),       // 20% less guaranteed
    bonus: Math.round(base * 0.5),      // 50% bonus if clause met
    clause: 'top4',                      // pays out if club finishes top 4
  };
}

/**
 * Bonus a single sponsor contributes this period given the current ladder.
 * Pure helper used by annualSponsorIncome — returns 0 unless the sponsor holds
 * a met performance clause. `ladderPos` is 1-indexed (1 = top of the table).
 */
export function sponsorClausePayout(sponsor, ladderPos) {
  if (!sponsor?.clause || !sponsor?.bonus) return 0;
  if (sponsor.clause === 'top4') {
    return ladderPos != null && ladderPos <= 4 ? sponsor.bonus : 0;
  }
  return 0;
}
