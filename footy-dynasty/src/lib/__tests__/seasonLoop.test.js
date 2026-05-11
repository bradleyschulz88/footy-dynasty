// ---------------------------------------------------------------------------
// Integration tests for the season-advance loop.
// We don't render React; instead we drive the same core engine the inner
// AFLManager loop uses (calendar + applyTraining + matchEngine + aiSquads)
// across a representative slice of a season. The goal is to ensure those
// modules cooperate and produce sane state.
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeEach } from 'vitest';
import { applyTraining, generateSeasonCalendar } from '../calendar.js';
import { simMatchWithQuarters, aiClubRating, teamRating } from '../matchEngine.js';
import { ensureSquadsForLeague, aiClubRatingFromSquad, tickAiSquads, ageAiSquads, selectAiLineup } from '../aiSquads.js';
import { generateSquad } from '../playerGen.js';
import { seedRng } from '../rng.js';

const PLAYER_CLUB_ID = 'col';
const LEAGUE_TIER    = 1;

const fakeLeague = (ids = ['col', 'gee', 'ess', 'haw']) => ({
  key:   'afl',
  short: 'AFL',
  tier:  LEAGUE_TIER,
  clubs: ids.map(id => ({ id, name: id.toUpperCase(), short: id.toUpperCase(), color1: '#000', color2: '#fff' })),
});

// Staff IDs match TRAINING_INFO[*].staffId: s2 = ball drill, s4 = tactics, s5 = running/gym
const fakeStaff = () => ([
  { id: 's2', name: 'Forwards Coach',  rating: 75 },
  { id: 's4', name: 'Midfield Coach',  rating: 78 },
  { id: 's5', name: 'S&C Coach',       rating: 72 },
]);

const initialCareer = () => {
  seedRng(42);
  const squad = generateSquad(PLAYER_CLUB_ID, LEAGUE_TIER, 32);
  return {
    season:   2026,
    week:     1,
    clubId:   PLAYER_CLUB_ID,
    squad,
    aiSquads: {},
    history:  [],
    brownlow: {},
    finance:  { cash: 1_000_000, transferBudget: 500_000, boardConfidence: 65, fanHappiness: 60 },
    facilities: { training: 1, medical: 1, gym: 1 },
    staff:    fakeStaff(),
    training: { intensity: 60, focus: { skills: 25, fitness: 25, tactics: 25, recovery: 25 } },
    medical:  { level: 2 },
  };
};

beforeEach(() => seedRng(42));

