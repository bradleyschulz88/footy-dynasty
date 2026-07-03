import { describe, it, expect } from "vitest";
import { seasonDistribution, careerSeasonDistribution } from "../finance/distribution.js";
import { TIER_FINANCE } from "../finance/constants.js";

const T1 = TIER_FINANCE[1].annualIncome;

describe("seasonDistribution", () => {
  it("pays nothing for tier 3/4 (and unknown tiers)", () => {
    for (const tier of [3, 4, 0, undefined]) {
      expect(seasonDistribution({ tier, ladderPos: 10, ladderSize: 18, annualIncome: 300_000 }))
        .toEqual({ base: 0, equalisation: 0, total: 0 });
    }
  });

  it("equalisation is monotonic in ladder position — finishing lower never pays less", () => {
    let prev = -1;
    for (let pos = 1; pos <= 18; pos++) {
      const { equalisation } = seasonDistribution({ tier: 1, ladderPos: pos, ladderSize: 18, annualIncome: T1 });
      expect(equalisation).toBeGreaterThanOrEqual(prev);
      prev = equalisation;
    }
    const premier = seasonDistribution({ tier: 1, ladderPos: 1, ladderSize: 18, annualIncome: T1 });
    const spooner = seasonDistribution({ tier: 1, ladderPos: 18, ladderSize: 18, annualIncome: T1 });
    expect(spooner.equalisation).toBeGreaterThan(premier.equalisation);
    expect(premier.equalisation).toBe(0); // full-strength premier gets base only
  });

  it("weights revenue need — a poorer club never receives less than a richer one at the same ladder spot", () => {
    const rich = seasonDistribution({ tier: 1, ladderPos: 9, ladderSize: 18, annualIncome: T1 });
    const poor = seasonDistribution({ tier: 1, ladderPos: 9, ladderSize: 18, annualIncome: T1 * 0.6 });
    expect(poor.equalisation).toBeGreaterThan(rich.equalisation);
    expect(poor.base).toBe(rich.base); // need only affects the top-up
  });

  it("keeps the tier-1 total in the 40–60% band of annual income across the whole ladder", () => {
    for (let pos = 1; pos <= 18; pos++) {
      const { total } = seasonDistribution({ tier: 1, ladderPos: pos, ladderSize: 18, annualIncome: T1 });
      expect(total).toBeGreaterThanOrEqual(T1 * 0.40);
      expect(total).toBeLessThanOrEqual(T1 * 0.60);
    }
  });

  it("wooden-spooner receives at least 15% more than the premier (SC-002)", () => {
    const premier = seasonDistribution({ tier: 1, ladderPos: 1, ladderSize: 18, annualIncome: T1 });
    const spooner = seasonDistribution({ tier: 1, ladderPos: 18, ladderSize: 18, annualIncome: T1 * 0.8 });
    expect(spooner.total).toBeGreaterThanOrEqual(premier.total * 1.15);
  });

  it("normalises by ladder size and survives junk inputs without NaN", () => {
    const smallLast = seasonDistribution({ tier: 2, ladderPos: 10, ladderSize: 10, annualIncome: TIER_FINANCE[2].annualIncome });
    const bigLast = seasonDistribution({ tier: 2, ladderPos: 18, ladderSize: 18, annualIncome: TIER_FINANCE[2].annualIncome });
    expect(smallLast.equalisation).toBe(bigLast.equalisation); // both wooden spoons → same need
    const junk = seasonDistribution({ tier: 1, ladderPos: NaN, ladderSize: NaN, annualIncome: NaN });
    expect(Number.isFinite(junk.total)).toBe(true);
    expect(junk.total).toBeGreaterThan(0);
  });

  it("is deterministic — identical inputs give identical dollars", () => {
    const args = { tier: 1, ladderPos: 13, ladderSize: 18, annualIncome: T1 * 0.9 };
    expect(seasonDistribution(args)).toEqual(seasonDistribution(args));
  });
});

describe("careerSeasonDistribution", () => {
  it("uses last season's ladder position from history", () => {
    const career = {
      ladder: new Array(18).fill({}),
      history: [{ season: 1, position: 18 }],
      finance: { annualIncome: T1 },
    };
    const viaCareer = careerSeasonDistribution(career, 1);
    const direct = seasonDistribution({ tier: 1, ladderPos: 18, ladderSize: 18, annualIncome: T1 });
    expect(viaCareer).toEqual(direct);
  });

  it("defaults a first season (no history) to mid-table", () => {
    const career = { ladder: new Array(18).fill({}), finance: { annualIncome: T1 } };
    const viaCareer = careerSeasonDistribution(career, 1);
    const direct = seasonDistribution({ tier: 1, ladderPos: 9, ladderSize: 18, annualIncome: T1 });
    expect(viaCareer).toEqual(direct);
  });

  it("survives an empty career object (old saves) without NaN", () => {
    const dist = careerSeasonDistribution({}, 1);
    expect(Number.isFinite(dist.total)).toBe(true);
    expect(dist.total).toBeGreaterThan(0);
  });
});
