import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import { hireBlueprintStaff, listExpandableHires, recruitVolunteerStaff } from '../staffHiring.js';

describe('staffHiring', () => {
  const tier3Career = () => ({
    leagueKey: 'AFLCanberra',
    clubId: 'aflcanberra_adfa',
    week: 5,
    finance: { cash: 50_000 },
    staff: [
      { id: 's1', role: 'Coach', name: 'A', rating: 60, wage: 10000, volunteer: false, contract: 2 },
      { id: 's2', role: 'Fwd', name: 'B', rating: 55, wage: 0, volunteer: true, contract: 1 },
      { id: 's4', role: 'Mid', name: 'C', rating: 55, wage: 0, volunteer: true, contract: 1 },
      { id: 's5', role: 'Fit', name: 'D', rating: 55, wage: 0, volunteer: true, contract: 1 },
      { id: 's6', role: 'Med', name: 'E', rating: 58, wage: 0, volunteer: true, contract: 1 },
    ],
    news: [],
  });

  beforeEach(() => seedRng(42));

  it('lists expandable tier-3 roles excluding existing ids', () => {
    const ids = listExpandableHires(tier3Career());
    expect(ids).toContain('s7');
    expect(ids).toContain('s8');
    expect(ids).not.toContain('s1');
  });

  it('hireBlueprintStaff appends staff and deducts cash', () => {
    const c = tier3Career();
    const before = c.finance.cash;
    const r = hireBlueprintStaff(c, 's8');
    expect(r.ok).toBe(true);
    expect(r.staff.length).toBe(c.staff.length + 1);
    expect(r.staff.some((s) => s.id === 's8')).toBe(true);
    expect(r.finance.cash).toBeLessThan(before);
  });

  it('recruitVolunteerStaff adds vol id and keeps wage 0', () => {
    const c = tier3Career();
    const r = recruitVolunteerStaff(c, 0);
    expect(r.ok).toBe(true);
    const v = r.staff[r.staff.length - 1];
    expect(v.volunteer).toBe(true);
    expect(v.wage).toBe(0);
    expect(v.id.startsWith('vol_')).toBe(true);
  });
});
