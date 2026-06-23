// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { buildNewCareer, quickStartCareer } from './CareerSetupScreen.jsx';
import { findClub } from '../data/pyramid.js';
import { getCompetitionClubs } from '../lib/leagueEngine.js';

describe('quickStartCareer', () => {
  it('builds a valid, ready-to-play career without throwing', () => {
    const c = quickStartCareer({ existingSlots: {} });
    expect(c).toBeTruthy();
    // Selected club exists and sits in the competition pool it was built for.
    expect(findClub(c.clubId)).toBeTruthy();
    const pool = getCompetitionClubs(c.leagueKey, c.regionState, c.localDivision);
    expect(pool.some((row) => row.id === c.clubId)).toBe(true);
    // Core game state is populated so the hub can render immediately.
    expect(c.squad.length).toBeGreaterThan(0);
    expect(c.lineup.length).toBeGreaterThan(0);
    expect(c.fixtures.length).toBeGreaterThan(0);
    expect(c.season).toBe(2026);
    expect(c.phase).toBe('preseason');
  });

  it('uses the forgiving beginner defaults (grassroots / community / normal)', () => {
    const c = quickStartCareer({ existingSlots: {} });
    expect(c.difficulty).toBe('grassroots');
    expect(c.gameMode).toBe('normal');
    const league = c.leagueKey;
    expect(league).toBeTruthy();
    // Tier 3 community level
    expect(c.regionState).toBe('VIC');
  });

  it('honours a provided manager name', () => {
    const c = quickStartCareer({ existingSlots: {}, managerName: 'Bluey McGee' });
    expect(c.managerName).toBe('Bluey McGee');
  });
});

describe('buildNewCareer', () => {
  it('throws on an unknown club', () => {
    expect(() => buildNewCareer({ clubId: 'nope', leagueKey: 'AFL', state: 'VIC' }))
      .toThrow(/Club not found/);
  });
});
