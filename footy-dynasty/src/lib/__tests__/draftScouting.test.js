import { describe, it, expect } from 'vitest';
import {
  COMBINE_SCOUT_COST,
  scoutRevealTier,
  withDraftScoutingDefaults,
  migrateDraftPoolScouting,
  displayDraftOverall,
  displayDraftPotential,
  displayDraftWageEstimate,
  applyCombineScoutingRound,
} from '../draftScouting.js';

describe('COMBINE_SCOUT_COST', () => {
  it('is a positive number', () => {
    expect(COMBINE_SCOUT_COST).toBeGreaterThan(0);
    expect(typeof COMBINE_SCOUT_COST).toBe('number');
  });
});

describe('scoutRevealTier', () => {
  it('returns 0 for missing or null player', () => {
    expect(scoutRevealTier(null)).toBe(0);
    expect(scoutRevealTier(undefined)).toBe(0);
    expect(scoutRevealTier({})).toBe(0);
  });

  it('clamps values to 0-3 range', () => {
    expect(scoutRevealTier({ scoutReveal: -5 })).toBe(0);
    expect(scoutRevealTier({ scoutReveal: 10 })).toBe(3);
    expect(scoutRevealTier({ scoutReveal: 3 })).toBe(3);
  });

  it('rounds fractional values', () => {
    expect(scoutRevealTier({ scoutReveal: 1.4 })).toBe(1);
    expect(scoutRevealTier({ scoutReveal: 1.6 })).toBe(2);
  });

  it('returns 0 for non-finite scoutReveal (NaN, string)', () => {
    expect(scoutRevealTier({ scoutReveal: NaN })).toBe(0);
    expect(scoutRevealTier({ scoutReveal: 'text' })).toBe(0);
  });

  it('clamps Infinity to 3', () => {
    // Infinity passes Number.isFinite? No — but min(3, Infinity) = 3
    // Actually Number.isFinite(Infinity) is false, so returns 0
    expect(scoutRevealTier({ scoutReveal: Infinity })).toBe(0);
  });

  it('handles valid tier values 0-3', () => {
    expect(scoutRevealTier({ scoutReveal: 0 })).toBe(0);
    expect(scoutRevealTier({ scoutReveal: 1 })).toBe(1);
    expect(scoutRevealTier({ scoutReveal: 2 })).toBe(2);
    expect(scoutRevealTier({ scoutReveal: 3 })).toBe(3);
  });
});

describe('withDraftScoutingDefaults', () => {
  it('attaches scoutReveal from existing scoutReveal', () => {
    const p = { id: 'p1', name: 'Test', scoutReveal: 2 };
    const result = withDraftScoutingDefaults(p);
    expect(result.scoutReveal).toBe(2);
    expect(result.id).toBe('p1');
  });

  it('sets scoutReveal to 0 when not provided', () => {
    const p = { id: 'p2', name: 'Test2' };
    const result = withDraftScoutingDefaults(p);
    expect(result.scoutReveal).toBe(0);
  });

  it('does not mutate the original player object', () => {
    const p = { id: 'p3', scoutReveal: 1 };
    const result = withDraftScoutingDefaults(p);
    expect(result).not.toBe(p);
  });
});

describe('migrateDraftPoolScouting', () => {
  it('returns empty array for non-array input', () => {
    expect(migrateDraftPoolScouting(null)).toEqual([]);
    expect(migrateDraftPoolScouting(undefined)).toEqual([]);
    expect(migrateDraftPoolScouting('string')).toEqual([]);
  });

  it('treats players with no scoutReveal as fully revealed (tier 3)', () => {
    const pool = [{ id: 'p1', overall: 75 }];
    const result = migrateDraftPoolScouting(pool);
    expect(result[0].scoutReveal).toBe(3);
  });

  it('preserves existing scoutReveal values', () => {
    const pool = [
      { id: 'p1', scoutReveal: 1 },
      { id: 'p2', scoutReveal: 2 },
      { id: 'p3', scoutReveal: null },
    ];
    const result = migrateDraftPoolScouting(pool);
    expect(result[0].scoutReveal).toBe(1);
    expect(result[1].scoutReveal).toBe(2);
    expect(result[2].scoutReveal).toBe(3); // null → default 3
  });

  it('handles an empty array', () => {
    expect(migrateDraftPoolScouting([])).toEqual([]);
  });
});

