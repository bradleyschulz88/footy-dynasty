import { describe, it, expect } from 'vitest';
import {
  needsDraftSeed,
  skipCurrentPick,
  resolveNextPick,
  draftProspectOnClock,
} from '../draftEngine.js';
import { seedNationalDraft, DRAFT_ROUNDS, buildSnakeDraftOrder } from '../draftSeed.js';
import { PYRAMID } from '../../data/pyramid.js';
import { isPlayerDraftTurn } from '../recruitPhase.js';

describe('draftEngine', () => {
  const leagueKey = Object.keys(PYRAMID)[0];
  const league = PYRAMID[leagueKey];
  const clubIds = league.clubs.map((c) => c.id);

  it('needsDraftSeed when pool or order empty', () => {
    expect(needsDraftSeed({ draftPool: [], draftOrder: [] })).toBe(true);
    expect(needsDraftSeed({ draftPool: [{}], draftOrder: [{ used: false }] })).toBe(false);
    expect(needsDraftSeed({ draftPhase: 'complete', draftPool: [], draftOrder: [] })).toBe(true);
  });

  it('buildSnakeDraftOrder alternates rounds', () => {
    const ids = ['a', 'b', 'c'];
    const order = buildSnakeDraftOrder(ids, 2);
    expect(order).toHaveLength(6);
    expect(order[0]).toMatchObject({ pick: 1, clubId: 'a', round: 1 });
    expect(order[3].clubId).toBe('c');
    expect(order[3].round).toBe(2);
  });

  it('skipCurrentPick marks pass when draft is live', () => {
    const career = {
      clubId: clubIds[0],
      draftPhase: 'live',
      season: 2026,
      week: 1,
      squad: [],
      draftPool: [{ id: 'p1', firstName: 'A', lastName: 'B', overall: 70, position: 'C', age: 18, wage: 1, attrs: {} }],
      draftOrder: [
        { pick: 1, clubId: clubIds[0], round: 1, used: false },
        { pick: 2, clubId: clubIds[1], round: 1, used: false },
      ],
      draftHistory: [],
      news: [],
    };
    const patch = skipCurrentPick(career);
    expect(patch.draftOrder[0].used).toBe(true);
    expect(patch.draftOrder[0].skipped).toBe(true);
    expect(patch.draftHistory[0].skipped).toBe(true);
  });

  it('resolveNextPick resolves one AI pick only', () => {
    const career = {
      clubId: clubIds[2],
      draftPhase: 'live',
      season: 2026,
      week: 1,
      squad: [],
      leagueKey,
      draftPool: Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        firstName: `F${i}`,
        lastName: `L${i}`,
        overall: 60 + i,
        potential: 70,
        position: 'C',
        age: 18,
        wage: 1000,
        attrs: { kicking: 50, marking: 50, handball: 50, tackling: 50, speed: 50, endurance: 50, strength: 50, decision: 50 },
      })),
      draftOrder: clubIds.slice(0, 4).map((id, i) => ({ pick: i + 1, clubId: id, round: 1, used: false })),
      aiSquads: {},
      draftHistory: [],
      news: [],
    };
    const patch = resolveNextPick(career);
    expect(patch.draftOrder.filter((d) => d.used).length).toBe(1);
    const next = patch.draftOrder.find((d) => !d.used);
    expect(next.clubId).toBe(clubIds[1]);
  });

  it('draftProspectOnClock adds rookie when on the clock', () => {
    const me = clubIds[0];
    const career = {
      clubId: me,
      draftPhase: 'live',
      leagueKey,
      season: 2026,
      week: 1,
      squad: [],
      finance: { cash: 500000 },
      draftPool: [{
        id: 'p1',
        firstName: 'Test',
        lastName: 'Pick',
        overall: 65,
        potential: 80,
        position: 'C',
        age: 18,
        wage: 5000,
        attrs: { kicking: 60, marking: 60, handball: 60, tackling: 60, speed: 60, endurance: 60, strength: 60, decision: 60 },
      }],
      draftOrder: [{ pick: 1, clubId: me, round: 1, used: false }],
      aiSquads: {},
      draftHistory: [],
      news: [],
    };
    const prospect = career.draftPool[0];
    const { patch, error } = draftProspectOnClock(career, { short: 'TST' }, prospect);
    expect(error).toBeUndefined();
    expect(patch.squad).toHaveLength(1);
    expect(patch.draftOrder[0].used).toBe(true);
    expect(isPlayerDraftTurn({ ...career, ...patch })).toBe(false);
  });
});

describe('draftSeed multi-round', () => {
  const leagueKey = Object.keys(PYRAMID)[0];
  const league = PYRAMID[leagueKey];
  const clubIds = league.clubs.map((c) => c.id);

  it('seedNationalDraft creates snake order in scouting phase', () => {
    const career = { clubId: clubIds[0], leagueKey, season: 2026, draftPool: [], draftOrder: [] };
    seedNationalDraft(career, league, { inaugural: true, force: true });
    expect(career.draftPool.length).toBeGreaterThan(0);
    expect(career.draftOrder.length).toBe(clubIds.length * DRAFT_ROUNDS);
    expect(career.draftOrder[0].round).toBe(1);
    expect(career.draftPhase).toBe('scouting');
    expect(career.draftStartDate).toBe('2026-01-10');
  });
});
