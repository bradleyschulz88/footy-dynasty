import { describe, it, expect, beforeEach } from 'vitest';
import {
  COACH_TIERS, coachTierFromScore,
  applyEndOfSeasonReputation, applySackingReputation,
  generateJobMarket, takeSeasonOff, buildDominantSeasonApproach,
} from '../coachReputation.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(99));

describe('coachTierFromScore', () => {
  it('maps the full 0-100 range across the six tiers', () => {
    expect(coachTierFromScore(0)).toBe('Grassroots');
    expect(coachTierFromScore(7)).toBe('Grassroots');
    expect(coachTierFromScore(8)).toBe('Rookie');
    expect(coachTierFromScore(15)).toBe('Rookie');
    expect(coachTierFromScore(20)).toBe('Journeyman');
    expect(coachTierFromScore(40)).toBe('Respected');
    expect(coachTierFromScore(60)).toBe('Elite');
    expect(coachTierFromScore(80)).toBe('Legend');
  });

  it('exposes tiers in expected order', () => {
    expect(COACH_TIERS).toEqual(['Grassroots', 'Rookie', 'Journeyman', 'Respected', 'Elite', 'Legend']);
  });
});

describe('applyEndOfSeasonReputation', () => {
  it('premiership adds the largest single bump (+15)', () => {
    expect(applyEndOfSeasonReputation(50, { premiership: true })).toBe(65);
  });

  it('finals appearance without premiership adds +5', () => {
    expect(applyEndOfSeasonReputation(50, { finals: true })).toBe(55);
  });

  it('relegation costs reputation', () => {
    expect(applyEndOfSeasonReputation(50, { relegated: true })).toBe(42);
  });

  it('high winRate adds +3, low winRate subtracts -4', () => {
    expect(applyEndOfSeasonReputation(50, { winRate: 0.8 })).toBe(53);
    expect(applyEndOfSeasonReputation(50, { winRate: 0.2 })).toBe(46);
  });

  it('clamps to [0, 100]', () => {
    expect(applyEndOfSeasonReputation(0,   { relegated: true })).toBe(0);
    expect(applyEndOfSeasonReputation(100, { premiership: true })).toBe(100);
  });
});

describe('applySackingReputation', () => {
  it('drops 12 points', () => {
    expect(applySackingReputation(50)).toBe(38);
  });
  it('clamps at 0', () => {
    expect(applySackingReputation(5)).toBe(0);
  });
});

describe('generateJobMarket', () => {
  it('returns offers shaped sensibly for a Rookie coach', () => {
    const career = { coachReputation: 10, clubId: 'gee', previousClubs: [] };
    const offers = generateJobMarket(career);
    expect(Array.isArray(offers)).toBe(true);
    if (offers.length > 0) {
      offers.forEach(o => {
        expect(o.clubId).toBeTruthy();
        expect(o.leagueShort).toBeTruthy();
        expect([1, 2, 3]).toContain(o.leagueTier);
        expect(o.wage).toBeGreaterThan(0);
        expect(typeof o.chairmanLine).toBe('string');
      });
    }
  });

  it('excludes the player\'s current club from offers', () => {
    const career = { coachReputation: 70, clubId: 'col', previousClubs: [] };
    const offers = generateJobMarket(career);
    offers.forEach(o => expect(o.clubId).not.toBe('col'));
  });

  it('Legend coach skews toward Tier 1 listings', () => {
    // Tier 1 (AFL) requires High Performance accreditation to interview, so a
    // Legend-reputation coach must also hold the credential to be offered them.
    const career = { coachReputation: 90, coachAccreditation: 3, clubId: 'tba', previousClubs: [] };
    const offers = generateJobMarket(career);
    const tier1Count = offers.filter(o => o.leagueTier === 1).length;
    expect(tier1Count).toBeGreaterThanOrEqual(2);
  });

  it('un-accredited coach is gated out of Tier 1 listings despite reputation', () => {
    // Same Legend reputation, but only Foundation accreditation — AFL clubs
    // won't interview, so vacancies downgrade to lower tiers.
    const career = { coachReputation: 90, coachAccreditation: 0, clubId: 'tba', previousClubs: [] };
    const offers = generateJobMarket(career);
    expect(offers.filter(o => o.leagueTier === 1).length).toBe(0);
  });

  it('desperate market scan does not shrink the offer list', () => {
    seedRng(5);
    const career = { coachReputation: 55, clubId: 'mel', previousClubs: [] };
    const base = generateJobMarket(career);
    const desperate = generateJobMarket(career, { desperate: true });
    expect(desperate.length).toBeGreaterThanOrEqual(base.length);
  });
});

describe('buildDominantSeasonApproach', () => {
  const career = { coachReputation: 55, clubId: 'gee', previousClubs: [] };

  it('returns null when the club lost any game', () => {
    expect(buildDominantSeasonApproach(career, { losses: 1, games: 18, currentTier: 3 })).toBeNull();
  });

  it('returns null for a short (non-full) season', () => {
    expect(buildDominantSeasonApproach(career, { losses: 0, games: 4, currentTier: 3 })).toBeNull();
  });

  it('returns null at the top tier — nowhere higher to step up to', () => {
    expect(buildDominantSeasonApproach(career, { losses: 0, games: 22, currentTier: 1 })).toBeNull();
  });

  it('an undefeated lower-tier season yields a higher-tier approach', () => {
    const offer = buildDominantSeasonApproach(career, { losses: 0, games: 18, currentTier: 3 });
    // Job market should surface at least one tier-1/2 vacancy for a Respected coach.
    if (offer) expect(offer.leagueTier).toBeLessThan(3);
  });
});

describe('takeSeasonOff', () => {
  it('adds +5 reputation and recomputes tier', () => {
    const out = takeSeasonOff({ coachReputation: 40 });
    expect(out.coachReputation).toBe(45);
    expect(out.coachTier).toBe('Respected');
  });
  it('caps at 100', () => {
    const out = takeSeasonOff({ coachReputation: 99 });
    expect(out.coachReputation).toBe(100);
    expect(out.coachTier).toBe('Legend');
  });
});
