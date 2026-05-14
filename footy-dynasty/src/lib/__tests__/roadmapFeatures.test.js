import { describe, it, expect } from 'vitest';
import { buildOppositionReport } from '../oppositionScout.js';
import { canAddToList, listCounts } from '../listRules.js';
import { finalsMagicNumber } from '../magicNumber.js';

describe('oppositionScout', () => {
  it('builds basic report when next round exists', () => {
    const career = {
      clubId: 'carlton',
      week: 5,
      squad: [{ id: 'p1', overall: 75, position: 'C', firstName: 'A', lastName: 'B' }],
      lineup: ['p1'],
      training: { intensity: 60, focus: {} },
      ladder: [{ id: 'carlton', pts: 20, form: 'WWLLW', played: 5 }],
      eventQueue: [{
        type: 'round',
        round: 6,
        completed: false,
        matches: [{ home: 'carlton', away: 'collingwood' }],
      }],
    };
    const league = { tier: 1, clubs: [{ id: 'carlton' }, { id: 'collingwood' }] };
    const report = buildOppositionReport(career, league);
    expect(report?.oppShort).toBeTruthy();
    expect(report?.matchupNote).toBeTruthy();
  });
});

describe('listRules', () => {
  it('blocks full senior list', () => {
    const squad = Array.from({ length: 38 }, (_, i) => ({ id: `s${i}`, rookie: false }));
    const r = canAddToList({ squad }, { rookie: false });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('senior_full');
  });
  it('counts rookies separately', () => {
    const squad = [{ rookie: true }, { rookie: false }];
    expect(listCounts(squad)).toMatchObject({ total: 2, rookie: 1, senior: 1 });
  });
});

describe('magicNumber', () => {
  it('returns clinch label when far ahead', () => {
    const career = {
      clubId: 'a',
      totalRounds: 23,
      ladder: [
        { id: 'a', pts: 80, played: 20, W: 20, L: 0, D: 0 },
        ...Array.from({ length: 7 }, (_, i) => ({ id: `t${i}`, pts: 40, played: 20 })),
      ],
    };
    const mn = finalsMagicNumber(career);
    expect(mn?.clinched || mn?.winsNeeded != null).toBeTruthy();
  });
});
