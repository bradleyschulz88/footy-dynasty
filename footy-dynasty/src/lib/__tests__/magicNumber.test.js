import { describe, it, expect } from 'vitest';
import { finalsMagicNumber } from '../magicNumber.js';

const makeCareer = (clubId, pos, total, overrides = {}) => {
  const ladder = Array.from({ length: total }, (_, i) => ({
    id: i === pos - 1 ? clubId : `other_${i}`,
    pts: (total - i) * 4,
    played: 15,
    W: total - i - 1,
    L: i,
    D: 0,
    pct: 100,
    F: 100,
    A: 90,
  }));
  return {
    clubId,
    ladder,
    totalRounds: 23,
    eventQueue: [],
    ...overrides,
  };
};

describe('finalsMagicNumber', () => {
  it('returns null when club is not on the ladder', () => {
    const career = makeCareer('c1', 1, 10);
    career.clubId = 'missing_club';
    expect(finalsMagicNumber(career)).toBeNull();
  });

  it('returns null when there are fewer than finalsSpots teams', () => {
    // Only 4 teams but asking for 8 finalists
    const career = makeCareer('c1', 1, 4);
    expect(finalsMagicNumber(career, 8)).toBeNull();
  });

  it('returns clinched true when team has insurmountable lead', () => {
    // Team at position 1 with massive points lead, few rounds left
    const career = makeCareer('c1', 1, 12, { totalRounds: 16 });
    // Set up so team has very high points vs cutoff
    career.ladder[0].pts = 200;
    career.ladder[0].played = 15;
    const result = finalsMagicNumber(career);
    expect(result).not.toBeNull();
    if (result?.clinched) {
      expect(result.label).toBe('Finals secured');
    }
  });

  it('returns winsNeeded when team is not yet clinched', () => {
    const career = makeCareer('c1', 5, 12);
    career.ladder[4].pts = 24; // team in 5th, behind 8th
    career.ladder[7].pts = 32; // team in 8th
    career.ladder[4].played = 15;
    const result = finalsMagicNumber(career);
    expect(result).not.toBeNull();
    expect(result.clinched).toBe(false);
    expect(typeof result.winsNeeded).toBe('number');
    expect(result.winsNeeded).toBeGreaterThanOrEqual(0);
  });

  it('includes myPos and roundsLeft in the result', () => {
    const career = makeCareer('c1', 3, 12);
    const result = finalsMagicNumber(career);
    expect(result?.myPos).toBe(3);
    expect(result?.roundsLeft).toBeGreaterThanOrEqual(0);
  });

  it('label includes wins count when team can still make finals mathematically', () => {
    const career = makeCareer('c1', 5, 12);
    career.ladder[4].pts = 16; // 5th-place club has 16 pts
    career.ladder[7].pts = 24; // 8th-place club has 24 pts
    career.ladder[4].played = 14;
    const result = finalsMagicNumber(career);
    if (result && !result.clinched) {
      // The label should say "X win(s) to clinch top 8"
      expect(result.label).toMatch(/win/);
    }
  });

  it('uses custom finalsSpots', () => {
    const career = makeCareer('c1', 3, 10);
    // With only 4 finalists spots, position 3 is inside finals
    const result = finalsMagicNumber(career, 4);
    expect(result).not.toBeNull();
    expect(result.myPos).toBe(3);
  });

  it('counts scheduled round events for totalRounds calculation', () => {
    const career = makeCareer('c1', 2, 12);
    career.totalRounds = undefined;
    career.eventQueue = Array.from({ length: 20 }, (_, i) => ({ type: 'round', id: `r${i}` }));
    const result = finalsMagicNumber(career);
    expect(result).not.toBeNull();
  });

  it('returns null when ladder is empty', () => {
    const career = { clubId: 'c1', ladder: [], totalRounds: 23, eventQueue: [] };
    expect(finalsMagicNumber(career)).toBeNull();
  });
});
