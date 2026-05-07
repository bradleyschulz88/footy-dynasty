import { describe, it, expect } from 'vitest';
import { seedRng } from '../rng.js';
import {
  generateBoardMembers,
  weightedBoardConfidence,
  alignBoardMembersToTarget,
  applyBoardConfidenceDelta,
  applyMemberConfidenceDelta,
  generateSeasonObjectives,
  youthSeniorGameCount,
  recalcBoardConfidence,
} from '../board.js';

describe('board', () => {
  it('weightedBoardConfidence matches manual weighted average', () => {
    const members = [
      { weight: 2, confidence: 60 },
      { weight: 1, confidence: 50 },
    ];
    expect(weightedBoardConfidence(members)).toBe(Math.round((60 * 2 + 50) / 3));
  });

  it('alignBoardMembersToTarget shifts everyone equally to hit overall', () => {
    const board = { members: generateBoardMembers({ id: 'x' }, { tier: 2, clubs: [] }) };
    alignBoardMembersToTarget(board, 70);
    expect(weightedBoardConfidence(board.members)).toBe(70);
  });

  it('applyBoardConfidenceDelta preserves weighting shape roughly', () => {
    seedRng(99);
    const career = {
      finance: { boardConfidence: 55 },
      board: {
        members: generateBoardMembers({ id: 'mel' }, { tier: 1, clubs: [] }),
        objectives: [],
        contractYears: 2,
        contractSalary: 120_000,
        lastReviewSeason: null,
        warningIssued: false,
        voteScheduled: false,
      },
    };
    alignBoardMembersToTarget(career.board, 30);
    recalcBoardConfidence(career);
    const before = career.finance.boardConfidence;
    applyBoardConfidenceDelta(career, 10);
    expect(career.finance.boardConfidence - before).toBe(10);
  });

  it('applyMemberConfidenceDelta targets a single role', () => {
    seedRng(7);
    const career = {
      finance: { boardConfidence: 50 },
      board: {
        members: generateBoardMembers({ id: 'mel' }, { tier: 1, clubs: [] }),
        objectives: [],
        contractYears: 2,
        contractSalary: 120_000,
        lastReviewSeason: null,
        warningIssued: false,
        voteScheduled: false,
      },
    };
    alignBoardMembersToTarget(career.board, 50);
    const chair = career.board.members.find((m) => m.role === 'Chairman');
    const prev = chair.confidence + 0;
    applyMemberConfidenceDelta(career, 'Chairman', 15);
    expect(chair.confidence - prev).toBe(15);
  });

  it('youthSeniorGameCount counts squad correctly', () => {
    expect(
      youthSeniorGameCount([
        { age: 20, gamesPlayed: 7 },
        { age: 23, gamesPlayed: 10 },
        { age: 21, gamesPlayed: 4 },
      ]),
    ).toBe(1);
  });

  it('generateSeasonObjectives creates three tracks', () => {
    const league = { tier: 2, clubs: Array.from({ length: 10 }, (_, i) => ({ id: `c${i}` })) };
    const career = {
      season: 2026,
      clubId: 'mel',
      finance: { boardConfidence: 60 },
      coachStats: { seasonsManaged: 1 },
      board: {
        members: generateBoardMembers({ id: 'mel' }, league),
        objectives: [],
        contractYears: 2,
        contractSalary: 120_000,
        lastReviewSeason: null,
        warningIssued: false,
        voteScheduled: false,
      },
    };
    alignBoardMembersToTarget(career.board, 60);
    generateSeasonObjectives(career, league);
    expect(career.board.objectives.length).toBe(3);
  });
});
