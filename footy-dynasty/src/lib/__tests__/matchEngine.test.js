import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import {
  teamRating,
  simMatch,
  simMatchWithQuarters,
  aiClubRating,
  benchStrengthBonus,
  defensivePressureMod,
  weatherAccuracyMod,
  playerEffectiveMatchRating,
  adaptiveOppTactic,
  pickInjury,
  INJURY_TABLE,
} from '../matchEngine.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makePlayer = (overall, overrides = {}) => ({
  id: 'p0', overall, trueRating: overall, form: 70, fitness: 90,
  position: 'C', attrs: {}, wage: 0, contract: 1,
  ...overrides,
});

const makeSquad = (count, overall = 70) =>
  Array.from({ length: count }, (_, i) => ({ ...makePlayer(overall), id: `p${i}` }));

const defaultTraining = () => ({ intensity: 60, focus: {} });

// ---------------------------------------------------------------------------
// teamRating
// ---------------------------------------------------------------------------
describe('teamRating', () => {
  it('returns 50 for an empty squad', () => {
    expect(teamRating([], [], defaultTraining(), 1, 60)).toBe(50);
  });

  it('returns 50 when lineup IDs match no squad players', () => {
    const squad = makeSquad(5, 70);
    expect(teamRating(squad, ['ghost-id'], defaultTraining(), 1, 60)).toBe(50);
  });

  it('returns a number for a valid squad', () => {
    const squad = makeSquad(22, 70);
    const ids = squad.map(p => p.id);
    const r = teamRating(squad, ids, defaultTraining(), 1, 60);
    expect(typeof r).toBe('number');
    expect(Number.isFinite(r)).toBe(true);
  });

  it('a higher-rated squad produces a higher team rating', () => {
    const training = defaultTraining();
    const strong = makeSquad(22, 90);
    const weak   = makeSquad(22, 50);
    const strongR = teamRating(strong, strong.map(p => p.id), training, 1, 60);
    const weakR   = teamRating(weak,   weak.map(p => p.id),   training, 1, 60);
    expect(strongR).toBeGreaterThan(weakR);
  });

  it('uses the top 18 from squad when lineup is empty', () => {
    const squad = makeSquad(30, 70);
    const r = teamRating(squad, [], defaultTraining(), 1, 60);
    expect(r).toBeGreaterThan(0);
  });

  it('higher training intensity increases the rating', () => {
    const squad = makeSquad(22, 70);
    const ids = squad.map(p => p.id);
    const low  = teamRating(squad, ids, { intensity: 20, focus: {} }, 1, 60);
    const high = teamRating(squad, ids, { intensity: 100, focus: {} }, 1, 60);
    expect(high).toBeGreaterThan(low);
  });

  it('better facilities increase the rating', () => {
    const squad = makeSquad(22, 70);
    const ids = squad.map(p => p.id);
    const r1 = teamRating(squad, ids, defaultTraining(), 1, 60);
    const r5 = teamRating(squad, ids, defaultTraining(), 5, 60);
    expect(r5).toBeGreaterThan(r1);
  });

  it('higher average staff rating increases the team rating', () => {
    const squad = makeSquad(22, 70);
    const ids = squad.map(p => p.id);
    const rLow  = teamRating(squad, ids, defaultTraining(), 1, 50);
    const rHigh = teamRating(squad, ids, defaultTraining(), 1, 85);
    expect(rHigh).toBeGreaterThan(rLow);
  });

  it('better per-player form increases rating vs cold form (same averages)', () => {
    const hot = makeSquad(22, 70).map((p, i) => ({ ...p, id: `h${i}`, form: 88 }));
    const cold = makeSquad(22, 70).map((p, i) => ({ ...p, id: `c${i}`, form: 52 }));
    const rHot = teamRating(hot, hot.map(p => p.id), defaultTraining(), 1, 60);
    const rCold = teamRating(cold, cold.map(p => p.id), defaultTraining(), 1, 60);
    expect(rHot).toBeGreaterThan(rCold);
  });

  it('Q4 rating is below Q1 when fitness is low (fatigue)', () => {
    const tired = makeSquad(22, 70).map((p, i) => ({ ...p, id: `t${i}`, fitness: 58, form: 70 }));
    const ids = tired.map(p => p.id);
    const r1 = teamRating(tired, ids, defaultTraining(), 1, 60, 1);
    const r4 = teamRating(tired, ids, defaultTraining(), 1, 60, 4);
    expect(r4).toBeLessThan(r1);
  });

  it('quarter parameter omitted does not apply Q3–Q4 fatigue', () => {
    const tired = makeSquad(22, 70).map((p, i) => ({ ...p, id: `t${i}`, fitness: 58 }));
    const ids = tired.map(p => p.id);
    const rBase = teamRating(tired, ids, defaultTraining(), 1, 60);
    const rBase2 = teamRating(tired, ids, defaultTraining(), 1, 60, undefined);
    expect(rBase).toBeCloseTo(rBase2, 5);
  });
});

