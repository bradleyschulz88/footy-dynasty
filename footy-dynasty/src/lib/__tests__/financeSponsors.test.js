import { describe, it, expect, beforeEach } from 'vitest';
import {
  tickSponsorYears, proposalForRenewal, generateSponsorOffers,
  applyRenewalAcceptance, applyRenewalDecline, applySponsorOfferAcceptance,
  buildInitialSponsorOffers, buildStartingSponsors,
} from '../finance/sponsors.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(7));

describe('tickSponsorYears', () => {
  it('decrements every sponsor by 1 and partitions active vs expired', () => {
    const sponsors = [
      { id: 'a', yearsLeft: 3 },
      { id: 'b', yearsLeft: 1 },
      { id: 'c', yearsLeft: 0 },
    ];
    const out = tickSponsorYears(sponsors);
    expect(out.active.find(s => s.id === 'a').yearsLeft).toBe(2);
    expect(out.expired.map(s => s.id).sort()).toEqual(['b', 'c']);
  });

  it('handles null/undefined input safely', () => {
    expect(tickSponsorYears(null)).toEqual({ active: [], expired: [] });
    expect(tickSponsorYears(undefined)).toEqual({ active: [], expired: [] });
  });
});

describe('proposalForRenewal', () => {
  it('contending club gets an upward bump', () => {
    const career = {
      difficulty: 'contender',
      clubId: 'col',
      ladder: [{ id: 'col', pts: 30 }, { id: 'a', pts: 20 }, { id: 'b', pts: 15 }],
    };
    const sponsor = { id: 'sp', name: 'Brand', annualValue: 100_000 };
    const proposal = proposalForRenewal(sponsor, career);
    expect(proposal.proposedValue).toBeGreaterThan(sponsor.annualValue);
    expect(proposal.perf).toBe('contending');
  });

  it('losing club gets a discount', () => {
    const career = {
      difficulty: 'contender',
      clubId: 'col',
      ladder: [{ id: 'a', pts: 30 }, { id: 'b', pts: 25 }, { id: 'c', pts: 20 }, { id: 'col', pts: 10 }],
    };
    const sponsor = { id: 'sp', name: 'Brand', annualValue: 100_000 };
    const proposal = proposalForRenewal(sponsor, career);
    expect(proposal.proposedValue).toBeLessThan(sponsor.annualValue);
    expect(proposal.perf).toBe('losing');
  });
});

describe('generateSponsorOffers', () => {
  it('returns the requested count of new offers tagged with offerKind: new', () => {
    const career = {
      difficulty: 'contender',
      clubId: 'col',
      ladder: [{ id: 'col', pts: 30 }],
      coachReputation: 50,
    };
    const offers = generateSponsorOffers(career, 1, 3);
    expect(offers.length).toBeGreaterThan(0);
    offers.forEach(o => expect(o.offerKind).toBe('new'));
  });
});

describe('buildInitialSponsorOffers', () => {
  it('returns several new offers for a clean-slate club with no ladder history', () => {
    const offers = buildInitialSponsorOffers({
      leagueTier: 2,
      difficulty: 'contender',
      clubId: 'sanfl_norwood',
      ladder: [],
      coachReputation: 30,
    });
    expect(offers.length).toBeGreaterThanOrEqual(3);
    expect(offers.every(o => o.offerKind === 'new')).toBe(true);
  });
});

describe('buildStartingSponsors', () => {
  it('a tier-3 club starts with a single signed sponsor', () => {
    expect(buildStartingSponsors(3)).toHaveLength(1);
  });
  it('tier 2 starts with two, tier 1 with three', () => {
    expect(buildStartingSponsors(2)).toHaveLength(2);
    expect(buildStartingSponsors(1)).toHaveLength(3);
  });
  it('the first sponsor is up for renewal (yearsLeft === 1)', () => {
    expect(buildStartingSponsors(3)[0].yearsLeft).toBe(1);
  });
  it('every starting sponsor has a positive annual value', () => {
    for (const tier of [1, 2, 3]) {
      for (const s of buildStartingSponsors(tier)) expect(s.annualValue).toBeGreaterThan(0);
    }
  });
});

describe('applyRenewalAcceptance / Decline / OfferAcceptance', () => {
  it('accepting a renewal updates the sponsor in-place', () => {
    const career = { sponsors: [{ id: 's1', annualValue: 100_000, yearsLeft: 1 }] };
    const proposal = { sponsorId: 's1', proposedValue: 130_000, proposedYears: 3 };
    const patch = applyRenewalAcceptance(career, proposal);
    expect(patch.sponsors[0].annualValue).toBe(130_000);
    expect(patch.sponsors[0].yearsLeft).toBe(4);
  });

  it('declining a renewal removes the sponsor', () => {
    const career = { sponsors: [{ id: 's1' }, { id: 's2' }] };
    const patch = applyRenewalDecline(career, { sponsorId: 's1' });
    expect(patch.sponsors.map(s => s.id)).toEqual(['s2']);
  });

  it('accepting a new offer appends it to the active sponsors and strips offer fields', () => {
    const career = { sponsors: [{ id: 's1' }] };
    const offer = { offerKind: 'new', offerId: 'oId', id: 'sNew', name: 'Brand', annualValue: 100, yearsLeft: 2 };
    const patch = applySponsorOfferAcceptance(career, offer);
    expect(patch.sponsors).toHaveLength(2);
    expect(patch.sponsors[1]).not.toHaveProperty('offerKind');
    expect(patch.sponsors[1]).not.toHaveProperty('offerId');
  });
});
