import { describe, it, expect } from 'vitest';
import {
  addDays, formatDate, getMonth, getYear, getDayOfMonth, getDayOfWeek,
  isSameMonth, startOfMonth, daysInMonth, prevMonth, nextMonth,
} from '../calendar.js';

describe('addDays', () => {
  it('adds 7 days within same month', () => {
    expect(addDays('2025-12-01', 7)).toBe('2025-12-08');
  });

  it('crosses a month boundary', () => {
    expect(addDays('2025-12-28', 5)).toBe('2026-01-02');
  });

  it('adding 0 returns the same date', () => {
    expect(addDays('2025-12-01', 0)).toBe('2025-12-01');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string containing a day number and month string', () => {
    const result = formatDate('2025-12-01');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/Dec/i);
  });
});

describe('getMonth', () => {
  it('extracts the month number', () => {
    expect(getMonth('2025-12-01')).toBe(12);
  });
});

describe('getYear', () => {
  it('extracts the year', () => {
    expect(getYear('2026-03-21')).toBe(2026);
  });
});

describe('getDayOfMonth', () => {
  it('extracts the day of month', () => {
    expect(getDayOfMonth('2026-03-21')).toBe(21);
  });
});

describe('getDayOfWeek', () => {
  it('returns 1 for Monday Dec 1 2025', () => {
    expect(getDayOfWeek('2025-12-01')).toBe(1);
  });
});

describe('isSameMonth', () => {
  it('returns true for two dates in the same month', () => {
    expect(isSameMonth('2025-12-01', '2025-12-31')).toBe(true);
  });

  it('returns false for dates in different months', () => {
    expect(isSameMonth('2025-12-31', '2026-01-01')).toBe(false);
  });
});

describe('startOfMonth', () => {
  it('returns the first day of the month', () => {
    expect(startOfMonth('2025-12-15')).toBe('2025-12-01');
  });
});

describe('daysInMonth', () => {
  it('returns 28 for February 2026 (non-leap year)', () => {
    expect(daysInMonth('2026-02-01')).toBe(28);
  });

  it('returns 31 for January 2026', () => {
    expect(daysInMonth('2026-01-01')).toBe(31);
  });
});

describe('prevMonth', () => {
  it('moves back from January to December of previous year', () => {
    expect(prevMonth('2026-01-01')).toBe('2025-12-01');
  });
});

describe('nextMonth', () => {
  it('advances from December 2025 to January 2026', () => {
    expect(nextMonth('2025-12-01')).toBe('2026-01-01');
  });

  it('crosses a year boundary', () => {
    expect(nextMonth('2026-12-01')).toBe('2027-01-01');
  });
});
