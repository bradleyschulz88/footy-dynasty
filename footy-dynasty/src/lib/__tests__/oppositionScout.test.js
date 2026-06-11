import { describe, it, expect } from 'vitest';
import { scoutPrepRatingBonus } from '../oppositionScout.js';

describe('scoutPrepRatingBonus', () => {
  const career = { season: 3, opponentScout: { fitz: { tier: 1, season: 3, round: 5 } } };

  it('applies only for the scouted opponent, season, and round', () => {
    expect(scoutPrepRatingBonus(career, 'fitz', 5)).toBeCloseTo(0.8);
    expect(scoutPrepRatingBonus(career, 'fitz', 6)).toBe(0);
    expect(scoutPrepRatingBonus({ ...career, season: 4 }, 'fitz', 5)).toBe(0);
    expect(scoutPrepRatingBonus(career, 'other', 5)).toBe(0);
    expect(scoutPrepRatingBonus({}, 'fitz', 5)).toBe(0);
  });

  it('deeper intel gives a bigger edge', () => {
    const deep = { season: 3, opponentScout: { fitz: { tier: 2, season: 3, round: 5 } } };
    expect(scoutPrepRatingBonus(deep, 'fitz', 5)).toBeGreaterThan(scoutPrepRatingBonus(career, 'fitz', 5));
  });
});
