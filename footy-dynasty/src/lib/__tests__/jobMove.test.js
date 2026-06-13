import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import {
  offerHasVacancy,
  seasonInProgress,
  offerStartType,
  startTypeLabel,
  simulatePartialSeason,
} from '../jobMove.js';
import { generateFixtures } from '../leagueEngine.js';

beforeEach(() => seedRng(7));

const clubs = [
  { id: 'aaa', name: 'A', short: 'A' },
  { id: 'bbb', name: 'B', short: 'B' },
  { id: 'ccc', name: 'C', short: 'C' },
  { id: 'ddd', name: 'D', short: 'D' },
];

describe('vacancy + start-type rules', () => {
  it('offerHasVacancy is deterministic per club', () => {
    const a = offerHasVacancy({ clubId: 'aaa' });
    expect(offerHasVacancy({ clubId: 'aaa' })).toBe(a);
    expect(typeof a).toBe('boolean');
  });

  it('seasonInProgress reflects an active or finals campaign', () => {
    expect(seasonInProgress({ phase: 'season' })).toBe(true);
    expect(seasonInProgress({ phase: 'preseason', inFinals: true })).toBe(true);
    expect(seasonInProgress({ phase: 'preseason' })).toBe(false);
    expect(seasonInProgress({ phase: 'offseason' })).toBe(false);
  });

  it('start type: next-season out of season; immediate only with vacancy mid-season', () => {
    // Pick clubs on either side of the vacancy threshold.
    const vac = ['aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff'].map((id) => ({ clubId: id }));
    const withVac = vac.find((o) => offerHasVacancy(o));
    const noVac = vac.find((o) => !offerHasVacancy(o));

    // Out of season → always next season.
    expect(offerStartType(withVac, { phase: 'preseason' })).toBe('nextSeason');

    // Mid-season → vacancy is immediate, otherwise end of season.
    expect(offerStartType(withVac, { phase: 'season' })).toBe('immediate');
    expect(offerStartType(noVac, { phase: 'season' })).toBe('endOfSeason');
  });

  it('startTypeLabel gives a human string', () => {
    expect(startTypeLabel('immediate')).toMatch(/immediately/i);
    expect(startTypeLabel('endOfSeason')).toMatch(/season's end/i);
    expect(startTypeLabel('nextSeason')).toMatch(/next season/i);
  });
});

describe('simulatePartialSeason', () => {
  const fixtures = generateFixtures(clubs);

  it('returns a full blank ladder when no rounds have been played', () => {
    const { ladder, record } = simulatePartialSeason(clubs, fixtures, 0, 2, 'aaa');
    expect(ladder).toHaveLength(4);
    expect(ladder.every((r) => r.P === 0)).toBe(true);
    expect(record).toEqual({ W: 0, D: 0, L: 0 });
  });

  it('plays the requested number of rounds and tallies my record', () => {
    const played = 2;
    const { ladder, record } = simulatePartialSeason(clubs, fixtures, played, 2, 'aaa');
    // Each club plays once per round → my games == rounds played.
    expect(record.W + record.D + record.L).toBe(played);
    // Total games on the ladder == 2 results/round * 2 clubs each * rounds.
    const totalP = ladder.reduce((a, r) => a + r.P, 0);
    expect(totalP).toBe(played * clubs.length); // every club plays each round
  });

  it('caps at the number of available fixture rounds', () => {
    const { ladder } = simulatePartialSeason(clubs, fixtures, 999, 2, 'aaa');
    const totalP = ladder.reduce((a, r) => a + r.P, 0);
    expect(totalP).toBe(fixtures.length * clubs.length);
  });
});
