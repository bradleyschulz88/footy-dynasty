import { describe, it, expect, beforeEach } from 'vitest';
import {
  beginPostSeasonTradePeriod,
  advanceTradePeriodDay,
  advanceDraftCountdown,
  playerBlockedFromTrade,
  TRADE_PERIOD_DAYS,
} from '../tradePeriod.js';
import { PYRAMID } from '../../data/pyramid.js';

describe('tradePeriod', () => {
  const leagueKey = Object.keys(PYRAMID)[0];
  const league = PYRAMID[leagueKey];

  let career;
  beforeEach(() => {
    career = {
      clubId: league.clubs[0].id,
      leagueKey,
      season: 2026,
      week: 22,
      squad: [{ id: 'p1', wage: 100_000, value: 500_000, contract: 1, overall: 70, receivedInTrade: null }],
      lineup: [],
      ladder: league.clubs.map((c, i) => ({
        id: c.id, W: 10 - i, L: i, D: 0, pts: 40 - i * 2, pct: 100, F: 100, A: 90,
      })),
      aiSquads: {},
      finance: { cash: 500_000, transferBudget: 200_000, boardConfidence: 50 },
      pendingTradeOffers: [],
      news: [],
      eventQueue: [],
    };
  });

  it('begins post-season trade period with bank and free agents', () => {
    beginPostSeasonTradePeriod(career, league, leagueKey);
    expect(career.postSeasonPhase).toBe('trade_period');
    expect(career.inTradePeriod).toBe(true);
    expect(career.tradePeriodDay).toBe(0);
    expect(career.freeAgencyOpen).toBe(true);
    expect(career.draftPickBank).toBeTruthy();
    expect(Object.keys(career.draftPickBank).length).toBe(3);
    expect((career.offSeasonFreeAgents || []).length).toBeGreaterThan(0);
  });

  it('closes free agency at day 8 and trade period at day 14', () => {
    beginPostSeasonTradePeriod(career, league, leagueKey);
    let guard = 0;
    while (career.postSeasonPhase === 'trade_period' && career.inTradePeriod && guard < 30) {
      advanceTradePeriodDay(career, league, leagueKey);
      guard++;
    }
    expect(career.tradePeriodDay).toBe(TRADE_PERIOD_DAYS);
    expect(career.postSeasonPhase).toBe('draft_waiting');
    expect(career.freeAgencyOpen).toBe(false);
  });

  it('advanceDraftCountdown eventually requests finish_season', () => {
    career.postSeasonPhase = 'draft_waiting';
    career.postSeasonDraftCountdown = 2;
    expect(advanceDraftCountdown(career)).toBe('continue');
    expect(advanceDraftCountdown(career)).toBe('finish_season');
  });

  it('playerBlockedFromTrade when receivedInTrade matches season', () => {
    expect(playerBlockedFromTrade({ receivedInTrade: 2026 }, 2026)).toBe(true);
    expect(playerBlockedFromTrade({ receivedInTrade: 2025 }, 2026)).toBe(false);
    expect(playerBlockedFromTrade({ receivedInTrade: null }, 2026)).toBe(false);
  });
});