// ---------------------------------------------------------------------------
// simMatch
// ---------------------------------------------------------------------------
describe('simMatch', () => {
  beforeEach(() => seedRng(42));

  it('returns the expected result shape', () => {
    const r = simMatch({ rating: 70 }, { rating: 70 }, false, 70);
    expect(r).toMatchObject({
      homeGoals:   expect.any(Number),
      homeBehinds: expect.any(Number),
      homeTotal:   expect.any(Number),
      awayGoals:   expect.any(Number),
      awayBehinds: expect.any(Number),
      awayTotal:   expect.any(Number),
      winner:      expect.stringMatching(/^home$|^away$|^draw$/),
    });
  });

  it('winner is always consistent with totals', () => {
    for (let i = 0; i < 50; i++) {
      const r = simMatch({ rating: 70 }, { rating: 60 }, false, 70);
      if (r.homeTotal > r.awayTotal) expect(r.winner).toBe('home');
      else if (r.awayTotal > r.homeTotal) expect(r.winner).toBe('away');
      else expect(r.winner).toBe('draw');
    }
  });

  it('homeTotal equals homeGoals*6 + homeBehinds', () => {
    for (let i = 0; i < 30; i++) {
      const r = simMatch({ rating: 70 }, { rating: 70 }, false, 70);
      expect(r.homeTotal).toBe(r.homeGoals * 6 + r.homeBehinds);
    }
  });

  it('awayTotal equals awayGoals*6 + awayBehinds', () => {
    for (let i = 0; i < 30; i++) {
      const r = simMatch({ rating: 70 }, { rating: 70 }, false, 70);
      expect(r.awayTotal).toBe(r.awayGoals * 6 + r.awayBehinds);
    }
  });

  it('all score components are non-negative', () => {
    for (let i = 0; i < 50; i++) {
      const r = simMatch({ rating: 70 }, { rating: 70 }, false, 70);
      expect(r.homeGoals).toBeGreaterThanOrEqual(0);
      expect(r.homeBehinds).toBeGreaterThanOrEqual(0);
      expect(r.awayGoals).toBeGreaterThanOrEqual(0);
      expect(r.awayBehinds).toBeGreaterThanOrEqual(0);
    }
  });

  it('a much stronger team wins well over 75% of matches', () => {
    seedRng(1);
    let wins = 0;
    const RUNS = 300;
    for (let i = 0; i < RUNS; i++) {
      const r = simMatch({ rating: 100 }, { rating: 40 }, false, 40);
      if (r.winner === 'home') wins++;
    }
    expect(wins / RUNS).toBeGreaterThan(0.75);
  });

  it('evenly matched teams split wins roughly 50/50', () => {
    seedRng(1);
    let homeWins = 0;
    const RUNS = 500;
    for (let i = 0; i < RUNS; i++) {
      const r = simMatch({ rating: 70 }, { rating: 70 }, false, 70);
      if (r.winner === 'home') homeWins++;
    }
    // Home advantage means home should win more, but not by a huge margin
    const ratio = homeWins / RUNS;
    expect(ratio).toBeGreaterThan(0.40);
    expect(ratio).toBeLessThan(0.80);
  });

  it('is deterministic from the same seed', () => {
    seedRng(77);
    const a = simMatch({ rating: 70 }, { rating: 65 }, true, 70);
    seedRng(77);
    const b = simMatch({ rating: 70 }, { rating: 65 }, true, 70);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// aiClubRating
// ---------------------------------------------------------------------------
describe('aiClubRating', () => {
  it('returns 60 for an unknown club id', () => {
    expect(aiClubRating('nonexistent_club_xyz', 1)).toBe(60);
  });

  it('returns a higher base rating for tier 1 than tier 3', () => {
    // Use a known AFL club for tier 1 and a tier-3 club for tier 3
    const t1 = aiClubRating('ade', 1);
    const t3 = aiClubRating('efnl_balwyn', 3);
    expect(t1).toBeGreaterThan(t3);
  });

  it('tier-1 ratings fall within the expected range', () => {
    const aflClubs = ['ade', 'bri', 'car', 'col', 'ess', 'fre', 'gee', 'gcs'];
    aflClubs.forEach(id => {
      const r = aiClubRating(id, 1);
      expect(r).toBeGreaterThanOrEqual(67);
      expect(r).toBeLessThanOrEqual(83);
    });
  });

  it('tier-2 ratings fall within the expected range', () => {
    const r = aiClubRating('vfl_box_hill_hawks', 2);
    expect(r).toBeGreaterThanOrEqual(52);
    expect(r).toBeLessThanOrEqual(68);
  });

  it('tier-3 ratings fall within the expected range', () => {
    const r = aiClubRating('efnl_balwyn', 3);
    expect(r).toBeGreaterThanOrEqual(40);
    expect(r).toBeLessThanOrEqual(56);
  });

  it('returns a consistent value for the same club (no randomness)', () => {
    const r1 = aiClubRating('col', 1);
    const r2 = aiClubRating('col', 1);
    expect(r1).toBe(r2);
  });
});

// ---------------------------------------------------------------------------
// simMatchWithQuarters
// ---------------------------------------------------------------------------
describe('simMatchWithQuarters', () => {
  const home = { rating: 70 };
  const away = { rating: 65 };

  it('returns a result with a quarters array of length 4', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    expect(Array.isArray(r.quarters)).toBe(true);
    expect(r.quarters.length).toBe(4);
  });

  it('each quarter has the expected shape', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    r.quarters.forEach(q => {
      expect(q).toHaveProperty('homeGoals');
      expect(q).toHaveProperty('homeBehinds');
      expect(q).toHaveProperty('homeTotal');
      expect(q).toHaveProperty('awayGoals');
      expect(q).toHaveProperty('awayBehinds');
      expect(q).toHaveProperty('awayTotal');
    });
  });

  it('sum of quarter homeGoals equals result homeGoals', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    const sum = r.quarters.reduce((a, q) => a + q.homeGoals, 0);
    expect(sum).toBe(r.homeGoals);
  });

  it('sum of quarter awayGoals equals result awayGoals', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    const sum = r.quarters.reduce((a, q) => a + q.awayGoals, 0);
    expect(sum).toBe(r.awayGoals);
  });

  it('sum of quarter homeBehinds equals result homeBehinds', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    const sum = r.quarters.reduce((a, q) => a + q.homeBehinds, 0);
    expect(sum).toBe(r.homeBehinds);
  });

  it('sum of quarter awayBehinds equals result awayBehinds', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    const sum = r.quarters.reduce((a, q) => a + q.awayBehinds, 0);
    expect(sum).toBe(r.awayBehinds);
  });

  it('all quarter score components are non-negative', () => {
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    r.quarters.forEach(q => {
      expect(q.homeGoals).toBeGreaterThanOrEqual(0);
      expect(q.homeBehinds).toBeGreaterThanOrEqual(0);
      expect(q.homeTotal).toBeGreaterThanOrEqual(0);
      expect(q.awayGoals).toBeGreaterThanOrEqual(0);
      expect(q.awayBehinds).toBeGreaterThanOrEqual(0);
      expect(q.awayTotal).toBeGreaterThanOrEqual(0);
    });
  });

  it('top-level homeTotal, awayTotal, and winner match underlying simMatch', () => {
    seedRng(42);
    const base = simMatch(home, away, false, 70);
    seedRng(42);
    const r = simMatchWithQuarters(home, away, false, 70);
    expect(r.homeTotal).toBe(base.homeTotal);
    expect(r.awayTotal).toBe(base.awayTotal);
    expect(r.winner).toBe(base.winner);
  });

  it('top-level scores are deterministic from the same seed', () => {
    seedRng(42);
    const a = simMatchWithQuarters(home, away, false, 70);
    seedRng(42);
    const b = simMatchWithQuarters(home, away, false, 70);
    expect(a.homeGoals).toBe(b.homeGoals);
    expect(a.awayGoals).toBe(b.awayGoals);
    expect(a.homeBehinds).toBe(b.homeBehinds);
    expect(a.awayBehinds).toBe(b.awayBehinds);
    expect(a.homeTotal).toBe(b.homeTotal);
    expect(a.awayTotal).toBe(b.awayTotal);
    expect(a.winner).toBe(b.winner);
  });
});

