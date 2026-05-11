import { describe, it, expect } from 'vitest';
import {
  LOCAL_DIVISION_COUNT,
  localDivisionForClub,
  getCompetitionClubs,
  competitionClubsForCareer,
} from '../leagueEngine.js';

describe('localDivisionForClub', () => {
  it('returns integers in 1..LOCAL_DIVISION_COUNT', () => {
    const d = localDivisionForClub('some_club', 'AdelFL');
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(LOCAL_DIVISION_COUNT);
  });

  it('is stable for the same inputs', () => {
    expect(localDivisionForClub('x', 'LKey')).toBe(localDivisionForClub('x', 'LKey'));
  });
});

describe('getCompetitionClubs', () => {
  it('returns full AFL list for tier 1', () => {
    const all = getCompetitionClubs('AFL', 'SA', 5);
    expect(all.length).toBeGreaterThan(10);
    expect(all.some((c) => c.id === 'car')).toBe(true);
  });

  it('filters SANFL to SA clubs only', () => {
    const sa = getCompetitionClubs('SANFL', 'SA', null);
    expect(sa.length).toBeGreaterThan(0);
    expect(sa.every((c) => c.state === 'SA')).toBe(true);
  });

  it('splits tier 3 into a division subset', () => {
    const allLocal = getCompetitionClubs('AdelFL', 'SA', null);
    const div3 = getCompetitionClubs('AdelFL', 'SA', 3);
    expect(div3.length).toBeGreaterThan(0);
    expect(div3.length).toBeLessThanOrEqual(allLocal.length);
    for (const c of div3) {
      expect(localDivisionForClub(c.id, 'AdelFL')).toBe(3);
    }
  });
});

describe('competitionClubsForCareer', () => {
  it('includes player club and matches division', () => {
    const clubId = 'adelfl_adelaide_lutheran';
    const d = localDivisionForClub(clubId, 'AdelFL');
    const career = {
      leagueKey: 'AdelFL',
      clubId,
      regionState: 'SA',
      localDivision: d,
    };
    const pool = competitionClubsForCareer(career);
    expect(pool.some((c) => c.id === clubId)).toBe(true);
    expect(pool.every((c) => c.state === 'SA')).toBe(true);
    expect(pool.every((c) => localDivisionForClub(c.id, 'AdelFL') === d)).toBe(true);
  });
});
