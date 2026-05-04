import { describe, it, expect } from 'vitest';
import {
  blankLadder,
  applyResultToLadder,
  sortedLadder,
  generateFixtures,
  getFinalsTeams,
  finalsLabel,
  pickPromotionLeague,
  pickRelegationLeague,
} from '../leagueEngine.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const CLUBS = [
  { id: 'a', name: 'Alpha', short: 'ALP' },
  { id: 'b', name: 'Beta',  short: 'BET' },
  { id: 'c', name: 'Gamma', short: 'GAM' },
  { id: 'd', name: 'Delta', short: 'DEL' },
];

// ---------------------------------------------------------------------------
// blankLadder
// ---------------------------------------------------------------------------
describe('blankLadder', () => {
  it('creates one entry per club', () => {
    expect(blankLadder(CLUBS)).toHaveLength(4);
  });

  it('initialises every stat to zero', () => {
    const ladder = blankLadder(CLUBS);
    ladder.forEach(row => {
      expect(row).toMatchObject({ P: 0, W: 0, L: 0, D: 0, F: 0, A: 0, pts: 0, pct: 0 });
    });
  });

  it('preserves club id, name and short', () => {
    const ladder = blankLadder(CLUBS);
    expect(ladder[0]).toMatchObject({ id: 'a', name: 'Alpha', short: 'ALP' });
  });
});

// ---------------------------------------------------------------------------
// applyResultToLadder
// ---------------------------------------------------------------------------
describe('applyResultToLadder', () => {
  it('awards 4 points for a win', () => {
    const updated = applyResultToLadder(blankLadder(CLUBS), 'a', 'b', 100, 50);
    expect(updated.find(r => r.id === 'a')).toMatchObject({ W: 1, pts: 4, P: 1 });
  });

  it('awards 0 points for a loss', () => {
    const updated = applyResultToLadder(blankLadder(CLUBS), 'a', 'b', 40, 100);
    expect(updated.find(r => r.id === 'a')).toMatchObject({ L: 1, pts: 0, W: 0 });
  });

  it('awards 2 points each for a draw', () => {
    const updated = applyResultToLadder(blankLadder(CLUBS), 'a', 'b', 75, 75);
    expect(updated.find(r => r.id === 'a')).toMatchObject({ D: 1, pts: 2 });
    expect(updated.find(r => r.id === 'b')).toMatchObject({ D: 1, pts: 2 });
  });

  it('records for and against correctly for both teams', () => {
    const updated = applyResultToLadder(blankLadder(CLUBS), 'a', 'b', 100, 60);
    expect(updated.find(r => r.id === 'a')).toMatchObject({ F: 100, A: 60 });
    expect(updated.find(r => r.id === 'b')).toMatchObject({ F: 60, A: 100 });
  });

  it('calculates percentage as (F / A) * 100', () => {
    const updated = applyResultToLadder(blankLadder(CLUBS), 'a', 'b', 100, 50);
    expect(updated.find(r => r.id === 'a').pct).toBeCloseTo(200);
    expect(updated.find(r => r.id === 'b').pct).toBeCloseTo(50);
  });

  it('does not touch unrelated teams', () => {
    const updated = applyResultToLadder(blankLadder(CLUBS), 'a', 'b', 100, 50);
    const c = updated.find(r => r.id === 'c');
    expect(c).toMatchObject({ P: 0, W: 0, L: 0, D: 0, pts: 0 });
  });

  it('accumulates stats over multiple rounds', () => {
    let ladder = blankLadder(CLUBS);
    ladder = applyResultToLadder(ladder, 'a', 'b', 100, 50);
    ladder = applyResultToLadder(ladder, 'a', 'c', 80, 70);
    const a = ladder.find(r => r.id === 'a');
    expect(a).toMatchObject({ P: 2, W: 2, pts: 8, F: 180, A: 120 });
  });

  it('does not mutate the input ladder', () => {
    const original = blankLadder(CLUBS);
    const snapshot = original.map(r => ({ ...r }));
    applyResultToLadder(original, 'a', 'b', 100, 50);
    expect(original).toEqual(snapshot);
  });
});

// ---------------------------------------------------------------------------
// sortedLadder
// ---------------------------------------------------------------------------
describe('sortedLadder', () => {
  it('places the team with most points first', () => {
    let ladder = blankLadder(CLUBS);
    ladder = applyResultToLadder(ladder, 'b', 'a', 100, 50);
    expect(sortedLadder(ladder)[0].id).toBe('b');
  });

  it('breaks a points tie by percentage (higher pct ranks above)', () => {
    let ladder = blankLadder(CLUBS);
    ladder = applyResultToLadder(ladder, 'a', 'c', 100, 80); // a pct ≈ 125
    ladder = applyResultToLadder(ladder, 'b', 'd', 100, 60); // b pct ≈ 167
    const sorted = sortedLadder(ladder);
    expect(sorted[0].id).toBe('b');
    expect(sorted[1].id).toBe('a');
  });

  it('does not mutate the input array', () => {
    const ladder = blankLadder(CLUBS);
    const original = ladder.map(r => ({ ...r }));
    sortedLadder(ladder);
    expect(ladder).toEqual(original);
  });

  it('returns all entries', () => {
    expect(sortedLadder(blankLadder(CLUBS))).toHaveLength(CLUBS.length);
  });
});