describe('scorer attribution', () => {
  it('star forwards finish far more chains than role-player forwards', () => {
    seedRng(7);
    const star = { ...makePlayer(92), id: 'star', position: 'KF', attrs: { kicking: 92, marking: 92 } };
    const others = Array.from({ length: 5 }, (_, i) => ({
      ...makePlayer(58), id: `f${i}`, position: 'HF', attrs: { kicking: 58, marking: 58 },
    }));
    const mids = Array.from({ length: 12 }, (_, i) => ({ ...makePlayer(70), id: `m${i}`, position: 'C' }));
    const lineup = [star, ...others, ...mids];
    let starGoals = 0;
    let otherGoals = 0;
    for (let i = 0; i < 40; i++) {
      const r = simMatchWithQuarters({ rating: 70 }, { rating: 70 }, true, 70, {
        tactic: 'balanced', playerLineup: lineup, oppLineup: [],
      });
      const ga = r.goalAttribution || {};
      starGoals += ga.star?.goals || 0;
      others.forEach((o) => { otherGoals += ga[o.id]?.goals || 0; });
    }
    const otherAvg = otherGoals / others.length;
    expect(starGoals).toBeGreaterThan(otherAvg * 1.8);
  });
});

describe('defensivePressureMod', () => {
  const backs = (ovr) => Array.from({ length: 6 }, (_, i) => ({
    id: `b${i}`, position: i < 3 ? 'KB' : 'HB', overall: ovr, trueRating: ovr,
    attrs: { marking: ovr, tackling: ovr },
  }));
  const fwds = (ovr) => Array.from({ length: 6 }, (_, i) => ({
    id: `f${i}`, position: i < 3 ? 'KF' : 'HF', overall: ovr, trueRating: ovr,
    attrs: { kicking: ovr, marking: ovr },
  }));

  it('an elite back six suppresses a weak forward line', () => {
    expect(defensivePressureMod(backs(90), fwds(55))).toBeLessThan(1);
  });

  it('a weak back six concedes accuracy to an elite forward line', () => {
    expect(defensivePressureMod(backs(55), fwds(90))).toBeGreaterThan(1);
  });

  it('an even matchup is neutral', () => {
    expect(defensivePressureMod(backs(70), fwds(70))).toBeCloseTo(1, 5);
  });

  it('a defensive gameplan leans into the suppression', () => {
    const neutral = defensivePressureMod(backs(85), fwds(60), 'balanced');
    const defensive = defensivePressureMod(backs(85), fwds(60), 'defensive');
    expect(defensive).toBeLessThan(neutral);
  });

  it('missing lineups are neutral', () => {
    expect(defensivePressureMod([], fwds(70))).toBe(1);
    expect(defensivePressureMod(backs(70), [])).toBe(1);
  });
});

