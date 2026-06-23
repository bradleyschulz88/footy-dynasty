// ---------------------------------------------------------------------------
// Live match flow: advancing into a round pauses at half time with 2 quarters
// simmed; the half-time coaching call sims Q3+Q4 and applies full-time effects.
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach } from 'vitest';
import { advanceCareerNextEvent, resolveLiveMatchHalfTime, resolveQ3Decision } from '../careerAdvance.js';
import { generateSquad } from '../playerGen.js';
import { blankLadder } from '../leagueEngine.js';
import { defaultFinance, DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff } from '../defaults.js';
import { PYRAMID, findClub } from '../../data/pyramid.js';
import { seedRng } from '../rng.js';
import { COACHING_CALLS, resolveCoachingCall } from '../coachingCalls.js';

const league = PYRAMID.AFL;
const CLUB = 'col';

function buildCareer() {
  seedRng(99);
  const squad = generateSquad(CLUB, 1, 32, 2026);
  const lineup = squad.slice().sort((a, b) => b.overall - a.overall).slice(0, 23).map((p) => p.id);
  const clubs = league.clubs.filter((c) => !c.joinsYear || c.joinsYear <= 2026);
  return {
    season: 2026,
    week: 0,
    clubId: CLUB,
    leagueKey: 'AFL',
    managerName: 'Test',
    difficulty: 'contender',
    currentDate: '2026-03-20',
    squad,
    lineup,
    staff: generateStaff(1),
    training: DEFAULT_TRAINING(),
    facilities: DEFAULT_FACILITIES(),
    finance: defaultFinance(1),
    ladder: blankLadder(clubs),
    aiSquads: {},
    news: [],
    history: [],
    brownlow: {},
    weeklyWeather: {},
    eventQueue: [
      {
        id: 'ev1',
        date: '2026-03-21',
        type: 'round',
        round: 1,
        phase: 'season',
        matches: [
          { home: CLUB, away: 'gee' },
          { home: 'ess', away: 'haw' },
        ],
      },
      {
        id: 'ev2',
        date: '2026-03-28',
        type: 'round',
        round: 2,
        phase: 'season',
        matches: [
          { home: 'gee', away: CLUB },
          { home: 'haw', away: 'ess' },
        ],
      },
    ],
    tutorialComplete: true,
  };
}

function advance(career) {
  let out = null;
  advanceCareerNextEvent({
    career,
    league,
    club: findClub(CLUB),
    setCareer: (c) => { out = c; },
    setScreen: () => {},
    setTab: () => {},
  });
  return out;
}

function resolveHalfTime(career, callId) {
  let out = null;
  resolveLiveMatchHalfTime({
    career,
    league,
    club: findClub(CLUB),
    callId,
    setCareer: (c) => { out = c; },
  });
  return out;
}

function resolveQ3Dec(career, callId) {
  let out = null;
  resolveQ3Decision({
    career,
    league,
    club: findClub(CLUB),
    callId,
    setCareer: (c) => { out = c; },
  });
  return out;
}

describe('live match half-time flow', () => {
  beforeEach(() => seedRng(2026));

  it('advancing into a round pauses at half time with two quarters simmed', () => {
    const c = advance(buildCareer());
    expect(c.inMatchDay).toBe(true);
    expect(c.liveMatch).toBeTruthy();
    expect(c.liveMatch.simState.quarters.length).toBe(2);
    expect(c.currentMatchResult.live).toBe(true);
    expect(c.currentMatchResult.quarters.length).toBe(2);
    // No full-time effects yet: no games played, no pending ladder result.
    expect(c.squad.every((p) => (p.gamesPlayed || 0) === 0)).toBe(true);
    expect(c.pendingPlayerMatchResult ?? null).toBe(null);
  });

  it('blocks further calendar advance while the match is live', () => {
    const half = advance(buildCareer());
    const stillHalf = advance(half);
    expect(stillHalf.liveMatch).toBeTruthy();
    expect(stillHalf.liveMatch.simState.quarters.length).toBe(2);
  });

  it('the coaching call finishes the match and applies full-time effects', () => {
    const half = advance(buildCareer());

    // Phase 1: half-time call sims Q3 and pauses for Q3 decision.
    const afterQ3 = resolveHalfTime(half, 'steady');
    expect(afterQ3.liveMatch?.matchPhase).toBe('after_q3');
    expect(afterQ3.liveMatch.simState.quarters.length).toBe(3);

    // Phase 2: Q3 decision sims Q4 and applies full-time effects.
    const full = resolveQ3Dec(afterQ3, 'midfield_grind');

    expect(full.liveMatch ?? null).toBe(null);
    expect(full.inMatchDay).toBe(true);
    expect(full.currentMatchResult.live ?? undefined).toBeUndefined();
    expect(full.currentMatchResult.quarters.length).toBe(4);
    expect(typeof full.currentMatchResult.won).toBe('boolean');
    expect(full.currentMatchResult.coachCall.id).toBe('midfield_grind');

    // Full-time effects landed: stats, pending ladder result, week counter.
    const played = full.squad.filter((p) => (p.gamesPlayed || 0) === 1);
    expect(played.length).toBeGreaterThan(0);
    expect(full.pendingPlayerMatchResult).toMatchObject({ home: CLUB, away: 'gee', round: 1 });
    expect(full.week).toBe(1);
    expect(full.lastMatchSummary).toBeTruthy();
  });

  it('AI matches of the round resolve at advance time, not full time', () => {
    const half = advance(buildCareer());
    const aiRows = half.ladder.filter((r) => r.id === 'ess' || r.id === 'haw');
    expect(aiRows.every((r) => (r.W + r.L + r.D) === 1)).toBe(true);
  });

  it('coaching calls expose deltas and the spray is volatile', () => {
    expect(COACHING_CALLS.length).toBeGreaterThanOrEqual(4);
    seedRng(1);
    const m = resolveCoachingCall('midfield_grind');
    expect(m.playerStrengthDelta).toBe(2);
    const outcomes = new Set();
    for (let i = 0; i < 40; i++) {
      seedRng(1000 + i);
      outcomes.add(resolveCoachingCall('spray').playerStrengthDelta);
    }
    expect(outcomes.size).toBe(2);
  });
});
