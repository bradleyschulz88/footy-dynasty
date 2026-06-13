import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import {
  isPromotionPlayoffEligible,
  clubBacksPromotion,
  runPromotionPlayoff,
  TIER3_PROMOTION_TITLE_REQ,
  TIER3_PROMOTION_BOARD_REQ,
} from '../promotionPlayoff.js';

const squadOf = (overall, n = 24) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, overall }));

describe('isPromotionPlayoffEligible', () => {
  it('is false below the required consecutive Division 1 flags', () => {
    expect(isPromotionPlayoffEligible({ tier3Div1Titles: TIER3_PROMOTION_TITLE_REQ - 1 })).toBe(false);
  });
  it('is true once the streak is reached', () => {
    expect(isPromotionPlayoffEligible({ tier3Div1Titles: TIER3_PROMOTION_TITLE_REQ })).toBe(true);
  });
  it('treats a missing counter as zero', () => {
    expect(isPromotionPlayoffEligible({})).toBe(false);
  });
});

describe('clubBacksPromotion', () => {
  it('requires board confidence at or above the threshold', () => {
    expect(clubBacksPromotion({ finance: { boardConfidence: TIER3_PROMOTION_BOARD_REQ } })).toBe(true);
    expect(clubBacksPromotion({ finance: { boardConfidence: TIER3_PROMOTION_BOARD_REQ - 1 } })).toBe(false);
  });
});

describe('runPromotionPlayoff', () => {
  beforeEach(() => seedRng(7));

  it('produces a four-team table', () => {
    const r = runPromotionPlayoff({ clubId: 'x', squad: squadOf(70) });
    expect(r.table).toHaveLength(4);
    expect(r.table.filter((t) => t.isMe)).toHaveLength(1);
  });

  it('distributes exactly 24 points across the round-robin (6 games × 4)', () => {
    const r = runPromotionPlayoff({ clubId: 'x', squad: squadOf(70) });
    const total = r.table.reduce((a, t) => a + t.pts, 0);
    expect(total).toBe(24);
  });

  it('won is true only when the club finishes first', () => {
    const r = runPromotionPlayoff({ clubId: 'x', squad: squadOf(70) });
    expect(r.won).toBe(r.myPos === 1);
  });

  it('an overwhelmingly strong squad wins the group', () => {
    // Opponents are pitched within a few points of the manager's strength, so a
    // 99-rated list clears the gap reliably across several seeds.
    let wins = 0;
    for (let s = 1; s <= 8; s++) {
      seedRng(s);
      if (runPromotionPlayoff({ clubId: 'x', squad: squadOf(99) }).won) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(5);
  });
});