describe('weatherAccuracyMod', () => {
  it('fine weather is neutral', () => {
    expect(weatherAccuracyMod('fine', 'attack')).toBe(1);
    expect(weatherAccuracyMod(null, 'attack')).toBe(1);
  });

  it('rain punishes attacking plans more than containing ones', () => {
    expect(weatherAccuracyMod('rain', 'attack')).toBeLessThan(weatherAccuracyMod('rain', 'defensive'));
    expect(weatherAccuracyMod('rain', 'attack')).toBeLessThan(1);
  });

  it('wind sits between fine and rain for the same tactic', () => {
    expect(weatherAccuracyMod('wind', 'attack')).toBeGreaterThan(weatherAccuracyMod('rain', 'attack'));
    expect(weatherAccuracyMod('wind', 'attack')).toBeLessThan(1);
  });
});

describe('morale in effective rating', () => {
  it('a buoyant player outrates a flat one, all else equal', () => {
    const high = playerEffectiveMatchRating({ overall: 70, form: 70, fitness: 90, morale: 90 });
    const low = playerEffectiveMatchRating({ overall: 70, form: 70, fitness: 90, morale: 55 });
    expect(high).toBeGreaterThan(low);
  });

  it('mean morale (75) leaves the rating unchanged', () => {
    const withMorale = playerEffectiveMatchRating({ overall: 70, form: 70, fitness: 90, morale: 75 });
    const noMorale = playerEffectiveMatchRating({ overall: 70, form: 70, fitness: 90 });
    expect(withMorale).toBeCloseTo(noMorale, 8);
  });
});

