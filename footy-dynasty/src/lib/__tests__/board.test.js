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
  maybeEnqueueBoardMessage,
  resolveBoardInboxChoice,
  BOARD_COMMS_THROTTLE_ROUNDS,
  seasonRoundTick,
  planSeasonBoardMeetings,
  voteOfConfidenceSurvivalChance,
  maybeEnqueueBoardCrisisPrep,
} from '../board.js';
import { findLeagueOf } from '../../data/pyramid.js';

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
        inbox: [],
        lastCommsTick: null,
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
        inbox: [],
        lastCommsTick: null,
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
        inbox: [],
        lastCommsTick: null,
      },
    };
    alignBoardMembersToTarget(career.board, 60);
    generateSeasonObjectives(career, league);
    expect(career.board.objectives.length).toBe(3);
  });

  it('maybeEnqueueBoardMessage respects throttle and one active message', () => {
    seedRng(42);
    const league = findLeagueOf('mel');
    const career = {
      season: 2026,
      week: 5,
      clubId: 'mel',
      leagueKey: 'AFL',
      winStreak: -3,
      finance: { boardConfidence: 55, cash: 1e6, fanHappiness: 60 },
      board: {
        members: generateBoardMembers({ id: 'mel' }, league),
        objectives: [],
        contractYears: 2,
        contractSalary: 120_000,
        lastReviewSeason: null,
        warningIssued: false,
        voteScheduled: false,
        inbox: [],
        lastCommsTick: null,
      },
    };
    alignBoardMembersToTarget(career.board, 55);
    recalcBoardConfidence(career);
    const line = maybeEnqueueBoardMessage(career, league);
    expect(line).toBeTruthy();
    expect(career.board.inbox.length).toBe(1);
    const tick = seasonRoundTick(2026, 5);
    expect(career.board.lastCommsTick).toBe(tick);
    expect(maybeEnqueueBoardMessage(career, league)).toBe(null);
    career.board.inbox = [];
    career.week = 6;
    expect(maybeEnqueueBoardMessage(career, league)).toBe(null);
    career.week = 5 + BOARD_COMMS_THROTTLE_ROUNDS;
    const line2 = maybeEnqueueBoardMessage(career, league);
    expect(line2).toBeTruthy();
    expect(career.board.inbox.length).toBe(1);
  });

  it('resolveBoardInboxChoice applies member deltas and clears inbox', () => {
    seedRng(3);
    const league = findLeagueOf('mel');
    const career = {
      season: 2026,
      week: 8,
      clubId: 'mel',
      leagueKey: 'AFL',
      winStreak: 0,
      finance: { boardConfidence: 60, cash: 1e6 },
      board: {
        members: generateBoardMembers({ id: 'mel' }, league),
        objectives: [],
        contractYears: 2,
        contractSalary: 120_000,
        lastReviewSeason: null,
        warningIssued: false,
        voteScheduled: false,
        inbox: [
          {
            id: 'bm_test',
            fromRole: 'Chairman',
            title: 'Test',
            body: 'Body',
            options: [
              { id: 'a', label: 'Yes', memberDeltas: { Chairman: 4 } },
              { id: 'b', label: 'No', memberDeltas: { Chairman: -2 } },
            ],
          },
        ],
        lastCommsTick: null,
      },
    };
    alignBoardMembersToTarget(career.board, 60);
    recalcBoardConfidence(career);
    const chair = career.board.members.find((m) => m.role === 'Chairman');
    const before = chair.confidence;
    const r = resolveBoardInboxChoice(career, league, 'bm_test', 'a');
    expect(r.ok).toBe(true);
    expect(career.board.inbox.length).toBe(0);
    expect(chair.confidence - before).toBe(4);
  });

  it('planSeasonBoardMeetings stamps two due rounds for the fixture', () => {
    const career = {
      season: 2026,
      eventQueue: Array.from({ length: 18 }, (_, i) => ({ type: "round", phase: "season", round: i + 1 })),
    };
    planSeasonBoardMeetings(career);
    expect(career.boardMeetingSlots.length).toBe(2);
    expect(career.boardMeetingSlots[0].dueRound).toBeGreaterThanOrEqual(3);
  });

  it('voteOfConfidenceSurvivalChance increases with inbox prep bonus', () => {
    const base = { finance: { boardConfidence: 40 }, difficulty: 'contender' };
    const low = voteOfConfidenceSurvivalChance(base, 0);
    const high = voteOfConfidenceSurvivalChance({ ...base, boardVotePrepBonus: 8 }, 0);
    expect(high).toBeGreaterThan(low);
  });

  it('maybeEnqueueBoardCrisisPrep queues once before a two-step vote', () => {
    seedRng(1);
    const league = findLeagueOf('mel');
    const career = {
      season: 2026,
      week: 4,
      clubId: 'mel',
      leagueKey: 'AFL',
      finance: { boardConfidence: 12, cash: 500_000 },
      boardCrisis: null,
      board: {
        members: generateBoardMembers({ id: 'mel' }, league),
        objectives: [],
        contractYears: 2,
        contractSalary: 120_000,
        lastReviewSeason: null,
        warningIssued: false,
        voteScheduled: false,
        inbox: [],
        lastCommsTick: null,
      },
    };
    alignBoardMembersToTarget(career.board, 12);
    recalcBoardConfidence(career);
    const line = maybeEnqueueBoardCrisisPrep(career, league, 2, 1);
    expect(line).toBeTruthy();
    expect(career.board.inbox.some((m) => String(m.id).startsWith('crisis_prep_'))).toBe(true);
    expect(maybeEnqueueBoardCrisisPrep(career, league, 2, 1)).toBe(null);
  });

  it('voteOfConfidenceSurvivalChance stays within bounds', () => {
    const career = { finance: { boardConfidence: 15 } };
    expect(voteOfConfidenceSurvivalChance(career, -20)).toBeGreaterThanOrEqual(0.1);
    expect(voteOfConfidenceSurvivalChance(career, -20)).toBeLessThanOrEqual(0.9);
    expect(voteOfConfidenceSurvivalChance({ finance: { boardConfidence: 90 } }, 15)).toBeLessThanOrEqual(0.9);
  });
});
