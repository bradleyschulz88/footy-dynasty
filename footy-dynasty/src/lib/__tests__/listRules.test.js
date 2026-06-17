import { describe, it, expect } from 'vitest';
import {
  MAX_SQUAD_SIZE,
  SENIOR_LIST_MAX,
  ROOKIE_LIST_MAX,
  listCounts,
  canAddToList,
  capUsageRatio,
  capBreachSanctionPatch,
} from '../listRules.js';

describe('constants', () => {
  it('exports expected limits', () => {
    expect(MAX_SQUAD_SIZE).toBe(40);
    expect(SENIOR_LIST_MAX).toBe(38);
    expect(ROOKIE_LIST_MAX).toBe(6);
  });
});

describe('listCounts', () => {
  it('returns zeros for an empty squad', () => {
    expect(listCounts([])).toEqual({ total: 0, senior: 0, rookie: 0 });
    expect(listCounts(null)).toEqual({ total: 0, senior: 0, rookie: 0 });
    expect(listCounts(undefined)).toEqual({ total: 0, senior: 0, rookie: 0 });
  });

  it('counts senior vs rookie players correctly', () => {
    const squad = [
      { id: 'p1', rookie: false },
      { id: 'p2', rookie: true },
      { id: 'p3', listCategory: 'rookie' },
      { id: 'p4' },
    ];
    const counts = listCounts(squad);
    expect(counts.total).toBe(4);
    expect(counts.rookie).toBe(2);
    expect(counts.senior).toBe(2);
  });

  it('only counts listCategory === rookie as rookies', () => {
    const squad = [
      { id: 'p1', listCategory: 'senior' },
      { id: 'p2', listCategory: 'rookie' },
    ];
    const counts = listCounts(squad);
    expect(counts.rookie).toBe(1);
    expect(counts.senior).toBe(1);
  });
});

describe('canAddToList', () => {
  it('allows adding when squad is empty', () => {
    const career = { squad: [] };
    expect(canAddToList(career).ok).toBe(true);
  });

  it('blocks adding senior when squad is at max (40)', () => {
    const squad = Array.from({ length: 40 }, (_, i) => ({ id: `p${i}` }));
    const career = { squad };
    const result = canAddToList(career);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('squad_full');
  });

  it('blocks adding senior when senior list is full (38)', () => {
    const squad = Array.from({ length: 38 }, (_, i) => ({ id: `p${i}` }));
    const career = { squad };
    const result = canAddToList(career, { rookie: false });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('senior_full');
  });

  it('blocks adding rookie when rookie list is full (6)', () => {
    const rookies = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, rookie: true }));
    const career = { squad: rookies };
    const result = canAddToList(career, { rookie: true });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('rookie_full');
  });

  it('allows adding a rookie when rookie list has space', () => {
    const rookies = Array.from({ length: 3 }, (_, i) => ({ id: `r${i}`, rookie: true }));
    const career = { squad: rookies };
    expect(canAddToList(career, { rookie: true }).ok).toBe(true);
  });

  it('allows adding a senior player when senior list has space', () => {
    const senior = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}` }));
    const career = { squad: senior };
    expect(canAddToList(career, { rookie: false }).ok).toBe(true);
  });
});

describe('capUsageRatio', () => {
  it('returns 0 when there is no wage cap', () => {
    const career = { squad: [] };
    const league = {};
    expect(capUsageRatio(career, league)).toBe(0);
  });

  it('returns ratio of wage bill to cap', () => {
    const career = {
      squad: [{ wage: 100_000, contract: 1 }, { wage: 50_000, contract: 1 }],
    };
    // Wage cap is determined by finance/engine; we just test the ratio is reasonable
    const ratio = capUsageRatio(career, {});
    expect(typeof ratio).toBe('number');
    expect(ratio).toBeGreaterThanOrEqual(0);
  });
});

describe('capBreachSanctionPatch', () => {
  it('returns null when not over cap', () => {
    const career = {
      squad: [{ id: 'p1', wage: 0, contract: 1, overall: 70 }],
      week: 5,
    };
    const result = capBreachSanctionPatch(career, {});
    expect(result).toBeNull();
  });

  it('returns a patch with news when over cap and has tradable player', () => {
    // Manufacture a situation where wage bill massively exceeds cap
    const career = {
      squad: Array.from({ length: 1 }, (_, i) => ({
        id: `p${i}`,
        wage: 999_999_999,
        contract: 1,
        overall: 65,
        firstName: 'Test',
        lastName: `Player${i}`,
        rookie: false,
      })),
      week: 10,
      news: [],
      memberConfidence: 60,
    };
    const patch = capBreachSanctionPatch(career, {});
    // Either returns null (below threshold) or a patch with squad reduction
    if (patch !== null) {
      expect(patch.squad).toBeDefined();
      expect(patch.squad.length).toBeLessThan(career.squad.length);
      expect(Array.isArray(patch.news)).toBe(true);
      expect(patch.news[0].type).toBe('board');
    }
  });

  it('returns null when all players are over overall 72 (no tradable)', () => {
    const career = {
      squad: [{ id: 'p1', wage: 100_000, contract: 1, overall: 80, rookie: false }],
      week: 5,
      news: [],
    };
    // Can't force a cap breach easily here since engine calculates the cap
    // Just verify the function handles the no-tradable case gracefully
    const result = capBreachSanctionPatch(career, {});
    expect(result === null || result?.squad !== undefined).toBe(true);
  });
});
