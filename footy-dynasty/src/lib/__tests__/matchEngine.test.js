import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import { teamRating, simMatch, simMatchWithQuarters, aiClubRating } from '../matchEngine.js';

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
