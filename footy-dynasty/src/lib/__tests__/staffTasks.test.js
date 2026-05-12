import { describe, it, expect } from 'vitest';
import {
  ensureStaffTasks,
  negotiationDemandMultiplierRange,
  resolveScoutLeadMember,
  scoutAccuracyBonus,
} from '../staffTasks.js';

const stubStaff = [
  { id: 's1', role: 'Coach', name: 'A', rating: 72 },
  { id: 's7', role: 'Recruiter', name: 'B', rating: 80 },
  { id: 's8', role: 'Scout', name: 'C', rating: 70 },
];

describe('staffTasks assignments', () => {
  it('ensureStaffTasks drops ids not on roster', () => {
    const career = {
      staff: stubStaff,
      staffTasks: {
        recruitPriorityState: null,
        matchPrepTier: 0,
        trainingLeadId: 's2',
        scoutLeadId: 's8',
        tradeNegotiatorId: 'ghost',
      },
    };
    const t = ensureStaffTasks(career);
    expect(t.trainingLeadId).toBe(null);
    expect(t.scoutLeadId).toBe('s8');
    expect(t.tradeNegotiatorId).toBe(null);
  });

  it('trade negotiator overrides head recruiter band when set', () => {
    const tasks = ensureStaffTasks({
      staff: stubStaff,
      staffTasks: {
        recruitPriorityState: null,
        matchPrepTier: 0,
        trainingLeadId: null,
        scoutLeadId: null,
        tradeNegotiatorId: 's1',
      },
    });
    const auto = negotiationDemandMultiplierRange(stubStaff, ensureStaffTasks({ staff: stubStaff, staffTasks: {} }));
    const delegated = negotiationDemandMultiplierRange(stubStaff, tasks);
    expect(delegated.hi).toBeGreaterThan(auto.hi);
  });

  it('scout lead picks assigned staff before default s8', () => {
    const tasks = ensureStaffTasks({
      staff: stubStaff,
      staffTasks: { scoutLeadId: 's1' },
    });
    expect(resolveScoutLeadMember(stubStaff, tasks).id).toBe('s1');
    const bonusPick = scoutAccuracyBonus(stubStaff, tasks);
    const bonusDefault = scoutAccuracyBonus(stubStaff, ensureStaffTasks({ staff: stubStaff, staffTasks: {} }));
    expect(bonusPick).not.toBe(bonusDefault);
  });
});
