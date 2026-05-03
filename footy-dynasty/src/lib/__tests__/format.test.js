import { describe, it, expect } from 'vitest';
import { fmt, fmtK, clamp, avgFacilities, avgStaff } from '../format.js';

describe('fmt', () => {
  it('formats a number as AUD currency', () => {
    expect(fmt(1000)).toBe('$1,000');
    expect(fmt(1500000)).toBe('$1,500,000');
  });

  it('rounds before formatting', () => {
    expect(fmt(999.7)).toBe('$1,000');
  });

  it('handles zero', () => {
    expect(fmt(0)).toBe('$0');
  });
});

describe('fmtK', () => {
  it('formats millions with one decimal place', () => {
    expect(fmtK(1500000)).toBe('$1.5M');
    expect(fmtK(2000000)).toBe('$2.0M');
  });

  it('formats thousands with no decimal', () => {
    expect(fmtK(25000)).toBe('$25k');
    expect(fmtK(1000)).toBe('$1k');
  });

  it('formats small amounts verbatim', () => {
    expect(fmtK(500)).toBe('$500');
    expect(fmtK(0)).toBe('$0');
  });
});

describe('clamp', () => {
  it('returns min when value is below range', () => {
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(-1000, 30, 99)).toBe(30);
  });

  it('returns max when value is above range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(200, 30, 99)).toBe(99);
  });

  it('returns the value unchanged when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(68, 30, 99)).toBe(68);
  });

  it('handles exact boundary values', () => {
    expect(clamp(0, 0, 100)).toBe(0);
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

describe('avgFacilities', () => {
  it('returns the mean of all facility levels', () => {
    const f = {
      trainingGround: { level: 2 },
      gym:            { level: 4 },
      medical:        { level: 3 },
    };
    expect(avgFacilities(f)).toBeCloseTo(3);
  });

  it('returns 1 for all level-1 (default) facilities', () => {
    const f = Object.fromEntries(
      ['trainingGround', 'gym', 'medical', 'academy', 'stadium', 'recovery']
        .map(k => [k, { level: 1 }])
    );
    expect(avgFacilities(f)).toBe(1);
  });

  it('returns 5 when all facilities are maxed', () => {
    const f = Object.fromEntries(
      ['trainingGround', 'gym', 'medical', 'academy', 'stadium', 'recovery']
        .map(k => [k, { level: 5 }])
    );
    expect(avgFacilities(f)).toBe(5);
  });
});

describe('avgStaff', () => {
  it('returns the mean of staff ratings', () => {
    const staff = [{ rating: 60 }, { rating: 80 }, { rating: 70 }];
    expect(avgStaff(staff)).toBeCloseTo(70);
  });

  it('handles a single staff member', () => {
    expect(avgStaff([{ rating: 75 }])).toBe(75);
  });

  it('handles varied rating ranges', () => {
    const staff = [{ rating: 50 }, { rating: 50 }, { rating: 100 }, { rating: 100 }];
    expect(avgStaff(staff)).toBe(75);
  });
});
