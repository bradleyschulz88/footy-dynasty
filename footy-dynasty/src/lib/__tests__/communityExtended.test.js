import { describe, it, expect, beforeEach } from 'vitest';
import {
  TIER_FANBASE_BASE,
  TIER_FANBASE_MAX,
  updateFanbase,
  bumpJournalist,
  ensureWeatherForWeek,
  rollPlayerTrait,
  PLAYER_TRAITS,
  FOOTY_TRIP_OPTIONS,
  COMMITTEE_TRAITS,
  COMMITTEE_ROLES,
  generateCommittee,
  bumpCommitteeMood,
  committeeMoodAverage,
} from '../community.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(42));

describe('updateFanbase', () => {
  it('grows fanbase by 2 on a win', () => {
    const career = { fanbase: 200 };
    expect(updateFanbase(career, 3, { won: true })).toBe(202);
  });

  it('decreases fanbase by 1 on a loss', () => {
    const career = { fanbase: 200 };
    expect(updateFanbase(career, 3, { won: false, drew: false })).toBe(199);
  });

  it('no change on a draw', () => {
    const career = { fanbase: 200 };
    expect(updateFanbase(career, 3, { drew: true })).toBe(200);
  });

  it('promotion gives large fanbase boost', () => {
    const career = { fanbase: 200 };
    const after = updateFanbase(career, 3, { promoted: true });
    const base = TIER_FANBASE_BASE[3];
    expect(after).toBe(200 + Math.round(base * 0.25));
  });

  it('relegation reduces fanbase', () => {
    const career = { fanbase: 500 };
    const after = updateFanbase(career, 3, { relegated: true });
    const base = TIER_FANBASE_BASE[3];
    expect(after).toBe(500 - Math.round(base * 0.15));
  });

  it('never falls below 1', () => {
    const career = { fanbase: 1 };
    expect(updateFanbase(career, 3, { won: false, drew: false })).toBe(1);
  });

  it('never exceeds tier max', () => {
    const career = { fanbase: TIER_FANBASE_MAX[1] - 1 };
    const after = updateFanbase(career, 1, { promoted: true });
    expect(after).toBe(TIER_FANBASE_MAX[1]);
  });

  it('uses tier base when career.fanbase is missing', () => {
    const career = {};
    const after = updateFanbase(career, 2, { won: true });
    expect(after).toBe(TIER_FANBASE_BASE[2] + 2);
  });

  it('handles unknown tier gracefully', () => {
    const career = { fanbase: 100 };
    const after = updateFanbase(career, 99, { won: true });
    expect(after).toBeGreaterThan(0);
  });
});

describe('bumpJournalist', () => {
  it('returns null/undefined input unchanged', () => {
    expect(bumpJournalist(null, 10)).toBeNull();
    expect(bumpJournalist(undefined, 10)).toBeUndefined();
  });

  it('increases satisfaction by delta', () => {
    const j = { name: 'Test Reporter', satisfaction: 50, tone: 'neutral' };
    const result = bumpJournalist(j, 10);
    expect(result.satisfaction).toBe(60);
    expect(result.name).toBe('Test Reporter');
  });

  it('decreases satisfaction by negative delta', () => {
    const j = { name: 'Bob', satisfaction: 50, tone: 'neutral' };
    const result = bumpJournalist(j, -20);
    expect(result.satisfaction).toBe(30);
  });

  it('clamps satisfaction to 0', () => {
    const j = { satisfaction: 5 };
    expect(bumpJournalist(j, -50).satisfaction).toBe(0);
  });

  it('clamps satisfaction to 100', () => {
    const j = { satisfaction: 95 };
    expect(bumpJournalist(j, 50).satisfaction).toBe(100);
  });

  it('does not mutate the original journalist object', () => {
    const j = { satisfaction: 50 };
    bumpJournalist(j, 10);
    expect(j.satisfaction).toBe(50);
  });

  it('uses default satisfaction of 50 when missing', () => {
    const j = { name: 'Unknown' };
    const result = bumpJournalist(j, 10);
    expect(result.satisfaction).toBe(60);
  });
});

