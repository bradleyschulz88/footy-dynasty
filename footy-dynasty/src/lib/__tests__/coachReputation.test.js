import { describe, it, expect, beforeEach } from 'vitest';
import {
  COACH_TIERS, coachTierFromScore,
  applyEndOfSeasonReputation, applySackingReputation,
  generateJobMarket, takeSeasonOff,
} from '../coachReputation.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(99));

describe('coachTierFromScore', () => {
  it('maps the full 0-100 range across the five tiers', () => {
    expect(coachTierFromScore(0)).toBe('Rookie');
    expect(coachTierFromScore(15)).toBe('Rookie');
    expect(coachTierFromScore(20)).toBe('Journeyman');
    expect(coachTierFromScore(40)).toBe('Respected');
    expect(coachTierFromScore(60)).toBe('Elite');
    expect(coachTierFromScore(80)).toBe('Legend');
  });

  it('exposes tiers in expected order', () => {
    expect(COACH_TIERS).toEqual(['Rookie', 'Journeyman', 'Respected', 'Elite', 'Legend']);
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
    const career = { coachReputation: 90, clubId: 'tba', previousClubs: [] };
    const offers = generateJobMarket(career);
    const tier1Count = offers.filter(o => o.leagueTier === 1).length;
    expect(tier1Count).toBeGreaterThanOrEqual(2);
  });

  it('desperate market scan does not shrink the offer list', () => {
    seedRng(5);
    const career = { coachReputation: 55, clubId: 'mel', previousClubs: [] };
    const base = generateJobMarket(career);
    const desperate = generateJobMarket(career, { desperate: true });
    expect(desperate.length).toBeGreaterThanOrEqual(base.length);
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
