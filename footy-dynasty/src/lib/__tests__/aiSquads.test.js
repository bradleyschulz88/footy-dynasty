import { describe, it, expect, beforeEach } from 'vitest';
import { ensureSquadsForLeague, aiClubRatingFromSquad, tickAiSquads, ageAiSquads, selectAiLineup } from '../aiSquads.js';
import { aiSquadRating } from '../matchEngine.js';
import { seedRng } from '../rng.js';

const fakeLeague = (tier, ids) => ({ tier, clubs: ids.map(id => ({ id })) });

beforeEach(() => seedRng(123));

describe('ensureSquadsForLeague', () => {
  it('creates a 32-man squad for every AI club but skips the player club', () => {
    const career = { clubId: 'col', aiSquads: {}, season: 2026 };
    const league = fakeLeague(1, ['col', 'gee', 'ess']);
    const out = ensureSquadsForLeague(career, league);
    expect(out.col).toBeUndefined();
    expect(out.gee.length).toBe(32);
    expect(out.ess.length).toBe(32);
  });

  it('returns the same reference when nothing changed', () => {
    const existing = { gee: Array.from({ length: 32 }, () => ({ id: 'p', overall: 70 })) };
    const career = { clubId: 'col', aiSquads: existing, season: 2026 };
    const league = fakeLeague(1, ['col', 'gee']);
    const out = ensureSquadsForLeague(career, league);
    expect(out).toBe(existing);
  });

  it('preserves squads that already exist', () => {
    const cust = [{ id: 'unique', overall: 99 }];
    const career = { clubId: 'col', aiSquads: { gee: cust }, season: 2026 };
    const league = fakeLeague(1, ['col', 'gee', 'haw']);
    const out = ensureSquadsForLeague(career, league);
    expect(out.gee).toBe(cust);
    expect(out.haw.length).toBe(32);
  });
});

describe('aiClubRatingFromSquad', () => {
  it('returns null for an empty squad', () => {
    expect(aiClubRatingFromSquad([])).toBe(null);
    expect(aiClubRatingFromSquad(null)).toBe(null);
  });

  it('roughly equals the average overall when form/fitness are at baseline', () => {
    const squad = Array.from({ length: 22 }, (_, i) => ({ id: `p${i}`, overall: 70, trueRating: 70, form: 70, fitness: 90 }));
    const r = aiClubRatingFromSquad(squad);
    expect(r).toBeCloseTo(70, 1);
  });

  it('a stronger squad rates higher', () => {
    const weak   = Array.from({ length: 22 }, (_, i) => ({ id: `w${i}`, overall: 55, trueRating: 55, form: 70, fitness: 90 }));
    const strong = Array.from({ length: 22 }, (_, i) => ({ id: `s${i}`, overall: 85, trueRating: 85, form: 70, fitness: 90 }));
    expect(aiClubRatingFromSquad(strong)).toBeGreaterThan(aiClubRatingFromSquad(weak));
  });

  it('matchEngine.aiSquadRating delegates to the same logic', () => {
    const squad = Array.from({ length: 22 }, (_, i) => ({ id: `p${i}`, overall: 75, trueRating: 75, form: 70, fitness: 90 }));
    expect(aiSquadRating(squad)).toBeCloseTo(aiClubRatingFromSquad(squad), 5);
  });
});

describe('tickAiSquads', () => {
  it('clamps fitness at 100 and never below 0', () => {
    seedRng(7);
    const squads = { gee: [{ id: 'p', overall: 70, fitness: 99, form: 70 }] };
    const out = tickAiSquads(squads);
    expect(out.gee[0].fitness).toBeLessThanOrEqual(100);
    expect(out.gee[0].fitness).toBeGreaterThanOrEqual(0);
  });

  it('decreases injured days by 1 down to 0', () => {
    seedRng(11);
    const squads = { gee: [{ id: 'p', overall: 70, injured: 3, fitness: 90, form: 70 }] };
    const out = tickAiSquads(squads);
    expect(out.gee[0].injured).toBe(2);
  });

  it('keeps form within [40, 95]', () => {
    seedRng(33);
    const squads = { gee: Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`, overall: 70, fitness: 90, form: 60 })) };
    const out = tickAiSquads(squads);
    out.gee.forEach(p => {
      expect(p.form).toBeGreaterThanOrEqual(40);
      expect(p.form).toBeLessThanOrEqual(95);
    });
  });
});

describe('ageAiSquads', () => {
  it('always returns at least 32 players per AI squad after ageing', () => {
    seedRng(99);
    const squads = {
      gee: Array.from({ length: 25 }, (_, i) => ({
        id: `p${i}`, age: 27, overall: 70, trueRating: 70, contract: 1, tier: 1,
      })),
    };
    const out = ageAiSquads(squads, 1);
    expect(out.gee.length).toBeGreaterThanOrEqual(32);
  });

  it('ages everyone by 1 and drops players who exceed contract or age', () => {
    seedRng(101);
    const squads = {
      gee: [
        { id: 'old', age: 36, overall: 70, trueRating: 70, contract: 1, tier: 1 },
        { id: 'expiring', age: 25, overall: 70, trueRating: 70, contract: 1, tier: 1 },
        { id: 'young', age: 22, overall: 70, trueRating: 70, contract: 3, tier: 1 },
      ],
    };
    const out = ageAiSquads(squads, 1);
    expect(out.gee.find(p => p.id === 'old')).toBeUndefined();
    expect(out.gee.find(p => p.id === 'expiring')).toBeUndefined();
    expect(out.gee.find(p => p.id === 'young')).toBeDefined();
  });

  it('resets per-season stats', () => {
    seedRng(7);
    const squads = {
      gee: [{ id: 'p', age: 23, overall: 70, trueRating: 70, contract: 3, tier: 1, goals: 50, gamesPlayed: 22 }],
    };
    const out = ageAiSquads(squads, 1);
    const survivor = out.gee.find(p => p.id === 'p');
    expect(survivor.goals).toBe(0);
    expect(survivor.gamesPlayed).toBe(0);
  });
});

describe('selectAiLineup', () => {
  it('returns 23 players and usually includes a ruck when the squad has one', () => {
    const squad = Array.from({ length: 30 }, (_, i) => ({
      id: `p${i}`,
      overall: 50 + i,
      trueRating: 50 + i,
      fitness: 90,
      injured: 0,
      position: i === 0 ? 'RU' : 'C',
    }));
    const lineup = selectAiLineup(squad);
    expect(lineup.length).toBe(23);
    expect(lineup.some((p) => p.position === 'RU')).toBe(true);
  });

  it('prefers fit, uninjured players when at least 23 are available', () => {
    const squad = [
      ...Array.from({ length: 23 }, (_, i) => ({ id: `f${i}`, overall: 70, trueRating: 70, fitness: 90, injured: 0 })),
      ...Array.from({ length: 8  }, (_, i) => ({ id: `i${i}`, overall: 99, trueRating: 99, fitness: 60, injured: 5 })),
    ];
    const lineup = selectAiLineup(squad);
    lineup.forEach(p => expect(p.injured ?? 0).toBe(0));
  });
});
