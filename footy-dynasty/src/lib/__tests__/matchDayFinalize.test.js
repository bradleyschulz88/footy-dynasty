import { describe, it, expect } from 'vitest';
import {
  buildPendingPlayerMatchPatch,
  applyPostMatchSquadRecovery,
  buildMatchDayExitPatch,
} from '../matchDayFinalize.js';
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

describe('applyPostMatchSquadRecovery', () => {
  it('restores fitness for lineup players after a match', () => {
    const career = {
      squad: [
        { id: 'p1', fitness: 70, injured: 0 },
        { id: 'p2', fitness: 85, injured: 0 },
      ],
      lineup: ['p1'],
      training: { focus: { recovery: 20 } },
      facilities: { medical: { level: 1 }, recovery: { level: 1 } },
    };
    const patch = applyPostMatchSquadRecovery(career);
    expect(patch.squad[0].fitness).toBeGreaterThan(70);
    expect(patch.squad[1].fitness).toBeGreaterThan(85);
  });
});

describe('buildMatchDayExitPatch', () => {
  it('clears match state and applies recovery', () => {
    const career = {
      inMatchDay: true,
      currentMatchResult: { home: 'c1' },
      lastMatchSummary: { margin: 10 },
      squad: [{ id: 'p1', fitness: 60, injured: 0 }],
      lineup: ['p1'],
      training: { focus: { recovery: 0 } },
      facilities: { medical: { level: 0 }, recovery: { level: 0 } },
    };
    const patch = buildMatchDayExitPatch(career);
    expect(patch.inMatchDay).toBe(false);
    expect(patch.currentMatchResult).toBe(null);
    expect(patch.lastMatchSummary).toBe(null);
    expect(patch.squad[0].fitness).toBeGreaterThan(60);
  });
});
