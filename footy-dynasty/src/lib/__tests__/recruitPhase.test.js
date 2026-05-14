import { describe, it, expect } from 'vitest';
import {
  isDraftLive,
  isPlayerDraftTurn,
  draftPickBlocksAdvance,
  isPostSeasonTradePeriod,
} from '../recruitPhase.js';

describe('recruitPhase', () => {
  it('detects live draft with unused picks', () => {
    const career = {
      clubId: 'c1',
      draftOrder: [{ pick: 1, clubId: 'c1', used: false }],
      draftPool: [{ id: 'p1' }],
    };
    expect(isDraftLive(career)).toBe(true);
    expect(isPlayerDraftTurn(career)).toBe(true);
    expect(draftPickBlocksAdvance(career)).toBe(true);
  });

  it('detects post-season trade period', () => {
    expect(
      isPostSeasonTradePeriod({ postSeasonPhase: 'trade_period', inTradePeriod: true }),
    ).toBe(true);
  });
});
