import { describe, it, expect } from 'vitest';
import { matchPrepStaffLine, trainingStaffSupportLine } from '../staffModifiers.js';

describe('matchPrepStaffLine', () => {
  it('returns null for empty staff', () => {
    expect(matchPrepStaffLine([], {})).toBeNull();
    expect(matchPrepStaffLine(null, {})).toBeNull();
  });

  it('returns null when s4 (midfield coach) not present', () => {
    const staff = [{ id: 's1', role: 'Senior Coach', rating: 80 }];
    expect(matchPrepStaffLine(staff, {})).toBeNull();
  });

  it('returns strong midfield line for s4 rating >= 78', () => {
    const staff = [{ id: 's4', role: 'Midfield Coach', rating: 80 }];
    const result = matchPrepStaffLine(staff, {});
    expect(result).toContain('sharp midfield');
  });

  it('returns solid planning line for s4 rating 65-77', () => {
    const staff = [{ id: 's4', role: 'Midfield Coach', rating: 70 }];
    const result = matchPrepStaffLine(staff, {});
    expect(result).toContain('solid weekly');
  });

  it('returns lightweight line for s4 rating < 65', () => {
    const staff = [{ id: 's4', role: 'Midfield Coach', rating: 55 }];
    const result = matchPrepStaffLine(staff, {});
    expect(result).toContain('lightweight');
  });

  it('adds analyst bundle line when matchPrepTier >= 2 and analyst rating >= 58', () => {
    const staff = [
      { id: 's4', role: 'Midfield Coach', rating: 80 },
      { id: 's10', role: 'Performance Analyst', rating: 65 },
    ];
    const career = { staffTasks: { matchPrepTier: 2 } };
    const result = matchPrepStaffLine(staff, career);
    expect(result).toContain('Analyst bundle');
  });

  it('adds analyst desk line when matchPrepTier >= 1 and analyst rating >= 52', () => {
    const staff = [
      { id: 's4', role: 'Midfield Coach', rating: 80 },
      { id: 's10', role: 'Performance Analyst', rating: 55 },
    ];
    const career = { staffTasks: { matchPrepTier: 1 } };
    const result = matchPrepStaffLine(staff, career);
    expect(result).toContain('Analyst desk');
  });

  it('adds stretched capacity line when matchPrepTier >= 1 but analyst is weak', () => {
    const staff = [
      { id: 's4', role: 'Midfield Coach', rating: 80 },
      { id: 's10', role: 'Performance Analyst', rating: 40 },
    ];
    const career = { staffTasks: { matchPrepTier: 1 } };
    const result = matchPrepStaffLine(staff, career);
    expect(result).toContain('stretched');
  });

  it('handles no analyst present with tier >= 1', () => {
    const staff = [{ id: 's4', role: 'Midfield Coach', rating: 80 }];
    const career = { staffTasks: { matchPrepTier: 1 } };
    const result = matchPrepStaffLine(staff, career);
    // Should still return midfield line without crashing
    expect(result).toBeTruthy();
  });

  it('handles missing career staffTasks gracefully', () => {
    const staff = [{ id: 's4', role: 'Midfield Coach', rating: 70 }];
    const result = matchPrepStaffLine(staff, null);
    expect(result).toBeTruthy();
  });
});

describe('trainingStaffSupportLine', () => {
  it('returns strong coaching line for high average rating (>=72)', () => {
    const staff = [{ rating: 80 }, { rating: 75 }, { rating: 70 }];
    const result = trainingStaffSupportLine(staff, 25);
    expect(result).toContain('Strong');
  });

  it('returns workable line for mid-range average rating (58-71)', () => {
    const staff = [{ rating: 60 }, { rating: 65 }];
    const result = trainingStaffSupportLine(staff, 25);
    expect(result).toContain('workable');
  });

  it('returns volunteer-heavy line for low average rating (<58)', () => {
    const staff = [{ rating: 45 }, { rating: 50 }];
    const result = trainingStaffSupportLine(staff, 25);
    expect(result).toContain('Volunteer');
  });

  it('returns a string when staff is empty', () => {
    const result = trainingStaffSupportLine([], 25);
    expect(typeof result).toBe('string');
  });

  it('returns a string for null staff', () => {
    const result = trainingStaffSupportLine(null, 25);
    expect(typeof result).toBe('string');
  });

  it('adds high tactics emphasis prefix when focus pct >= 28', () => {
    const staff = [{ rating: 80 }, { rating: 80 }];
    const result = trainingStaffSupportLine(staff, 30);
    expect(result).toContain('High tactics emphasis');
  });

  it('does not add tactics prefix when focus pct < 28', () => {
    const staff = [{ rating: 80 }, { rating: 80 }];
    const result = trainingStaffSupportLine(staff, 25);
    expect(result).not.toContain('High tactics emphasis');
  });

  it('mentions fatigue when tactics emphasis is high and staff is thin', () => {
    const staff = [{ rating: 45 }, { rating: 50 }];
    const result = trainingStaffSupportLine(staff, 30);
    expect(result).toContain('fatigue');
  });
});
