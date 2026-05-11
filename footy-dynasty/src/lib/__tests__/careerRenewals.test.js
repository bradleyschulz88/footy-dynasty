import { describe, it, expect } from 'vitest';
import { applySeasonRenewalDeadline } from '../careerAdvance.js';
import { PYRAMID } from '../../data/pyramid.js';

describe('applySeasonRenewalDeadline', () => {
  const league = PYRAMID.AFL;

  it('closes renewals and auto-replaces unhandled staff', () => {
    const career = {
      renewalsClosed: false,
      week: 1,
      leagueKey: 'AFL',
      staff: [
        { id: 's1', name: 'Old Coach', role: 'Coach', rating: 70, wage: 80000, volunteer: false, contract: 0 },
      ],
      pendingStaffRenewals: [
        { staffId: 's1', name: 'Old Coach', role: 'Coach', volunteer: false, currentWage: 80000, proposedWage: 90000, proposedYears: 2 },
      ],
      news: [],
    };
    applySeasonRenewalDeadline(career, league);
    expect(career.renewalsClosed).toBe(true);
    expect(career.staff[0].name).not.toBe('Old Coach');
    expect(career.pendingStaffRenewals.every((r) => r._handled)).toBe(true);
  });

  it('is a no-op when renewals already closed', () => {
    const career = {
      renewalsClosed: true,
      staff: [{ id: 's1', name: 'Same', role: 'Coach', rating: 70, wage: 1, volunteer: false, contract: 2 }],
      pendingStaffRenewals: [],
      news: [],
    };
    applySeasonRenewalDeadline(career, league);
    expect(career.staff[0].name).toBe('Same');
  });
});