// ---------------------------------------------------------------------------
// generateSeasonCalendar
// ---------------------------------------------------------------------------
describe('season calendar generation', () => {
  it('produces an ordered event queue with training + key events + rounds', () => {
    const league = fakeLeague();
    const fixtures = [
      { round: 1, date: '2026-03-25', matches: [{ home: 'col', away: 'gee' }, { home: 'ess', away: 'haw' }] },
      { round: 2, date: '2026-04-01', matches: [{ home: 'gee', away: 'ess' }, { home: 'haw', away: 'col' }] },
    ];
    const evs = generateSeasonCalendar(2026, league.clubs, fixtures, PLAYER_CLUB_ID);
    expect(evs.length).toBeGreaterThan(20);
    for (let i = 1; i < evs.length; i++) {
      expect(evs[i].date >= evs[i - 1].date).toBe(true);
    }
    expect(evs.find(e => e.type === 'training')).toBeDefined();
    expect(evs.find(e => e.type === 'round')).toBeDefined();
    expect(evs.find(e => e.type === 'key_event')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Training event
// ---------------------------------------------------------------------------
// Build a synthetic young squad whose potential is comfortably above attrs so
// that gain assertions are meaningful. Real generated squads can have older
// players whose attrs already sit above their (much lower) potential, which
// would make every gain assertion noisy.
const youngSquad = (n = 22) => Array.from({ length: n }, (_, i) => ({
  id: `y${i}`, firstName: 'Y', lastName: `Player${i}`, position: 'C',
  age: 19, overall: 60, trueRating: 60, potential: 90, fitness: 90, form: 70,
  contract: 3, wage: 100000, value: 100000,
  attrs: { kicking: 60, marking: 60, handball: 60, tackling: 60, speed: 60, endurance: 60, strength: 60, decision: 60 },
}));

describe('training advances player attributes within potential', () => {
  it('clamps gains so attributes never exceed the player\'s potential', () => {
    const squad = youngSquad();
    const lineup = squad.map(p => p.id);
    const result = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), {
      focus:     { skills: 25, fitness: 25, tactics: 25, recovery: 25 },
      intensity: 100,
    });
    result.squad.forEach(p => {
      Object.values(p.attrs).forEach(v => {
        expect(v).toBeLessThanOrEqual(p.potential);
      });
    });
  });

  it('does not push any attribute above 99 even at max intensity', () => {
    const squad = youngSquad().map(p => ({ ...p, potential: 99 }));
    const lineup = squad.map(p => p.id);
    const result = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), {
      focus:     { skills: 100, fitness: 0, tactics: 0, recovery: 0 },
      intensity: 100,
    });
    result.squad.forEach(p => {
      Object.values(p.attrs).forEach(v => expect(v).toBeLessThanOrEqual(99));
    });
  });

  it('high intensity yields more total attribute gain than low intensity (averaged)', () => {
    const squad = youngSquad();
    const lineup = squad.map(p => p.id);
    let lowSum = 0, highSum = 0;
    for (let i = 0; i < 5; i++) {
      const lo = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), { focus: { skills: 25, fitness: 25, tactics: 25, recovery: 25 }, intensity: 30 });
      const hi = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), { focus: { skills: 25, fitness: 25, tactics: 25, recovery: 25 }, intensity: 100 });
      lowSum  += Object.values(lo.gains).reduce((a, b) => a + b, 0);
      highSum += Object.values(hi.gains).reduce((a, b) => a + b, 0);
    }
    expect(highSum).toBeGreaterThan(lowSum);
  });

  it('skills focus boosts skill drill gains relative to a non-skills focus', () => {
    const squad = youngSquad();
    const lineup = squad.map(p => p.id);
    const focusedRuns = [];
    const unfocusedRuns = [];
    for (let i = 0; i < 8; i++) {
      seedRng(100 + i);
      const focused = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), {
        focus:     { skills: 100, fitness: 0, tactics: 0, recovery: 0 },
        intensity: 80,
      });
      seedRng(100 + i);
      const unfocused = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), {
        focus:     { skills: 0, fitness: 100, tactics: 0, recovery: 0 },
        intensity: 80,
      });
      focusedRuns.push(Object.values(focused.gains).reduce((a, b) => a + b, 0));
      unfocusedRuns.push(Object.values(unfocused.gains).reduce((a, b) => a + b, 0));
    }
    const focusedAvg   = focusedRuns.reduce((a, b) => a + b, 0)   / focusedRuns.length;
    const unfocusedAvg = unfocusedRuns.reduce((a, b) => a + b, 0) / unfocusedRuns.length;
    expect(focusedAvg).toBeGreaterThan(unfocusedAvg);
  });

  it('returns a recovery dev-note when recovery focus is high', () => {
    const squad = youngSquad();
    const lineup = squad.map(p => p.id);
    const result = applyTraining(squad, lineup, 'ball_drill', fakeStaff(), {
      focus:     { skills: 25, fitness: 25, tactics: 0, recovery: 50 },
      intensity: 60,
    });
    expect(result.devNotes.some(n => /Recovery/i.test(n))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Round simulation — feed AI squads into rating function and the engine
// ---------------------------------------------------------------------------
describe('round simulation with AI squads', () => {
  it('lazily generates AI squads for the league', () => {
    const career = initialCareer();
    const league = fakeLeague();
    const out = ensureSquadsForLeague(career, league);
    expect(Object.keys(out)).toEqual(expect.arrayContaining(['gee', 'ess', 'haw']));
    expect(out.col).toBeUndefined();
  });

  it('aiClubRatingFromSquad falls back to aiClubRating-like behaviour for empty squads', () => {
    const ai = aiClubRatingFromSquad(undefined);
    expect(ai).toBe(null);
    expect(aiClubRating('gee', 1)).toBeGreaterThan(0);
  });

  it('a stronger player squad beats a much weaker AI club more often', () => {
    seedRng(2026);
    const career  = initialCareer();
    const lineup  = career.squad.slice(0, 23).map(p => p.id);
    const playerStrength = teamRating(career.squad, lineup, career.training, 1, 70);
    let wins = 0;
    const RUNS = 60;
    for (let i = 0; i < RUNS; i++) {
      const r = simMatchWithQuarters(
        { rating: playerStrength },
        { rating: 50 },
        true,
        playerStrength,
        { playerLineup: career.squad.slice(0, 23), tactic: 'balanced' },
      );
      if (r.winner === 'home') wins++;
    }
    expect(wins / RUNS).toBeGreaterThan(0.6);
  });

  it('selectAiLineup returns 23 players each round and tickAiSquads keeps invariants', () => {
    const career = initialCareer();
    const league = fakeLeague();
    const ai = ensureSquadsForLeague(career, league);
    const lineup = selectAiLineup(ai.gee);
    expect(lineup.length).toBe(23);
    const ticked = tickAiSquads(ai);
    expect(Object.keys(ticked)).toEqual(Object.keys(ai));
    Object.values(ticked).forEach(squad => {
      squad.forEach(p => {
        expect(p.fitness).toBeLessThanOrEqual(100);
        expect(p.fitness).toBeGreaterThanOrEqual(0);
        expect(p.injured).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Season ageing + retention
// ---------------------------------------------------------------------------
describe('end-of-season ageing for AI clubs', () => {
  it('ages all surviving players by 1 and tops up to a full squad', () => {
    seedRng(123);
    const career = initialCareer();
    const league = fakeLeague();
    const ai = ensureSquadsForLeague(career, league);
    const aged = ageAiSquads(ai, 1);
    Object.values(aged).forEach(squad => {
      expect(squad.length).toBeGreaterThanOrEqual(32);
    });
  });

  it('drops players older than 36 from AI squads', () => {
    const ai = {
      gee: [
        { id: 'old_a', age: 36, overall: 70, trueRating: 70, contract: 1, tier: 1 },
        { id: 'old_b', age: 38, overall: 70, trueRating: 70, contract: 5, tier: 1 },
        { id: 'mid',    age: 25, overall: 70, trueRating: 70, contract: 3, tier: 1 },
      ],
    };
    const aged = ageAiSquads(ai, 1);
    expect(aged.gee.find(p => p.id === 'old_a')).toBeUndefined();
    expect(aged.gee.find(p => p.id === 'old_b')).toBeUndefined();
    expect(aged.gee.find(p => p.id === 'mid')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Multi-round mini-loop — drive the engine for a few rounds and check state
// ---------------------------------------------------------------------------
describe('mini-season loop', () => {
  it('produces stable state across 6 rounds without throwing', () => {
    seedRng(2026);
    const career = initialCareer();
    const league = fakeLeague();
    let aiSquads = ensureSquadsForLeague(career, league);
    const ladder = { col: 0, gee: 0, ess: 0, haw: 0 };
    const fixtureRotations = [
      [['col', 'gee'], ['ess', 'haw']],
      [['gee', 'col'], ['haw', 'ess']],
      [['col', 'ess'], ['gee', 'haw']],
      [['ess', 'col'], ['haw', 'gee']],
      [['col', 'haw'], ['gee', 'ess']],
      [['haw', 'col'], ['ess', 'gee']],
    ];

    for (let round = 0; round < 6; round++) {
      for (const [home, away] of fixtureRotations[round]) {
        const isPlayerInvolved = home === PLAYER_CLUB_ID || away === PLAYER_CLUB_ID;
        const isPlayerHome     = home === PLAYER_CLUB_ID;

        const homeRating = home === PLAYER_CLUB_ID
          ? teamRating(career.squad, career.squad.slice(0, 23).map(p => p.id), career.training, 1, 70)
          : aiClubRatingFromSquad(aiSquads[home]) ?? aiClubRating(home, 1);
        const awayRating = away === PLAYER_CLUB_ID
          ? teamRating(career.squad, career.squad.slice(0, 23).map(p => p.id), career.training, 1, 70)
          : aiClubRatingFromSquad(aiSquads[away]) ?? aiClubRating(away, 1);

        const result = simMatchWithQuarters(
          { rating: homeRating },
          { rating: awayRating },
          isPlayerHome,
          isPlayerInvolved ? homeRating : 70,
          isPlayerInvolved ? { playerLineup: career.squad.slice(0, 23), tactic: 'balanced' } : {},
        );

        expect(result.winner).toMatch(/home|away|draw/);
        if (result.winner === 'home')      ladder[home] += 4;
        else if (result.winner === 'away') ladder[away] += 4;
        else                                { ladder[home] += 2; ladder[away] += 2; }
      }
      aiSquads = tickAiSquads(aiSquads);
    }

    expect(Object.values(ladder).every(v => v >= 0)).toBe(true);
    const totalPoints = Object.values(ladder).reduce((a, b) => a + b, 0);
    // Each match awards 4 points (4+0, 2+2). 6 rounds × 2 matches = 12 matches × 4 pts = 48.
    expect(totalPoints).toBe(48);
  });
});
