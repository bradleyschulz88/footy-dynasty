import { describe, it, expect } from 'vitest';
import {
  LOCAL_DIVISION_COUNT,
  localDivisionForClub,
  getCompetitionClubs,
  competitionClubsForCareer,
  tier3DivisionCount,
  tier3DivisionTeamCounts,
  TIER3_CLUBS_PER_DIVISION_TARGET,
} from '../leagueEngine.js';

describe('tier3DivisionCount', () => {
  it('returns 1 for tiny pools and up to LOCAL_DIVISION_COUNT for large pools', () => {
    const k = tier3DivisionCount('AdelFL', 'SA');
    expect(k).toBeGreaterThanOrEqual(1);
    expect(k).toBeLessThanOrEqual(LOCAL_DIVISION_COUNT);
    const all = getCompetitionClubs('AdelFL', 'SA', null);
    const expected = Math.min(LOCAL_DIVISION_COUNT, Math.max(1, Math.ceil(all.length / TIER3_CLUBS_PER_DIVISION_TARGET)));
    expect(k).toBe(expected);
  });
});

describe('localDivisionForClub', () => {
  it('returns integers in 1..K where K is tier3DivisionCount', () => {
    const d = localDivisionForClub('some_club', 'AdelFL', 'SA');
    const K = tier3DivisionCount('AdelFL', 'SA');
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(K);
  });

  it('is stable for the same inputs', () => {
    expect(localDivisionForClub('x', 'AdelFL', 'SA')).toBe(localDivisionForClub('x', 'AdelFL', 'SA'));
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

  it('partitions tier 3 into K divisions that cover the full pool without overlap', () => {
    const region = 'SA';
    const leagueKey = 'AdelFL';
    const allLocal = getCompetitionClubs(leagueKey, region, null);
    const K = tier3DivisionCount(leagueKey, region);
    const counts = tier3DivisionTeamCounts(leagueKey, region);
    expect(counts.length).toBe(K);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(allLocal.length);
    let total = 0;
    for (let d = 1; d <= K; d++) {
      const divClubs = getCompetitionClubs(leagueKey, region, d);
      total += divClubs.length;
      for (const c of divClubs) {
        expect(localDivisionForClub(c.id, leagueKey, region)).toBe(d);
      }
    }
    expect(total).toBe(allLocal.length);
  });
});

describe('competitionClubsForCareer', () => {
  it('includes player club when division matches career', () => {
    const clubId = 'adelfl_adelaide_lutheran';
    const leagueKey = 'AdelFL';
    const regionState = 'SA';
    const d = localDivisionForClub(clubId, leagueKey, regionState);
    const career = { leagueKey, clubId, regionState, localDivision: d };
    const pool = competitionClubsForCareer(career);
    expect(pool.some((c) => c.id === clubId)).toBe(true);
    expect(pool.every((c) => localDivisionForClub(c.id, leagueKey, regionState) === d)).toBe(true);
  });
});
