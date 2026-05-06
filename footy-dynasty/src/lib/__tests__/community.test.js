import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCommittee, getCommitteeMember, bumpCommitteeMood, committeeMoodAverage,
  committeeMessage, FOOTY_TRIP_OPTIONS, applyFootyTrip, postMatchFundraiser,
  rollWeeklyWeather, applyGroundDegradation, recoverGroundPreseason,
  groundConditionBand, stadiumDescription, generateJournalist, journalistMatchLine,
} from '../community.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(123));

describe('generateCommittee', () => {
  it('returns 5 named members at tier 2 or 3', () => {
    const c = generateCommittee(3);
    expect(c).toHaveLength(5);
    c.forEach(m => {
      expect(m.name).toMatch(/\S+ \S+/);
      expect(m.mood).toBeGreaterThanOrEqual(0);
      expect(m.mood).toBeLessThanOrEqual(100);
      expect(m.role).toMatch(/President|Treasurer|Social Coordinator|Head Trainer|Local Recruiter/);
      expect(m.trait).toBeTruthy();
    });
  });

  it('returns an empty list at tier 1 (AFL)', () => {
    expect(generateCommittee(1)).toEqual([]);
  });
});

describe('committee mood helpers', () => {
  it('bumpCommitteeMood clamps to [0, 100]', () => {
    const c = [{ role: 'President', mood: 95 }, { role: 'Treasurer', mood: 5 }];
    const up = bumpCommitteeMood(c, 'President', 50);
    const dn = bumpCommitteeMood(c, 'Treasurer', -50);
    expect(up.find(m => m.role === 'President').mood).toBe(100);
    expect(dn.find(m => m.role === 'Treasurer').mood).toBe(0);
  });

  it('committeeMoodAverage returns 100 for an empty / Tier 1 setup', () => {
    expect(committeeMoodAverage([])).toBe(100);
    expect(committeeMoodAverage(null)).toBe(100);
  });

  it('committeeMessage returns null for an unknown trigger', () => {
    const career = { committee: generateCommittee(3), managerName: 'X', season: 2026 };
    expect(committeeMessage(career, 'President', 'unknown_trigger')).toBe(null);
  });

  it('committeeMessage substitutes the member name', () => {
    const career = { committee: generateCommittee(3), managerName: 'X', season: 2026 };
    const pres = getCommitteeMember(career, 'President');
    const msg = committeeMessage(career, 'President', 'win');
    expect(msg.text).toContain(pres.name);
  });
});

describe('applyFootyTrip', () => {
  it('returns null for an unknown option id', () => {
    expect(applyFootyTrip({ squad: [], committee: [] }, 'spaceship')).toBe(null);
  });

  it('applies morale gain to all squad members for the local trip', () => {
    seedRng(7);
    const career = {
      squad: [{ id: 'a', age: 25, morale: 60 }, { id: 'b', age: 30, morale: 50 }],
      committee: generateCommittee(3),
    };
    const out = applyFootyTrip(career, 'local');
    expect(out.squad[0].morale).toBeGreaterThan(60);
    expect(out.squad[1].morale).toBeGreaterThan(50);
  });

  it('regional trip nudges the Treasurer\'s mood down', () => {
    const career = {
      squad: [{ id: 'a', age: 25, morale: 60 }, { id: 'b', age: 19, morale: 60, traits: [] }],
      committee: generateCommittee(3),
    };
    const before = career.committee.find(m => m.role === 'Treasurer').mood;
    const out = applyFootyTrip(career, 'regional');
    const after = out.committee.find(m => m.role === 'Treasurer').mood;
    expect(after).toBeLessThan(before);
  });
});

describe('postMatchFundraiser', () => {
  it('returns null for away games', () => {
    expect(postMatchFundraiser({ squad: [{ id: 'a' }] }, 3, false)).toBe(null);
  });
  it('Tier 3 home game produces $150–400 income', () => {
    seedRng(4);
    const out = postMatchFundraiser({ squad: [{ id: 'a', firstName: 'A', lastName: 'B' }] }, 3, true);
    expect(out.income).toBeGreaterThanOrEqual(150);
    expect(out.income).toBeLessThanOrEqual(400);
  });
  it('Tier 1 home game produces a sponsor cocktail income range', () => {
    seedRng(4);
    const out = postMatchFundraiser({ squad: [] }, 1, true);
    expect(out.income).toBeGreaterThanOrEqual(8000);
    expect(out.income).toBeLessThanOrEqual(20000);
  });
});

describe('ground conditions', () => {
  it('rain degrades faster than fine weather', () => {
    seedRng(1);
    const rainAfter = applyGroundDegradation(95, 'rain', 1);
    seedRng(1);
    const fineAfter = applyGroundDegradation(95, 'fine', 1);
    expect(rainAfter).toBeLessThanOrEqual(fineAfter);
  });

  it('stadium level 5 floors at 80', () => {
    let cond = 95;
    for (let i = 0; i < 30; i++) cond = applyGroundDegradation(cond, 'rain', 5);
    expect(cond).toBeGreaterThanOrEqual(80);
  });

  it('stadium level 1 floors at 20', () => {
    let cond = 95;
    for (let i = 0; i < 100; i++) cond = applyGroundDegradation(cond, 'rain', 1);
    expect(cond).toBeGreaterThanOrEqual(20);
  });

  it('preseason recovery never exceeds 100', () => {
    expect(recoverGroundPreseason(95)).toBeLessThanOrEqual(100);
  });

  it('groundConditionBand returns sane multipliers', () => {
    const perfect = groundConditionBand(95);
    const boggy   = groundConditionBand(30);
    expect(perfect.scoringMod).toBeGreaterThan(boggy.scoringMod);
    expect(perfect.accuracyMod).toBeGreaterThan(boggy.accuracyMod);
  });

  it('stadiumDescription handles all 5 levels and clamps invalid input', () => {
    for (let lvl = 1; lvl <= 5; lvl++) expect(stadiumDescription(lvl)).toBeTruthy();
    expect(stadiumDescription(0)).toBeTruthy();
    expect(stadiumDescription(99)).toBeTruthy();
  });
});

describe('weather', () => {
  it('rolls a string from the weighted pool', () => {
    seedRng(2);
    const w = rollWeeklyWeather();
    expect(['fine', 'wind', 'rain']).toContain(w);
  });
});

describe('journalist', () => {
  it('produces a name + satisfaction in [0,100]', () => {
    const j = generateJournalist();
    expect(j.name).toMatch(/\S+ \S+/);
    expect(j.satisfaction).toBeGreaterThanOrEqual(0);
    expect(j.satisfaction).toBeLessThanOrEqual(100);
  });

  it('match line varies tone with satisfaction', () => {
    const c1 = { journalist: { name: 'J', satisfaction: 80, tone: 'supportive' } };
    const c2 = { journalist: { name: 'J', satisfaction: 20, tone: 'critical' } };
    const club = { name: 'X' };
    const result = { won: false, drew: false, myTotal: 50, oppTotal: 100 };
    const a = journalistMatchLine(c1, result, club, null);
    const b = journalistMatchLine(c2, result, club, null);
    expect(a).not.toBe(b);
  });
});