describe('benchStrengthBonus', () => {
  it('is zero before Q3', () => {
    const squad = makeSquad(26, 75);
    const lineup = squad.slice(0, 18).map((p) => p.id);
    expect(benchStrengthBonus(squad, lineup, 1)).toBe(0);
    expect(benchStrengthBonus(squad, lineup, 2)).toBe(0);
  });

  it('rewards a deep bench in Q3–Q4 when bench tops starters', () => {
    const starters = Array.from({ length: 18 }, (_, i) => ({ ...makePlayer(58), id: `s${i}` }));
    const bench = Array.from({ length: 10 }, (_, i) => ({ ...makePlayer(88), id: `b${i}` }));
    const squad = [...starters, ...bench];
    const lineup = starters.map((p) => p.id);
    const q3 = benchStrengthBonus(squad, lineup, 3);
    const q4 = benchStrengthBonus(squad, lineup, 4);
    expect(q3).toBeGreaterThan(0);
    expect(q4).toBeGreaterThanOrEqual(q3);
  });
});

describe('adaptiveOppTactic — AI reacts to the scoreboard', () => {
  it('holds the pre-match plan through the first half', () => {
    expect(adaptiveOppTactic('balanced', 40, 0)).toBe('balanced');
    expect(adaptiveOppTactic('attack', -40, 1)).toBe('attack');
  });

  it('locks down a lead in the second half', () => {
    expect(adaptiveOppTactic('attack', 12, 2)).toBe('defensive'); // handy lead
    expect(adaptiveOppTactic('balanced', 25, 3)).toBe('flood');   // big lead
  });

  it('chases the game when behind in the second half', () => {
    expect(adaptiveOppTactic('balanced', -12, 2)).toBe('run');
    expect(adaptiveOppTactic('defensive', -25, 3)).toBe('attack');
  });

  it('keeps the plan when the margin is tight', () => {
    expect(adaptiveOppTactic('press', 6, 3)).toBe('press');
    expect(adaptiveOppTactic('balanced', -5, 2)).toBe('balanced');
  });
});

describe('pickInjury (typed injury system)', () => {
  it('returns a valid type/label/severity with weeks inside the table bounds', () => {
    seedRng(7);
    for (let i = 0; i < 200; i++) {
      const inj = pickInjury();
      const entry = INJURY_TABLE.find((e) => e.type === inj.type && e.label === inj.label);
      expect(entry).toBeTruthy();
      expect(['mild', 'moderate', 'severe']).toContain(inj.severity);
      expect(inj.weeks).toBeGreaterThanOrEqual(entry.minWeeks);
      expect(inj.weeks).toBeLessThanOrEqual(entry.maxWeeks);
      // mild = lower bound, severe = upper bound
      if (inj.severity === 'mild') expect(inj.weeks).toBe(entry.minWeeks);
      if (inj.severity === 'severe') expect(inj.weeks).toBe(entry.maxWeeks);
    }
  });

  it('table weights are a valid distribution (sum ≈ 1)', () => {
    const total = INJURY_TABLE.reduce((s, e) => s + e.chance, 0);
    expect(total).toBeCloseTo(1, 2);
  });
});
