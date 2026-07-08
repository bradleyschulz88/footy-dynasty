import { describe, it, expect, beforeEach } from "vitest";
import { seedRng } from "../rng.js";
import { reservesGame, playReservesRound } from "../reserves.js";

beforeEach(() => seedRng(42));

const player = (over = {}) => ({
  id: "p1", firstName: "Joe", lastName: "Fringe",
  age: 26, overall: 70, potential: 80, form: 60, injured: 0, suspended: 0,
  ...over,
});

describe("reservesGame", () => {
  it("is deterministic under the seeded rng", () => {
    seedRng(7);
    const a = reservesGame(player(), 3);
    seedRng(7);
    const b = reservesGame(player(), 3);
    expect(a).toEqual(b);
  });

  it("produces a bounded stat line and form move", () => {
    for (let i = 0; i < 60; i++) {
      const patch = reservesGame(player({ form: 60 }));
      expect(patch.lastReserves.disposals).toBeGreaterThanOrEqual(5);
      expect(patch.lastReserves.disposals).toBeLessThanOrEqual(35);
      expect(patch.lastReserves.goals).toBeGreaterThanOrEqual(0);
      expect(patch.lastReserves.rating).toBeGreaterThanOrEqual(1);
      expect(patch.lastReserves.rating).toBeLessThanOrEqual(10);
      expect(patch.form).toBeGreaterThanOrEqual(56); // 60 + floor(-4)
      expect(patch.form).toBeLessThanOrEqual(66);    // 60 + cap(+6)
    }
  });

  it("scales stat lines with ability", () => {
    seedRng(9);
    let gunTotal = 0, batTotal = 0;
    for (let i = 0; i < 40; i++) gunTotal += reservesGame(player({ overall: 92 })).lastReserves.disposals;
    for (let i = 0; i < 40; i++) batTotal += reservesGame(player({ overall: 48 })).lastReserves.disposals;
    expect(gunTotal).toBeGreaterThan(batTotal);
  });

  it("gives under-23s a development pathway and veterans none", () => {
    seedRng(1);
    let kidTicks = 0;
    for (let i = 0; i < 120; i++) {
      const patch = reservesGame(player({ age: 19, overall: 62, potential: 85 }));
      if (patch.overall === 63) kidTicks++;
      expect(patch.overall === undefined || patch.overall === 63).toBe(true); // bounded +1 only
    }
    expect(kidTicks).toBeGreaterThan(0);
    seedRng(1);
    for (let i = 0; i < 120; i++) {
      expect(reservesGame(player({ age: 30, overall: 62, potential: 85 })).overall).toBeUndefined();
    }
    // capped at potential — a kid already at potential gets no tick
    seedRng(1);
    for (let i = 0; i < 60; i++) {
      expect(reservesGame(player({ age: 19, overall: 85, potential: 85 })).overall).toBeUndefined();
    }
  });
});

describe("playReservesRound", () => {
  it("excludes injured and suspended players", () => {
    const { updates } = playReservesRound([
      player({ id: "fit" }),
      player({ id: "inj", injured: 2 }),
      player({ id: "susp", suspended: 1 }),
    ]);
    expect(updates.has("fit")).toBe(true);
    expect(updates.has("inj")).toBe(false);
    expect(updates.has("susp")).toBe(false);
  });

  it("picks the highest-rated performer as standout (or null when nobody qualifies)", () => {
    seedRng(3);
    const { updates, standout } = playReservesRound([
      player({ id: "a", overall: 90, firstName: "Gun", lastName: "Kid" }),
      player({ id: "b", overall: 50 }),
      player({ id: "c", overall: 55 }),
    ]);
    if (standout) {
      const best = [...updates.entries()].sort((x, y) => y[1].lastReserves.rating - x[1].lastReserves.rating)[0];
      expect(standout.id).toBe(best[0]);
      expect(standout.rating).toBeGreaterThanOrEqual(7); // threshold
    }
    expect(playReservesRound([]).standout).toBeNull();
    expect(playReservesRound([]).updates.size).toBe(0);
  });
});