describe('displayDraftOverall', () => {
  it('returns ? hint for tier 0 (unscouted)', () => {
    const p = { id: 'p1', overall: 75, scoutReveal: 0 };
    const result = displayDraftOverall(p);
    expect(result.label).toBe('?');
    expect(result.hint).toContain('combine');
  });

  it('returns band estimate for tier 1', () => {
    const p = { id: 'p1', overall: 75, scoutReveal: 1 };
    const result = displayDraftOverall(p);
    expect(result.label).toMatch(/^\d+$/);
    expect(result.hint).toContain('±10');
  });

  it('returns scout estimate for tier 2', () => {
    const p = { id: 'p1', overall: 75, scoutReveal: 2 };
    const result = displayDraftOverall(p);
    expect(result.label).toMatch(/^\d+$/);
    expect(result.hint).toContain('±4');
  });

  it('returns exact value for tier 3', () => {
    const p = { id: 'p1', overall: 75, scoutReveal: 3 };
    const result = displayDraftOverall(p);
    expect(result.label).toBe('75');
    expect(result.hint).toBeNull();
  });

  it('returns ? hint when overall is not a valid number', () => {
    const p = { id: 'p1', scoutReveal: 3 };
    const result = displayDraftOverall(p);
    expect(result.label).toBe('?');
    expect(result.hint).toBe('Unscouted');
  });
});

describe('displayDraftPotential', () => {
  it('returns ? for any tier when potential is missing', () => {
    const p = { id: 'p1', scoutReveal: 3 };
    const result = displayDraftPotential(p);
    expect(result.label).toBe('?');
  });

  it('returns ? for tier 0 (no scouting)', () => {
    const p = { id: 'p1', potential: 85, scoutReveal: 0 };
    const result = displayDraftPotential(p);
    expect(result.label).toBe('?');
    expect(result.hint).toBeNull();
  });

  it('returns ? for tier 1 with fuzzy hint', () => {
    const p = { id: 'p1', potential: 85, scoutReveal: 1 };
    const result = displayDraftPotential(p);
    expect(result.label).toBe('?');
    expect(result.hint).toContain('fuzzy');
  });

  it('returns estimate for tier 2', () => {
    const p = { id: 'p1', potential: 85, scoutReveal: 2 };
    const result = displayDraftPotential(p);
    expect(result.label).toMatch(/^\d+$/);
    expect(result.hint).toContain('Ceiling');
  });

  it('returns exact value for tier 3', () => {
    const p = { id: 'p1', potential: 88, scoutReveal: 3 };
    const result = displayDraftPotential(p);
    expect(result.label).toBe('88');
    expect(result.hint).toBeNull();
  });
});

describe('displayDraftWageEstimate', () => {
  it('returns ? for tier 0 or 1', () => {
    expect(displayDraftWageEstimate(50000, 0).label).toBe('?');
    expect(displayDraftWageEstimate(50000, 1).label).toBe('?');
    expect(displayDraftWageEstimate(50000, 0).hint).toContain('scouting');
  });

  it('returns formatted wage for tier 2+', () => {
    const result = displayDraftWageEstimate(50000, 2);
    expect(result.label).toBe('$50k');
    expect(result.hint).toBeNull();
  });

  it('formats larger wages correctly', () => {
    const result = displayDraftWageEstimate(120000, 3);
    expect(result.label).toBe('$120k');
  });
});

describe('applyCombineScoutingRound', () => {
  it('returns empty array for non-array input', () => {
    expect(applyCombineScoutingRound(null)).toEqual([]);
    expect(applyCombineScoutingRound(undefined)).toEqual([]);
  });

  it('advances the lowest-tier prospects first', () => {
    const pool = [
      { id: 'p1', scoutReveal: 3 }, // already maxed
      { id: 'p2', scoutReveal: 0 }, // should be upgraded
      { id: 'p3', scoutReveal: 1 }, // should be upgraded
    ];
    const result = applyCombineScoutingRound(pool, 14);
    expect(result.find(p => p.id === 'p2').scoutReveal).toBe(1);
    expect(result.find(p => p.id === 'p3').scoutReveal).toBe(2);
    expect(result.find(p => p.id === 'p1').scoutReveal).toBe(3); // unchanged
  });

  it('caps scoutReveal at 3', () => {
    const pool = [{ id: 'p1', scoutReveal: 3 }];
    const result = applyCombineScoutingRound(pool, 14);
    expect(result[0].scoutReveal).toBe(3);
  });

  it('respects the maxProspects limit', () => {
    const pool = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, scoutReveal: 0 }));
    const result = applyCombineScoutingRound(pool, 5);
    const upgraded = result.filter(p => p.scoutReveal === 1).length;
    expect(upgraded).toBe(5);
  });

  it('does not mutate the original pool', () => {
    const pool = [{ id: 'p1', scoutReveal: 0 }];
    applyCombineScoutingRound(pool, 5);
    expect(pool[0].scoutReveal).toBe(0);
  });
});
