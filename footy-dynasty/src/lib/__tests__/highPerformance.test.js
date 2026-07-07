import { describe, it, expect } from "vitest";
import { hpEffects, hpLevelFor, careerHpEffects } from "../finance/highPerformance.js";
import { HP_LEVELS, TIER_FINANCE } from "../finance/constants.js";

const MAX = HP_LEVELS.length - 1;

describe("hpEffects", () => {
  it("is monotonic in investment — more never worsens any output", () => {
    for (const tier of [1, 2]) {
      for (let l = 1; l <= MAX; l++) {
        const lo = hpEffects(l - 1, tier);
        const hi = hpEffects(l, tier);
        expect(hi.injuryRateMult).toBeLessThanOrEqual(lo.injuryRateMult);      // fewer injuries
        expect(hi.recoveryWeeksBonus).toBeGreaterThanOrEqual(lo.recoveryWeeksBonus);
        expect(hi.preseasonFitnessBonus).toBeGreaterThanOrEqual(lo.preseasonFitnessBonus);
        expect(hi.cost).toBeGreaterThan(lo.cost);                              // cost rises with level
      }
    }
  });

  it("shows diminishing returns — each step improves injury rate less than the previous", () => {
    const d0 = hpEffects(0, 1).injuryRateMult - hpEffects(1, 1).injuryRateMult; // Volunteer→Standard
    const d1 = hpEffects(1, 1).injuryRateMult - hpEffects(2, 1).injuryRateMult; // Standard→Elite
    expect(d0).toBeGreaterThan(0);
    expect(d1).toBeGreaterThan(0);
    expect(d1).toBeLessThan(d0);
  });

  it("cost scales with tier wage budget and is zero for community tiers", () => {
    expect(hpEffects(2, 1).cost).toBeGreaterThan(hpEffects(2, 2).cost); // T1 wageBudget > T2
    expect(hpEffects(2, 1).cost).toBe(Math.round(TIER_FINANCE[1].wageBudget * HP_LEVELS[2].costShare));
    for (const tier of [3, 4]) expect(hpEffects(2, tier).cost).toBe(0);
    expect(hpEffects(0, 1).cost).toBe(0); // volunteer level is free
  });

  it("is deterministic", () => {
    expect(hpEffects(1, 1)).toEqual(hpEffects(1, 1));
  });
});

describe("hpLevelFor", () => {
  it("pins community tiers to the volunteer baseline (0)", () => {
    expect(hpLevelFor({ hpLevel: 2 }, 3)).toBe(0);
    expect(hpLevelFor({ hpLevel: 2 }, 4)).toBe(0);
  });
  it("defaults old/new saves to Standard and clamps out-of-range levels", () => {
    expect(hpLevelFor({}, 1)).toBe(1);
    expect(hpLevelFor({ hpLevel: 99 }, 1)).toBe(MAX);
    expect(hpLevelFor({ hpLevel: -5 }, 2)).toBe(0);
  });
});

describe("careerHpEffects", () => {
  it("community clubs get the free volunteer baseline with no effects", () => {
    const eff = careerHpEffects({ hpLevel: 2 }, 3);
    expect(eff.cost).toBe(0);
    expect(eff.injuryRateMult).toBe(1);
    expect(eff.recoveryWeeksBonus).toBe(0);
    expect(eff.preseasonFitnessBonus).toBe(0);
  });
});
