import { describe, it, expect } from 'vitest';
import { starCount } from '../../components/primitives.jsx';

describe('starCount — AFL star tier from overall', () => {
  it('maps rating bands to 1–5 stars, monotonically', () => {
    expect(starCount(95)).toBe(5);
    expect(starCount(88)).toBe(5);
    expect(starCount(87)).toBe(4);
    expect(starCount(78)).toBe(4);
    expect(starCount(66)).toBe(3);
    expect(starCount(54)).toBe(2);
    expect(starCount(40)).toBe(1);
    expect(starCount(0)).toBe(1);
  });

  it('never returns below 1 or above 5, and is non-decreasing', () => {
    let prev = 0;
    for (let o = 0; o <= 100; o++) {
      const n = starCount(o);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
  });

  it('treats missing/undefined overall as the lowest tier', () => {
    expect(starCount(undefined)).toBe(1);
    expect(starCount(null)).toBe(1);
  });
});
