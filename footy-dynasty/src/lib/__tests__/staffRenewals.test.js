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

  it('volunteer renewals do not gate on finances', () => {
    const career = { finance: { cash: -500_000 } };
    const proposal = { volunteer: true, staffId: 's2', proposedWage: 0 };
    expect(canAffordStaffRenewal(career, proposal)).toBe(true);
  });

  it('paid raise blocked when club cash is negative', () => {
    const career = { finance: { cash: -1 } };
    const proposal = { volunteer: false, staffId: 's1', currentWage: 50_000, proposedWage: 52_000 };
    expect(canAffordStaffRenewal(career, proposal)).toBe(false);
  });

  it('paid raise blocked when cash cannot cover liquidity buffer', () => {
    const career = { finance: { cash: 100 } };
    const proposal = { volunteer: false, staffId: 's1', currentWage: 50_000, proposedWage: 60_000 };
    expect(canAffordStaffRenewal(career, proposal)).toBe(false);
  });

  it('paid raise allowed when cash covers liquidity buffer on wage delta', () => {
    const career = { finance: { cash: 50_000 } };
    const proposal = { volunteer: false, staffId: 's1', currentWage: 50_000, proposedWage: 60_000 };
    expect(canAffordStaffRenewal(career, proposal)).toBe(true);
  });

  it('flat or reduced wage offers always allowed when cash non-negative', () => {
    const career = { finance: { cash: 0 } };
    expect(canAffordStaffRenewal(career, { volunteer: false, currentWage: 80_000, proposedWage: 80_000 })).toBe(true);
    expect(canAffordStaffRenewal(career, { volunteer: false, currentWage: 80_000, proposedWage: 70_000 })).toBe(true);
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