// ---------------------------------------------------------------------------
// generateFixtures
// ---------------------------------------------------------------------------
describe('generateFixtures', () => {
  it('produces n-1 rounds for n teams (round-robin)', () => {
    const fixtures = generateFixtures(CLUBS);
    expect(fixtures).toHaveLength(CLUBS.length - 1);
  });

  it('every pair of clubs meets exactly once', () => {
    const fixtures = generateFixtures(CLUBS);
    const matchups = new Set();
    fixtures.forEach(round =>
      round.forEach(m => matchups.add([m.home, m.away].sort().join('-')))
    );
    const expected = (CLUBS.length * (CLUBS.length - 1)) / 2;
    expect(matchups.size).toBe(expected);
  });

  it('no club plays itself', () => {
    generateFixtures(CLUBS).forEach(round =>
      round.forEach(m => expect(m.home).not.toBe(m.away))
    );
  });

  it('works for an odd number of clubs (bye handling)', () => {
    const oddClubs = CLUBS.slice(0, 3); // 3 clubs
    const fixtures = generateFixtures(oddClubs);
    // With a bye, each round has floor(n/2) games and there are n rounds
    fixtures.forEach(round => {
      round.forEach(m => {
        expect(m.home).not.toBe(m.away);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// getFinalsTeams
// ---------------------------------------------------------------------------
describe('getFinalsTeams', () => {
  const makeLadder = (n) =>
    Array.from({ length: n }, (_, i) => ({ id: `t${i}`, pts: n - i, pct: 100, F: (n - i) * 10, W: n - i, L: 0, D: 0, A: 1 }));

  it('selects the top 8 for tier-1 competitions', () => {
    expect(getFinalsTeams(makeLadder(18), 1)).toHaveLength(8);
  });

  it('selects the top 6 for tier-2 competitions', () => {
    expect(getFinalsTeams(makeLadder(9), 2)).toHaveLength(6);
  });

  it('selects the top 4 for tier-3 competitions', () => {
    expect(getFinalsTeams(makeLadder(8), 3)).toHaveLength(4);
  });

  it('returns all clubs when ladder is smaller than the finals quota', () => {
    // Only 3 clubs in the competition — should return all 3
    expect(getFinalsTeams(makeLadder(3), 1)).toHaveLength(3);
  });

  it('returns the highest-ranked clubs', () => {
    const ladder = makeLadder(18);
    const finalists = getFinalsTeams(ladder, 1);
    // The team with the most points should be first
    expect(finalists[0].pts).toBeGreaterThanOrEqual(finalists[1].pts);
  });
});

// ---------------------------------------------------------------------------
// finalsLabel
// ---------------------------------------------------------------------------
describe('finalsLabel', () => {
  it('labels the last round as Grand Final', () => {
    expect(finalsLabel(2, 2)).toBe('Grand Final');
    expect(finalsLabel(3, 3)).toBe('Grand Final');
  });

  it('labels the penultimate round as Preliminary Final', () => {
    expect(finalsLabel(1, 2)).toBe('Preliminary Final');
  });

  it('labels two rounds before the end as Semi Final', () => {
    expect(finalsLabel(0, 2)).toBe('Semi Final');
  });

  it('labels earlier rounds as Elimination Final', () => {
    expect(finalsLabel(0, 3)).toBe('Elimination Final');
    expect(finalsLabel(1, 4)).toBe('Elimination Final');
  });
});

// ---------------------------------------------------------------------------
// pickPromotionLeague
// ---------------------------------------------------------------------------
describe('pickPromotionLeague', () => {
  it('returns null for a tier-1 club (already at the top)', () => {
    expect(pickPromotionLeague({ tier: 1, state: 'VIC' })).toBeNull();
  });

  it('promotes tier-2 clubs to AFL', () => {
    expect(pickPromotionLeague({ tier: 2, state: 'VIC' })).toBe('AFL');
  });

  it('promotes tier-3 VIC clubs to the VFL', () => {
    expect(pickPromotionLeague({ tier: 3, state: 'VIC' })).toBe('VFL');
  });

  it('promotes tier-3 SA clubs to the SANFL', () => {
    expect(pickPromotionLeague({ tier: 3, state: 'SA' })).toBe('SANFL');
  });

  it('promotes tier-3 WA clubs to the WAFL', () => {
    expect(pickPromotionLeague({ tier: 3, state: 'WA' })).toBe('WAFL');
  });

  it('promotes tier-3 QLD clubs to the VFL (no state Tier 2)', () => {
    expect(pickPromotionLeague({ tier: 3, state: 'QLD' })).toBe('VFL');
  });

  it('promotes tier-3 NSW clubs to AFL Sydney', () => {
    expect(pickPromotionLeague({ tier: 3, state: 'NSW' })).toBe('AFLSyd');
  });
});

// ---------------------------------------------------------------------------
// pickRelegationLeague
// ---------------------------------------------------------------------------
describe('pickRelegationLeague', () => {
  it('relegates a tier-1 VIC club to the VFL', () => {
    expect(pickRelegationLeague({ tier: 1, state: 'VIC' })).toBe('VFL');
  });

  it('relegates a tier-1 SA club to the SANFL', () => {
    expect(pickRelegationLeague({ tier: 1, state: 'SA' })).toBe('SANFL');
  });

  it('relegates a tier-1 WA club to the WAFL', () => {
    expect(pickRelegationLeague({ tier: 1, state: 'WA' })).toBe('WAFL');
  });

  it('relegates a tier-2 VIC club to the EFNL', () => {
    expect(pickRelegationLeague({ tier: 2, state: 'VIC' })).toBe('EFNL');
  });

  it('relegates a tier-2 SA club to the Adelaide FL', () => {
    expect(pickRelegationLeague({ tier: 2, state: 'SA' })).toBe('AdelFL');
  });

  it('returns null for tier-2 states without a modelled tier-3 league', () => {
    expect(pickRelegationLeague({ tier: 2, state: 'QLD' })).toBeNull();
  });

  it('returns null for tier-3 clubs (no lower tier modelled)', () => {
    expect(pickRelegationLeague({ tier: 3, state: 'VIC' })).toBeNull();
  });
});
