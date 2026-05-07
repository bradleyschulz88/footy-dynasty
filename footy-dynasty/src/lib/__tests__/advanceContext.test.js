import { describe, it, expect } from 'vitest';
import { getAdvanceContext } from '../advanceContext.js';
import { TRADE_PERIOD_DAYS } from '../tradePeriod.js';

const league = { tier: 1, name: 'Test League' };

describe('getAdvanceContext', () => {
  it('labels trade period advances', () => {
    const career = {
      postSeasonPhase: 'trade_period',
      inTradePeriod: true,
      tradePeriodDay: 2,
      freeAgencyOpen: false,
      eventQueue: [],
    };
    const ctx = getAdvanceContext(career, league);
    expect(ctx.mode).toBe('trade_period');
    expect(ctx.buttonLabel.toLowerCase()).toContain('advance');
    expect(ctx.summary).toContain(`${TRADE_PERIOD_DAYS}`);
  });

  it('labels draft countdown', () => {
    const career = {
      postSeasonPhase: 'draft_waiting',
      postSeasonDraftCountdown: 3,
      eventQueue: [],
    };
    const ctx = getAdvanceContext(career, league);
    expect(ctx.mode).toBe('draft_countdown');
    expect(ctx.buttonLabel.toLowerCase()).toContain('count');
  });

  it('uses calendar copy when the next event is training', () => {
    const career = {
      postSeasonPhase: 'none',
      eventQueue: [{ type: 'training', subtype: 'skills', completed: false }],
    };
    const ctx = getAdvanceContext(career, league);
    expect(ctx.mode).toBe('calendar');
    expect(ctx.buttonLabel).toMatch(/advance/i);
  });
});
