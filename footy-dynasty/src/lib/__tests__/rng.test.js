import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng, rng, rand, pick, randNorm, TIER_SCALE } from '../rng.js';

describe('rng', () => {
  beforeEach(() => seedRng(42));

  it('produces deterministic output from the same seed', () => {
    seedRng(100);
    const a = rng();
    seedRng(100);
    const b = rng();
    expect(a).toBe(b);
  });

  it('produces different values for different seeds', () => {
    seedRng(1);
    const a = rng();
    seedRng(2);
    const b = rng();
    expect(a).not.toBe(b);
  });

  it('produces values in [0, 1)', () => {
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('advances state on each call (no repeats in sequence)', () => {
    seedRng(42);
    const vals = Array.from({ length: 10 }, () => rng());
    const unique = new Set(vals);
    expect(unique.size).toBe(10);
  });
});

describe('rand', () => {
  beforeEach(() => seedRng(42));

  it('returns integers within [a, b] inclusive', () => {
    for (let i = 0; i < 500; i++) {
      const v = rand(1, 10);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('can return both boundary values over many calls', () => {
    seedRng(1);
    const vals = new Set(Array.from({ length: 500 }, () => rand(1, 5)));
    expect(vals.has(1)).toBe(true);
    expect(vals.has(5)).toBe(true);
  });

  it('handles a single-value range', () => {
    for (let i = 0; i < 20; i++) {
      expect(rand(7, 7)).toBe(7);
    }
  });

  it('is deterministic from the same seed', () => {
    seedRng(99);
    const a = Array.from({ length: 10 }, () => rand(1, 100));
    seedRng(99);
    const b = Array.from({ length: 10 }, () => rand(1, 100));
    expect(a).toEqual(b);
  });
});

describe('pick', () => {
  beforeEach(() => seedRng(42));

  it('always returns an element from the array', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(pick(arr));
    }
  });

  it('can return any element over many calls', () => {
    seedRng(1);
    const arr = [1, 2, 3, 4, 5];
    const seen = new Set(Array.from({ length: 200 }, () => pick(arr)));
    expect(seen.size).toBe(5);
  });

  it('is deterministic from the same seed', () => {
    const arr = ['x', 'y', 'z'];
    seedRng(55);
    const a = Array.from({ length: 10 }, () => pick(arr));
    seedRng(55);
    const b = Array.from({ length: 10 }, () => pick(arr));
    expect(a).toEqual(b);
  });
});

describe('randNorm', () => {
  beforeEach(() => seedRng(42));

  it('produces values clustered around the mean over many samples', () => {
    const samples = Array.from({ length: 2000 }, () => randNorm(68, 10));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // Mean should be within 2 of the target with 2000 samples
    expect(mean).toBeGreaterThan(65);
    expect(mean).toBeLessThan(71);
  });

  it('is deterministic from the same seed', () => {
    seedRng(7);
    const a = randNorm(50, 5);
    seedRng(7);
    const b = randNorm(50, 5);
    expect(a).toBe(b);
  });
});

describe('TIER_SCALE', () => {
  it('tier 1 has a scale of 1.00', () => {
    expect(TIER_SCALE[1]).toBe(1.00);
  });

  it('tier 2 has a scale of 0.80', () => {
    expect(TIER_SCALE[2]).toBe(0.80);
  });

  it('tier 3 has a scale of 0.64', () => {
    expect(TIER_SCALE[3]).toBe(0.64);
  });

  it('lower tiers have strictly lower scales', () => {
    expect(TIER_SCALE[1]).toBeGreaterThan(TIER_SCALE[2]);
    expect(TIER_SCALE[2]).toBeGreaterThan(TIER_SCALE[3]);
  });
});
