import { describe, it, expect } from 'vitest';
import {
  buildStaffRenewalQueue,
  proposeStaffRenewal,
  canAffordStaffRenewal,
  applyStaffRenewalAccept,
  applyStaffRenewalReject,
  flushUnhandledStaffRenewals,
} from '../staffRenewals.js';

describe('staff renewals', () => {
  it('buildStaffRenewalQueue lists only staff at contract 0', () => {
    const staff = [
      { id: 's1', name: 'A', role: 'Coach', rating: 70, wage: 50000, volunteer: false, contract: 0 },
      { id: 's2', name: 'B', role: 'Asst', rating: 65, wage: 0, volunteer: true, contract: 1 },
    ];
    const q = buildStaffRenewalQueue(staff);
    expect(q).toHaveLength(1);
    expect(q[0].staffId).toBe('s1');
  });

  it('proposeStaffRenewal returns null when contract remains', () => {
    const s = { id: 's1', name: 'A', role: 'Coach', contract: 2, wage: 1, volunteer: false };
    expect(proposeStaffRenewal(s)).toBe(null);
  });

  it('applyStaffRenewalAccept updates contract and wage', () => {
    const career = { staff: [{ id: 's1', contract: 0, wage: 100, volunteer: false }] };
    const prop = { staffId: 's1', proposedYears: 2, proposedWage: 120 };
    const patch = applyStaffRenewalAccept(career, prop);
    expect(patch.staff[0].contract).toBe(2);
    expect(patch.staff[0].wage).toBe(120);
  });

  it('volunteer renewals do not gate on cap', () => {
    const career = { difficulty: 'contender', squad: [], finance: { wageBudget: 1 }, staff: [] };
    const proposal = { volunteer: true, staffId: 's2', proposedWage: 0 };
    expect(canAffordStaffRenewal(career, proposal)).toBe(true);
  });

  it('reject rolls replacement with new name', () => {
    const career = {
      leagueKey: 'AFL',
      staff: [{ id: 's1', name: 'Old', role: 'Coach', rating: 70, wage: 80000, volunteer: false, contract: 0 }],
    };
    const proposal = { staffId: 's1', name: 'Old', role: 'Coach', volunteer: false };
    const patch = applyStaffRenewalReject(career, proposal, 1);
    expect(patch.staff[0].name).not.toBe('Old');
    expect(patch.staff[0].contract).toBeGreaterThanOrEqual(1);
  });

  it('flushUnhandledStaffRenewals auto-replaces and marks queue', () => {
    const career = {
      week: 1,
      leagueKey: 'AFL',
      staff: [{ id: 's1', name: 'Old', role: 'Coach', rating: 70, wage: 80000, volunteer: false, contract: 0 }],
      pendingStaffRenewals: [{ staffId: 's1', name: 'Old', role: 'Coach', volunteer: false }],
      news: [],
    };
    const out = flushUnhandledStaffRenewals(career, 1);
    expect(out.staff[0].name).not.toBe('Old');
    expect(out.pendingStaffRenewals[0]._handled).toBe('auto_replaced');
    expect(out.extraNews.length).toBe(1);
  });
});
