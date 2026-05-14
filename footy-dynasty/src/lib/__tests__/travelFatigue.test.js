import { describe, it, expect } from 'vitest';
import { awayTravelRatingPenalty } from '../travelFatigue.js';

describe('awayTravelRatingPenalty', () => {
  it('is zero at home', () => {
    expect(awayTravelRatingPenalty(true, 'carlton', 'collingwood')).toBe(0);
  });

  it('is positive for interstate away', () => {
    expect(awayTravelRatingPenalty(false, 'car', 'fre')).toBeGreaterThan(0);
  });

  it('is zero for same-state away', () => {
    expect(awayTravelRatingPenalty(false, 'car', 'col')).toBe(0);
  });
});
