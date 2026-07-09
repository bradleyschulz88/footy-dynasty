import { describe, it, expect } from "vitest";
import { simulateAflwSeason, clubAflwStrength, aflwProgramCost, establishAflw, aflwActive, AFLW_LADDER_SIZE } from "../aflw.js";
import { TIER_FINANCE } from "../finance/constants.js";

describe("simulateAflwSeason", () => {
  it("returns in-bounds results", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const r = simulateAflwSeason(70, seed);
      expect(r.position).toBeGreaterThanOrEqual(1);
      expect(r.position).toBeLessThanOrEqual(AFLW_LADDER_SIZE);
      expect(r.wins).toBeGreaterThanOrEqual(0);
      expect(r.wins).toBeLessThanOrEqual(AFLW_LADDER_SIZE);
      expect(r.losses).toBe(AFLW_LADDER_SIZE - r.wins);
      if (r.premiers) expect(r.position).toBe(1); // premiers only from top spot
    }
  });
  it("is deterministic per (strength, seed)", () => {
    expect(simulateAflwSeason(80, 2026)).toEqual(simulateAflwSeason(80, 2026));
  });
  it("stronger clubs finish higher in expectation (lower mean position)", () => {
    let strongSum = 0, weakSum = 0;
    const N = 200;
    for (let seed = 1; seed <= N; seed++) {
      strongSum += simulateAflwSeason(90, seed).position;
      weakSum += simulateAflwSeason(35, seed).position;
    }
    expect(strongSum / N).toBeLessThan(weakSum / N);
  });
  it("is NaN-safe on strength", () => {
    const r = simulateAflwSeason(NaN, 5);
    expect(Number.isFinite(r.position)).toBe(true);
  });
});

describe("aflwProgramCost", () => {
  it("is a share of the T1 wage budget and zero below tier 1", () => {
    expect(aflwProgramCost(1)).toBe(Math.round(TIER_FINANCE[1].wageBudget * 0.02));
    for (const t of [2, 3, 4]) expect(aflwProgramCost(t)).toBe(0);
  });
});

describe("clubAflwStrength", () => {
  it("blends coach reputation and board confidence, clamped 20–95", () => {
    expect(clubAflwStrength({ coachReputation: 80, finance: { boardConfidence: 80 } })).toBe(80);
    expect(clubAflwStrength({})).toBeGreaterThanOrEqual(20); // old-save defaults
    expect(clubAflwStrength({ coachReputation: 5, finance: { boardConfidence: 5 } })).toBe(20); // clamp floor
  });
});

describe("establishAflw / aflwActive", () => {
  it("establishes only for tier 1 and only when not already active", () => {
    expect(establishAflw({}, 1)).toEqual({ active: true, lastResult: null, premierships: 0 });
    expect(establishAflw({}, 2)).toBeNull();
    expect(establishAflw({ aflw: { active: true } }, 1)).toBeNull(); // already active
    expect(aflwActive({ aflw: { active: true } })).toBe(true);
    expect(aflwActive({})).toBe(false);
  });
  it("preserves existing premiership count when (re)establishing", () => {
    expect(establishAflw({ aflw: { premierships: 3 } }, 1).premierships).toBe(3);
  });
});
