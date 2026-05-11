import { describe, it, expect, beforeEach } from 'vitest';
import { simMatchEvents, simMatchWithQuarters } from '../matchEngine.js';
import { seedRng } from '../rng.js';

const lineup = (count, base = 70) =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i}`, position: ['DEF','MID','RUC','FWD','C','HBF','HFF','BPF','FPF','HBP','HFP'][i % 11], overall: base, trueRating: base, form: 70, fitness: 90,
  }));

describe('simMatchEvents', () => {
  beforeEach(() => seedRng(2024));

  it('returns the expected shape', () => {
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23), tactic: 'balanced' });
    expect(r).toMatchObject({
      homeGoals: expect.any(Number),
      homeBehinds: expect.any(Number),
      homeTotal: expect.any(Number),
      awayGoals: expect.any(Number),
      awayBehinds: expect.any(Number),
      awayTotal: expect.any(Number),
      winner: expect.stringMatching(/home|away|draw/),
      quarters: expect.any(Array),
      events: expect.any(Array),
      keyMoments: expect.any(Array),
      votes: expect.any(Array),
      goalAttribution: expect.any(Object),
      injuredPlayerIds: expect.any(Array),
      reportedPlayerIds: expect.any(Array),
    });
  });

  it('always produces 4 quarters', () => {
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    expect(r.quarters.length).toBe(4);
  });

  it('quarter sums equal totals', () => {
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    const hG = r.quarters.reduce((a, q) => a + q.homeGoals, 0);
    const aG = r.quarters.reduce((a, q) => a + q.awayGoals, 0);
    const hB = r.quarters.reduce((a, q) => a + q.homeBehinds, 0);
    const aB = r.quarters.reduce((a, q) => a + q.awayBehinds, 0);
    expect(hG).toBe(r.homeGoals);
    expect(aG).toBe(r.awayGoals);
    expect(hB).toBe(r.homeBehinds);
    expect(aB).toBe(r.awayBehinds);
  });

  it('homeTotal/awayTotal match the AFL formula', () => {
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    expect(r.homeTotal).toBe(r.homeGoals * 6 + r.homeBehinds);
    expect(r.awayTotal).toBe(r.awayGoals * 6 + r.awayBehinds);
  });

  it('attribution sums to player-side scoreboard when player is home', () => {
    seedRng(7);
    const ll = lineup(23);
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: ll });
    const totalGoals   = Object.values(r.goalAttribution).reduce((a, v) => a + v.goals, 0);
    const totalBehinds = Object.values(r.goalAttribution).reduce((a, v) => a + v.behinds, 0);
    expect(totalGoals).toBe(r.homeGoals);
    expect(totalBehinds).toBe(r.homeBehinds);
  });

  it('attribution sums to player-side scoreboard when player is away', () => {
    seedRng(11);
    const ll = lineup(23);
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, false, 70, { playerLineup: ll });
    const totalGoals   = Object.values(r.goalAttribution).reduce((a, v) => a + v.goals, 0);
    const totalBehinds = Object.values(r.goalAttribution).reduce((a, v) => a + v.behinds, 0);
    expect(totalGoals).toBe(r.awayGoals);
    expect(totalBehinds).toBe(r.awayBehinds);
  });

  it('produces between 0 and 3 votes, all referencing real player ids', () => {
    seedRng(3);
    const ll = lineup(23);
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: ll });
    expect(r.votes.length).toBeLessThanOrEqual(3);
    const ids = new Set(ll.map(p => p.id));
    r.votes.forEach(v => expect(ids.has(v.playerId)).toBe(true));
    r.votes.forEach((v, i) => expect(v.votes).toBe(3 - i));
  });

  it('attack tactic raises shot rate above defensive', () => {
    seedRng(50);
    let attackPlayerScore = 0;
    let defensivePlayerScore = 0;
    for (let i = 0; i < 25; i++) {
      seedRng(1000 + i);
      const a = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23), tactic: 'attack', oppTactic: 'balanced' });
      seedRng(1000 + i);
      const d = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23), tactic: 'defensive', oppTactic: 'balanced' });
      attackPlayerScore    += a.homeTotal;
      defensivePlayerScore += d.homeTotal;
    }
    expect(attackPlayerScore).toBeGreaterThan(defensivePlayerScore);
  });

  it('momentum stays in [-1, 1] across all quarters', () => {
    seedRng(5);
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    r.quarters.forEach(q => {
      expect(q.momentumEnd).toBeGreaterThanOrEqual(-1);
      expect(q.momentumEnd).toBeLessThanOrEqual(1);
    });
  });

  it('events flat list equals the concatenated quarter events', () => {
    seedRng(6);
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    const concat = r.quarters.flatMap(q => q.events);
    expect(r.events.length).toBe(concat.length);
  });

  it('all event minutes are within their quarter window', () => {
    seedRng(8);
    const r = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    r.events.forEach(ev => {
      const lo = (ev.q - 1) * 25;
      const hi = (ev.q - 1) * 25 + 24;
      expect(ev.minute).toBeGreaterThanOrEqual(lo);
      expect(ev.minute).toBeLessThanOrEqual(hi);
    });
  });

  it('is deterministic for the same seed', () => {
    seedRng(2024);
    const a = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    seedRng(2024);
    const b = simMatchEvents({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23) });
    expect(a.homeTotal).toBe(b.homeTotal);
    expect(a.awayTotal).toBe(b.awayTotal);
    expect(a.events.length).toBe(b.events.length);
    expect(a.votes).toEqual(b.votes);
  });

  it('without tactic/lineup options simMatchWithQuarters falls back to the legacy splitter (empty events)', () => {
    seedRng(40);
    const r = simMatchWithQuarters({ rating: 70 }, { rating: 70 }, false, 70);
    expect(Array.isArray(r.events)).toBe(true);
    expect(r.events.length).toBe(0);
    expect(r.keyMoments.length).toBe(0);
    expect(r.votes.length).toBe(0);
    expect(r.quarters.length).toBe(4);
  });

  it('with playerLineup, simMatchWithQuarters routes through simMatchEvents', () => {
    seedRng(40);
    const r = simMatchWithQuarters({ rating: 70 }, { rating: 70 }, true, 70, { playerLineup: lineup(23), tactic: 'balanced' });
    expect(Array.isArray(r.events)).toBe(true);
    expect(r.votes).toBeDefined();
  });
});
