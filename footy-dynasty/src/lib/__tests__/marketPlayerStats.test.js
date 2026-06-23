import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import { enrichMarketPlayerCareer } from '../defaults.js';

beforeEach(() => seedRng(3));

describe('enrichMarketPlayerCareer — live stats vs scouting context', () => {
  it('a market player starts the season on ZERO live stats', () => {
    const base = { id: 'm1', age: 29, position: 'C', overall: 75, firstName: 'A', lastName: 'B' };
    const p = enrichMarketPlayerCareer(base, 2030);
    // The bug was these carrying 200+ disposals into your squad on day one.
    expect(p.gamesPlayed).toBe(0);
    expect(p.goals).toBe(0);
    expect(p.behinds).toBe(0);
    expect(p.disposals).toBe(0);
    expect(p.marks).toBe(0);
    expect(p.tackles).toBe(0);
  });

  it('keeps the synthetic numbers as last-season scouting context instead', () => {
    const base = { id: 'm2', age: 31, position: 'FWD', overall: 80, firstName: 'C', lastName: 'D' };
    const p = enrichMarketPlayerCareer(base, 2030);
    expect(p.lastSeasonStats).toBeTruthy();
    expect(p.lastSeasonStats.disposals).toBeGreaterThan(0);
    expect(typeof p.careerGames).toBe('number');
    expect(p.careerGames).toBeGreaterThan(0);
  });

  it('leaves very young players untouched (no synthetic history)', () => {
    const base = { id: 'm3', age: 18, position: 'C', overall: 60 };
    const p = enrichMarketPlayerCareer(base, 2030);
    expect(p.gamesPlayed).toBe(0);
  });
});
