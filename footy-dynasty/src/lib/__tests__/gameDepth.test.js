import { describe, it, expect } from 'vitest';
import { findClub } from '../../data/pyramid.js';
import {
  recordHeadToHead,
  identifyBogeyTeam,
  celebrateBogeyBreakIfNeeded,
  refreshTurningPointForNextFixture,
  clearUpcomingTurningPoints,
} from '../gameDepth.js';

describe('gameDepth', () => {
  it('recordHeadToHead tracks streak and results', () => {
    const c = { clubId: 'a', headToHead: {} };
    recordHeadToHead(c, 'b', false, false, -12, 'L 12pt');
    recordHeadToHead(c, 'b', false, false, -8, 'L 8pt');
    recordHeadToHead(c, 'b', false, false, -5, 'L 5pt');
    expect(c.headToHead.b.streak).toBe(-3);
    expect(c.headToHead.b.losses).toBe(3);
    identifyBogeyTeam(c);
    expect(c.bogeyTeamId).toBe('b');
    recordHeadToHead(c, 'b', true, false, 4, 'W 4pt');
    expect(c.headToHead.b.streak).toBe(1);
  });

  it('celebrateBogeyBreakIfNeeded boosts squad when breaking a hoodoo', () => {
    const c = {
      clubId: 'col',
      squad: [{ id: 'p1', morale: 50 }, { id: 'p2', morale: 60 }],
      finance: { boardConfidence: 50 },
      news: [],
      clubCulture: { score: 55, tier: 'Solid' },
    };
    celebrateBogeyBreakIfNeeded(c, 'car', true, true, -4, findClub);
    expect(c.squad[0].morale).toBe(60);
    expect(c.finance.boardConfidence).toBe(56);
    expect(c.news[0].text).toMatch(/HOODOO BROKEN/);
  });

  it('refreshTurningPointForNextFixture tags next season round match', () => {
    const mkRound = (r, complete) => ({
      type: 'round',
      phase: 'season',
      round: r,
      completed: complete,
      date: `2026-03-${String(r).padStart(2, '0')}`,
      matches: [{ home: 'me', away: 'them' }],
    });
    const career = {
      clubId: 'me',
      ladder: [
        { id: 'me', pts: 0 }, { id: 'them', pts: 0 }, { id: 'c', pts: 0 }, { id: 'd', pts: 0 },
        { id: 'e', pts: 0 }, { id: 'f', pts: 0 }, { id: 'g', pts: 0 }, { id: 'h', pts: 0 },
        { id: 'i', pts: 0 }, { id: 'j', pts: 0 },
      ],
      eventQueue: [mkRound(1, true), mkRound(2, false)],
      winStreak: 5,
      week: 1,
      news: [],
      headToHead: {},
    };
    const league = { tier: 1 };
    refreshTurningPointForNextFixture(career, league);
    const next = career.eventQueue.find((e) => e.round === 2);
    const myM = next.matches.find((m) => m.home === 'me' || m.away === 'me');
    expect(myM.turningPoint).toBe('undefeated_run');
    clearUpcomingTurningPoints(career);
    expect(myM.turningPoint).toBeUndefined();
  });
});
