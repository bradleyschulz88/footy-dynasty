import { describe, it, expect } from 'vitest';
import { buildPendingPlayerMatchPatch } from '../matchDayFinalize.js';
import { blankLadder } from '../leagueEngine.js';

describe('buildPendingPlayerMatchPatch', () => {
  it('applies deferred ladder and fixture result', () => {
    const clubs = [{ id: 'c1' }, { id: 'c2' }];
    const career = {
      clubId: 'c1',
      ladder: blankLadder(clubs),
      pendingPlayerMatchResult: {
        home: 'c1',
        away: 'c2',
        homeTotal: 90,
        awayTotal: 72,
        round: 1,
      },
      eventQueue: [
        {
          type: 'round',
          round: 1,
          completed: true,
          matches: [{ home: 'c1', away: 'c2' }],
        },
      ],
    };
    const patch = buildPendingPlayerMatchPatch(career);
    expect(patch.pendingPlayerMatchResult).toBe(null);
    const row = patch.ladder.find((r) => r.id === 'c1');
    expect(row.W).toBe(1);
    expect(patch.eventQueue[0].matches[0].result).toEqual({ hScore: 90, aScore: 72 });
  });
});
