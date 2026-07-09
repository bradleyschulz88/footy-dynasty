import { describe, it, expect } from "vitest";
import { namingRightsValue, signNamingRights, activeNamingRights, generateSponsorName } from "../finance/namingRights.js";
import { TIER_FINANCE, NAMING_RIGHTS } from "../finance/constants.js";

describe("namingRightsValue", () => {
  it("scales with tier annual income at stadium level 1", () => {
    expect(namingRightsValue(1, 1)).toBe(Math.round(TIER_FINANCE[1].annualIncome * NAMING_RIGHTS.baseShare));
    expect(namingRightsValue(1, 1)).toBeGreaterThan(namingRightsValue(2, 1));
  });
  it("rises monotonically with stadium level", () => {
    let prev = -1;
    for (let lvl = 1; lvl <= 5; lvl++) {
      const v = namingRightsValue(1, lvl);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
  it("is zero for community tiers and unknown tiers", () => {
    for (const t of [3, 4, 0, undefined]) expect(namingRightsValue(t, 5)).toBe(0);
  });
  it("is deterministic and NaN-safe on stadium level", () => {
    expect(namingRightsValue(1, 3)).toBe(namingRightsValue(1, 3));
    expect(Number.isFinite(namingRightsValue(1, NaN))).toBe(true);
  });
});

describe("signNamingRights / activeNamingRights", () => {
  it("builds a valid deal for T1/T2 and returns null for community grounds", () => {
    const deal = signNamingRights({ facilities: { stadium: { level: 2 } }, season: 3 }, 1);
    expect(deal.annualValue).toBe(namingRightsValue(1, 2));
    expect(deal.yearsLeft).toBe(NAMING_RIGHTS.termYears);
    expect(typeof deal.name).toBe("string");
    expect(signNamingRights({ facilities: { stadium: { level: 2 } } }, 3)).toBeNull();
  });
  it("re-signing after a stadium upgrade is worth strictly more", () => {
    const small = signNamingRights({ facilities: { stadium: { level: 1 } } }, 1);
    const big = signNamingRights({ facilities: { stadium: { level: 4 } } }, 1);
    expect(big.annualValue).toBeGreaterThan(small.annualValue);
  });
  it("activeNamingRights treats expired/absent deals as null", () => {
    expect(activeNamingRights({})).toBeNull();
    expect(activeNamingRights({ namingRights: { yearsLeft: 0, annualValue: 100 } })).toBeNull();
    const live = { namingRights: { yearsLeft: 2, annualValue: 100, name: 'X' } };
    expect(activeNamingRights(live)).toEqual(live.namingRights);
  });
  it("generateSponsorName is deterministic per seed", () => {
    expect(generateSponsorName(3)).toBe(generateSponsorName(3));
  });
});