describe('ensureWeatherForWeek', () => {
  it('initialises weeklyWeather when missing', () => {
    const career = {};
    const w = ensureWeatherForWeek(career, 5);
    expect(['fine', 'wind', 'rain']).toContain(w);
    expect(career.weeklyWeather).toBeDefined();
    expect(career.weeklyWeather[5]).toBe(w);
  });

  it('returns the existing weather for a week already set', () => {
    const career = { weeklyWeather: { 5: 'rain' } };
    expect(ensureWeatherForWeek(career, 5)).toBe('rain');
  });

  it('sets different weeks independently', () => {
    const career = {};
    const w1 = ensureWeatherForWeek(career, 1);
    const w2 = ensureWeatherForWeek(career, 2);
    expect(career.weeklyWeather[1]).toBe(w1);
    expect(career.weeklyWeather[2]).toBe(w2);
  });
});

describe('rollPlayerTrait', () => {
  it('returns null most of the time (80% chance)', () => {
    let nullCount = 0;
    for (let s = 0; s < 50; s++) {
      seedRng(s);
      if (rollPlayerTrait() === null) nullCount++;
    }
    // At least 60% null (accounting for randomness)
    expect(nullCount).toBeGreaterThanOrEqual(30);
  });

  it('when not null, returns a valid trait from PLAYER_TRAITS', () => {
    let traitFound = null;
    for (let s = 0; s < 100; s++) {
      seedRng(s);
      const t = rollPlayerTrait();
      if (t !== null) {
        traitFound = t;
        expect(PLAYER_TRAITS).toContain(t);
        break;
      }
    }
    // Should have found a trait in 100 attempts
    expect(traitFound).not.toBeNull();
  });
});

describe('FOOTY_TRIP_OPTIONS', () => {
  it('has three options with distinct ids', () => {
    const ids = FOOTY_TRIP_OPTIONS.map(o => o.id);
    expect(ids).toContain('local');
    expect(ids).toContain('regional');
    expect(ids).toContain('interstate');
  });

  it('each option has positive cost and moraleGain', () => {
    FOOTY_TRIP_OPTIONS.forEach(o => {
      expect(o.cost).toBeGreaterThan(0);
      expect(o.moraleGain).toBeGreaterThan(0);
    });
  });

  it('interstate trip has drama flag set', () => {
    const interstate = FOOTY_TRIP_OPTIONS.find(o => o.id === 'interstate');
    expect(interstate.drama).toBe(true);
  });
});

describe('COMMITTEE_ROLES and COMMITTEE_TRAITS', () => {
  it('each role has a matching trait in COMMITTEE_TRAITS', () => {
    COMMITTEE_ROLES.forEach(r => {
      expect(COMMITTEE_TRAITS[r.trait]).toBeDefined();
      expect(COMMITTEE_TRAITS[r.trait].loves).toBeTruthy();
      expect(COMMITTEE_TRAITS[r.trait].hates).toBeTruthy();
    });
  });

  it('all committee members start with valid mood values', () => {
    COMMITTEE_ROLES.forEach(r => {
      expect(r.startMood).toBeGreaterThanOrEqual(0);
      expect(r.startMood).toBeLessThanOrEqual(100);
    });
  });
});

describe('committeeMoodAverage', () => {
  it('computes average mood correctly', () => {
    const committee = [{ role: 'President', mood: 80 }, { role: 'Treasurer', mood: 60 }];
    expect(committeeMoodAverage(committee)).toBe(70);
  });

  it('rounds to nearest integer', () => {
    const committee = [{ role: 'A', mood: 70 }, { role: 'B', mood: 71 }, { role: 'C', mood: 71 }];
    expect(committeeMoodAverage(committee)).toBe(71);
  });
});

describe('bumpCommitteeMood — edge cases', () => {
  it('returns original committee when role not found', () => {
    const committee = [{ role: 'President', mood: 70 }];
    const result = bumpCommitteeMood(committee, 'NonExistentRole', 10);
    expect(result[0].mood).toBe(70);
  });

  it('returns committee unchanged for non-array input', () => {
    expect(bumpCommitteeMood(null, 'President', 10)).toBeNull();
    expect(bumpCommitteeMood('string', 'President', 10)).toBe('string');
  });

  it('a generated tier-2 committee has 5 members', () => {
    const c = generateCommittee(2);
    expect(c).toHaveLength(5);
  });
});
