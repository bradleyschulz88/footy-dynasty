import { describe, it, expect } from 'vitest';
import {
  finalsRoundLabel,
  pairFinalsRound,
  finalsWeeksEstimate,
  playerFinalsOpponent,
  initAflFinalsState,
  recordAflWeekResults,
  pairAflFinalsWeek,
  aflFinalsAlive,
} from '../finalsBracket.js';

describe('finalsRoundLabel', () => {
  it('names Grand Final when two teams remain', () => {
    expect(finalsRoundLabel(2, 1)).toBe('Grand Final');
  });
  it('names opening week for eight teams at tier 1', () => {
    expect(finalsRoundLabel(8, 1)).toBe('Finals Week 1');
  });
});

describe('pairFinalsRound', () => {
  const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  it('tier-1 week one uses QF and EF pairings', () => {
    const pairs = pairFinalsRound(seeds, seeds, 1);
    expect(pairs).toHaveLength(4);
    expect(pairs[0]).toMatchObject({ home: 'a', away: 'd', label: 'Qualifying Final' });
    expect(pairs[2]).toMatchObject({ home: 'e', away: 'h', label: 'Elimination Final' });
  });
  it('reduces to grand final when two remain (non-AFL path)', () => {
    const pairs = pairFinalsRound(seeds, ['a', 'h'], 2);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].label).toBe('Grand Final');
  });
});

describe('finalsWeeksEstimate', () => {
  it('estimates four weeks for tier-1 eight teams', () => {
    expect(finalsWeeksEstimate(8, 1)).toBe(4);
  });
  it('estimates three weeks for eight teams tier 2 knockout', () => {
    expect(finalsWeeksEstimate(8, 2)).toBe(3);
  });
});

describe('playerFinalsOpponent', () => {
  it('returns opponent id for next finals match', () => {
    const aflState = initAflFinalsState(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    const career = {
      clubId: 'a',
      inFinals: true,
      finalsAlive: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      finalsBracket: { seeds: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], tier: 1, aflState },
    };
    expect(playerFinalsOpponent(career)).toBe('d');
  });
});

describe('AFL finals path', () => {
  const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  it('week 2 pairs QF losers with EF winners', () => {
    let state = initAflFinalsState(seeds);
    const w0 = pairAflFinalsWeek(state);
    const winners = w0.map((m) => m.home);
    state = recordAflWeekResults(state, w0, winners);
    expect(aflFinalsAlive(state)).toHaveLength(6);
    const w1 = pairAflFinalsWeek(state);
    expect(w1).toHaveLength(2);
    expect(w1[0].label).toBe('Semi Final');
  });
});
