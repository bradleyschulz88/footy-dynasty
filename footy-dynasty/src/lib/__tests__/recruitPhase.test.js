import { describe, it, expect } from 'vitest';
import {
  isDraftLive,
  isDraftScoutingPhase,
  hasUnackedDraftScouting,
  isPlayerDraftTurn,
  draftPickBlocksAdvance,
  isPostSeasonTradePeriod,
  nationalDraftDayDate,
} from '../recruitPhase.js';

describe('recruitPhase', () => {
  it('detects live draft only when phase is live', () => {
    const scouting = {
      clubId: 'c1',
      draftPhase: 'scouting',
      draftOrder: [{ pick: 1, clubId: 'c1', used: false }],
      draftPool: [{ id: 'p1' }],
    };
    expect(isDraftScoutingPhase(scouting)).toBe(true);
    expect(isDraftLive(scouting)).toBe(false);
    expect(isPlayerDraftTurn(scouting)).toBe(false);
    expect(draftPickBlocksAdvance(scouting)).toBe(false);

    const live = { ...scouting, draftPhase: 'live' };
    expect(isDraftLive(live)).toBe(true);
    expect(isPlayerDraftTurn(live)).toBe(true);
    expect(draftPickBlocksAdvance(live)).toBe(true);
  });

  it('nationalDraftDayDate defaults to Jan 10 of season', () => {
    expect(nationalDraftDayDate({ season: 2026 })).toBe('2026-01-10');
  });

  it('detects post-season trade period', () => {
    expect(
      isPostSeasonTradePeriod({ postSeasonPhase: 'trade_period', inTradePeriod: true }),
    ).toBe(true);
  });

  it('hasUnackedDraftScouting until briefing ack', () => {
    const scouting = {
      draftPhase: 'scouting',
      draftOrder: [{ pick: 1, clubId: 'c1', used: false }],
      draftPool: [{ id: 'p1' }],
      draftBriefingAck: false,
    };
    expect(hasUnackedDraftScouting(scouting)).toBe(true);
    expect(hasUnackedDraftScouting({ ...scouting, draftBriefingAck: true })).toBe(false);
  });
});
