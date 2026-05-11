import { describe, it, expect } from 'vitest';
import { lineupStructureModifier, selectBalancedLineup } from '../lineupBalance.js';
import { teamRating } from '../matchEngine.js';

const training = () => ({ intensity: 60, focus: {} });

describe('lineupStructureModifier', () => {
  it('penalises a best side with no ruck', () => {
    const allMids = Array.from({ length: 23 }, (_, i) => ({
      id: `m${i}`,
      overall: 72,
      trueRating: 72,
      form: 70,
      fitness: 90,
      position: 'C',
    }));
    const withRuck = [...allMids.slice(1), { ...allMids[0], id: 'r1', position: 'RU' }];
    const bad = lineupStructureModifier(allMids, allMids.map((p) => p.id));
    const ok = lineupStructureModifier(withRuck, withRuck.map((p) => p.id));
    expect(bad).toBeLessThan(ok);
  });
});

describe('selectBalancedLineup', () => {
  it('places at least one primary ruck when available', () => {
    const squad = [
      { id: 'r', overall: 50, trueRating: 50, form: 70, fitness: 90, injured: 0, position: 'RU' },
      ...Array.from({ length: 31 }, (_, i) => ({
        id: `p${i}`,
        overall: 60,
        trueRating: 60,
        form: 70,
        fitness: 90,
        injured: 0,
        position: 'C',
      })),
    ];
    const pick = selectBalancedLineup(squad, 23);
    expect(pick.some((p) => p.position === 'RU')).toBe(true);
  });
});

describe('teamRating + structure', () => {
  it('rates an imbalanced on-field group lower than a balanced one at similar averages', () => {
    const base = { overall: 70, trueRating: 70, form: 70, fitness: 90 };
    const allC = Array.from({ length: 23 }, (_, i) => ({ ...base, id: `c${i}`, position: 'C' }));
    const mixed = [
      { ...base, id: 'ru', position: 'RU' },
      ...Array.from({ length: 4 }, (_, i) => ({ ...base, id: `b${i}`, position: 'KB' })),
      ...Array.from({ length: 4 }, (_, i) => ({ ...base, id: `f${i}`, position: 'KF' })),
      ...Array.from({ length: 6 }, (_, i) => ({ ...base, id: `m${i}`, position: 'C' })),
      ...Array.from({ length: 8 }, (_, i) => ({ ...base, id: `x${i}`, position: 'HB' })),
    ].slice(0, 23);
    const rIm = teamRating(allC, allC.map((p) => p.id), training(), 1, 60);
    const rBal = teamRating(mixed, mixed.map((p) => p.id), training(), 1, 60);
    expect(rBal).toBeGreaterThan(rIm);
  });
});
