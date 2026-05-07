import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng, TIER_SCALE } from '../rng.js';
import { generatePlayer, generateSquad, POSITIONS, POSITION_NAMES, playerHasPosition, isForwardPreferred, formatPositionSlash } from '../playerGen.js';

// ---------------------------------------------------------------------------
// generatePlayer
// ---------------------------------------------------------------------------
describe('generatePlayer', () => {
  beforeEach(() => seedRng(42));

  it('returns an object with all required fields', () => {
    const p = generatePlayer(1, 0);
    expect(p).toMatchObject({
      id:         expect.stringContaining('p_'),
      name:       expect.any(String),
      firstName:  expect.any(String),
      lastName:   expect.any(String),
      age:        expect.any(Number),
      position:   expect.any(String),
      secondaryPosition: expect.anything(),
      attrs:      expect.any(Object),
      overall:    expect.any(Number),
      trueRating: expect.any(Number),
      potential:  expect.any(Number),
      fitness:    expect.any(Number),
      morale:     expect.any(Number),
      form:       expect.any(Number),
      contract:   expect.any(Number),
      wage:       expect.any(Number),
      value:      expect.any(Number),
    });
  });

  it('all individual attributes are clamped to [30, 99]', () => {
    for (let i = 0; i < 30; i++) {
      const p = generatePlayer(2, i);
      Object.values(p.attrs).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(30);
        expect(v).toBeLessThanOrEqual(99);
      });
    }
  });

  it('overall is the rounded mean of all 8 attributes', () => {
    const p = generatePlayer(1, 0);
    const attrValues = Object.values(p.attrs);
    expect(attrValues).toHaveLength(8);
    const expected = Math.round(attrValues.reduce((a, b) => a + b, 0) / 8);
    expect(p.overall).toBe(expected);
  });

  it('trueRating equals round(overall * TIER_SCALE[tier]) for every tier', () => {
    [1, 2, 3].forEach(tier => {
      seedRng(42);
      const p = generatePlayer(tier, 0);
      expect(p.trueRating).toBe(Math.round(p.overall * TIER_SCALE[tier]));
    });
  });

  it('trueRating is lower for lower tiers when overall is the same', () => {
    // Tier scaling: same seed, different tiers → same overall but different trueRating
    seedRng(42); const t1 = generatePlayer(1, 0);
    seedRng(42); const t2 = generatePlayer(2, 0);
    seedRng(42); const t3 = generatePlayer(3, 0);
    expect(t1.trueRating).toBeGreaterThanOrEqual(t2.trueRating);
    expect(t2.trueRating).toBeGreaterThanOrEqual(t3.trueRating);
  });

  it('secondaryPosition is null or a different valid position', () => {
    for (let i = 0; i < 80; i++) {
      const p = generatePlayer(1, i);
      if (p.secondaryPosition == null) continue;
      expect(p.secondaryPosition).not.toBe(p.position);
      expect(POSITIONS).toContain(p.secondaryPosition);
    }
  });

  it('playerHasPosition matches primary or secondary', () => {
    const p = { position: 'C', secondaryPosition: 'HF' };
    expect(playerHasPosition(p, 'C')).toBe(true);
    expect(playerHasPosition(p, 'HF')).toBe(true);
    expect(playerHasPosition(p, 'KB')).toBe(false);
  });

  it('isForwardPreferred is true when secondary is a forward', () => {
    expect(isForwardPreferred({ position: 'C', secondaryPosition: 'HF' })).toBe(true);
    expect(isForwardPreferred({ position: 'C', secondaryPosition: 'HB' })).toBe(false);
  });

  it('formatPositionSlash shows both when present', () => {
    expect(formatPositionSlash({ position: 'WG', secondaryPosition: 'HB' })).toBe('WG / HB');
    expect(formatPositionSlash({ position: 'RU', secondaryPosition: null })).toBe('RU');
  });

  it('position is always a valid AFL position code', () => {
    for (let i = 0; i < 60; i++) {
      const p = generatePlayer(1, i);
      expect(POSITIONS).toContain(p.position);
    }
  });

  it('age is between 17 and 36', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePlayer(2, i);
      expect(p.age).toBeGreaterThanOrEqual(17);
      expect(p.age).toBeLessThanOrEqual(36);
    }
  });

  it('fitness is between 85 and 100', () => {
    for (let i = 0; i < 30; i++) {
      const p = generatePlayer(1, i);
      expect(p.fitness).toBeGreaterThanOrEqual(85);
      expect(p.fitness).toBeLessThanOrEqual(100);
    }
  });

  it('contract is between 1 and 4 years', () => {
    for (let i = 0; i < 30; i++) {
      const p = generatePlayer(1, i);
      expect(p.contract).toBeGreaterThanOrEqual(1);
      expect(p.contract).toBeLessThanOrEqual(4);
    }
  });

  it('tier-1 wages are substantially higher than tier-3 wages', () => {
    seedRng(42); const t1 = generatePlayer(1, 0);
    seedRng(42); const t3 = generatePlayer(3, 0);
    expect(t1.wage).toBeGreaterThan(t3.wage * 5);
  });

  it('flags players aged 19 or under as rookies', () => {
    // Run enough players that we are likely to hit a 17-19 year old
    let foundRookie = false;
    for (let i = 0; i < 200; i++) {
      const p = generatePlayer(1, i);
      if (p.age <= 19) {
        expect(p.rookie).toBe(true);
        foundRookie = true;
      } else {
        expect(p.rookie).toBe(false);
      }
    }
    expect(foundRookie).toBe(true);
  });

  it('season stats start at zero', () => {
    const p = generatePlayer(1, 0);
    expect(p.goals).toBe(0);
    expect(p.behinds).toBe(0);
    expect(p.disposals).toBe(0);
    expect(p.gamesPlayed).toBe(0);
    expect(p.injured).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// generateSquad
// ---------------------------------------------------------------------------
describe('generateSquad', () => {
  it('returns the requested number of players', () => {
    expect(generateSquad('ade', 1, 32)).toHaveLength(32);
    expect(generateSquad('ade', 1, 22)).toHaveLength(22);
  });

  it('defaults to 32 players', () => {
    expect(generateSquad('ade', 1)).toHaveLength(32);
  });

  it('is fully deterministic — same clubId always produces the same squad', () => {
    const a = generateSquad('col', 1, 10);
    const b = generateSquad('col', 1, 10);
    expect(a.map(p => p.overall)).toEqual(b.map(p => p.overall));
    expect(a.map(p => p.position)).toEqual(b.map(p => p.position));
    expect(a.map(p => p.secondaryPosition)).toEqual(b.map(p => p.secondaryPosition));
  });

  it('different clubs produce different squads', () => {
    const ade = generateSquad('ade', 1, 10);
    const col = generateSquad('col', 1, 10);
    expect(ade.map(p => p.overall)).not.toEqual(col.map(p => p.overall));
  });

  it('every player in the squad has a unique id', () => {
    const squad = generateSquad('ade', 1, 32);
    const ids = squad.map(p => p.id);
    expect(new Set(ids).size).toBe(32);
  });

  it('all players have the correct tier recorded', () => {
    const squad = generateSquad('ade', 2, 10);
    squad.forEach(p => expect(p.tier).toBe(2));
  });
});

// ---------------------------------------------------------------------------
// POSITIONS / POSITION_NAMES constants
// ---------------------------------------------------------------------------
describe('POSITIONS', () => {
  it('contains exactly 9 position codes', () => {
    expect(POSITIONS).toHaveLength(9);
  });

  it('every position code has a display name in POSITION_NAMES', () => {
    POSITIONS.forEach(pos => {
      expect(POSITION_NAMES[pos]).toBeDefined();
      expect(typeof POSITION_NAMES[pos]).toBe('string');
    });
  });
});
