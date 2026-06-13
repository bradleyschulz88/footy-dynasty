import { describe, it, expect } from 'vitest';
import { competitiveOppRating } from '../matchEngine.js';
import { getDifficultyConfig } from '../difficulty.js';

describe('competitiveOppRating', () => {
  it('never lowers the opponent rating (only ever pushes back)', () => {
    // Opponent already stronger than the player — no help handed to the player.
    expect(competitiveOppRating(80, 60, { flat: 6, gapClose: 0.65 })).toBe(86); // only the flat bump
    expect(competitiveOppRating(80, 80, { flat: 0, gapClose: 0.5 })).toBe(80);
  });

  it('closes a fraction of the gap when the player outclasses the opponent', () => {
    // 30-pt gap, 0.5 close → +15, plus flat 0.
    expect(competitiveOppRating(50, 80, { flat: 0, gapClose: 0.5 })).toBe(65);
  });

  it('caps the boost so weak clubs cannot become superhuman', () => {
    // Huge 60-pt gap at 0.65 would be +39, but the cap holds it to +16.
    expect(competitiveOppRating(40, 100, { flat: 6, gapClose: 0.65, cap: 16 })).toBe(56);
  });

  it('scales with difficulty: legend pushes back harder than grassroots', () => {
    const my = 85, opp = 60;
    const easy = getDifficultyConfig('grassroots');
    const hard = getDifficultyConfig('legend');
    const easyR = competitiveOppRating(opp, my, { flat: easy.aiRatingFlat, gapClose: easy.aiGapClose });
    const hardR = competitiveOppRating(opp, my, { flat: hard.aiRatingFlat, gapClose: hard.aiGapClose });
    expect(hardR).toBeGreaterThan(easyR);
    expect(easyR).toBeGreaterThan(opp); // even grassroots nudges up a touch
  });
});
