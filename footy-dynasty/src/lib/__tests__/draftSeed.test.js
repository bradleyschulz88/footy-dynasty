import { describe, it, expect } from 'vitest';
import {
  buildReverseLadderOrder,
  buildInauguralDraftOrder,
  seedNationalDraft,
  draftPickPositionForClub,
  DRAFT_POOL_SIZE,
} from '../draftSeed.js';
import { PYRAMID } from '../../data/pyramid.js';

describe('draftSeed', () => {
  const leagueKey = Object.keys(PYRAMID)[0];
  const league = PYRAMID[leagueKey];
  const clubIds = league.clubs.map((c) => c.id);

  it('buildReverseLadderOrder puts last-place team first', () => {
    const ladder = clubIds.map((id, i) => ({
      id, W: 10 - i, L: i, D: 0, pts: 40 - i * 4, pct: 100, F: 100, A: 90,
    }));
    const order = buildReverseLadderOrder(ladder);
    expect(order[0]).toBe(clubIds[clubIds.length - 1]);
    expect(order[order.length - 1]).toBe(clubIds[0]);
  });

  it('buildInauguralDraftOrder is deterministic and permutes all clubs', () => {
    const a = buildInauguralDraftOrder(clubIds, 2026);
    const b = buildInauguralDraftOrder(clubIds, 2026);
    const c = buildInauguralDraftOrder(clubIds, 2027);
    expect(a).toEqual(b);
    expect(a.sort()).toEqual([...clubIds].sort());
    expect(a).not.toEqual(c);
  });

  it('seedNationalDraft fills pool and order', () => {
    const career = { clubId: clubIds[0], leagueKey, season: 2026, draftPool: [], draftOrder: [] };
    seedNationalDraft(career, league, { inaugural: true, force: true });
    expect(career.draftPool.length).toBe(DRAFT_POOL_SIZE);
    expect(career.draftOrder.length).toBe(clubIds.length * 3);
    expect(career.lastDraftOrderSnapshot?.length).toBe(clubIds.length);
    expect(career.draftOrderInaugural).toBe(true);
  });

  it('draftPickPositionForClub reads snapshot', () => {
    const career = {
      clubId: clubIds[2],
      lastDraftOrderSnapshot: [clubIds[0], clubIds[1], clubIds[2]],
    };
    expect(draftPickPositionForClub(career, clubIds[2])).toBe(3);
    expect(draftPickPositionForClub(career, clubIds[0])).toBe(1);
  });
});
