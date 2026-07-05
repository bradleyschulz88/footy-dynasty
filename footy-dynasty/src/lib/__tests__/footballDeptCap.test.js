import { describe, it, expect } from "vitest";
import { footballDeptCap, footballDeptLevy, careerFootballDept } from "../finance/footballDept.js";
import { TIER_FINANCE, FOOTBALL_DEPT_CAP_SHARE, FOOTBALL_DEPT_LEVY_RATE } from "../finance/constants.js";

describe("footballDeptCap", () => {
  it("anchors to the tier wageBudget share for T1/T2", () => {
    expect(footballDeptCap(1)).toBe(Math.round(TIER_FINANCE[1].wageBudget * FOOTBALL_DEPT_CAP_SHARE[1]));
    expect(footballDeptCap(2)).toBe(Math.round(TIER_FINANCE[2].wageBudget * FOOTBALL_DEPT_CAP_SHARE[2]));
  });
  it("is null for community tiers and unknown tiers", () => {
    for (const tier of [3, 4, 0, undefined, 99]) expect(footballDeptCap(tier)).toBeNull();
  });
});

describe("footballDeptLevy", () => {
  const cap = footballDeptCap(1);
  it("charges nothing at or under the cap", () => {
    expect(footballDeptLevy({ tier: 1, staffWages: 0 }).levy).toBe(0);
    expect(footballDeptLevy({ tier: 1, staffWages: cap - 1 }).levy).toBe(0);
    expect(footballDeptLevy({ tier: 1, staffWages: cap }).levy).toBe(0); // exactly at cap
  });
  it("charges exactly the levy rate on the excess", () => {
    const r = footballDeptLevy({ tier: 1, staffWages: cap + 400_000 });
    expect(r.over).toBe(400_000);
    expect(r.levy).toBe(Math.round(400_000 * FOOTBALL_DEPT_LEVY_RATE));
  });
  it("never levies capless tiers regardless of spend", () => {
    const r = footballDeptLevy({ tier: 3, staffWages: 10_000_000 });
    expect(r).toEqual({ cap: null, spend: 10_000_000, over: 0, levy: 0 });
  });
  it("is NaN-safe and deterministic", () => {
    expect(footballDeptLevy({ tier: 1, staffWages: NaN }).spend).toBe(0);
    expect(footballDeptLevy({ tier: 1, staffWages: NaN }).levy).toBe(0);
    const args = { tier: 1, staffWages: cap + 123_456 };
    expect(footballDeptLevy(args)).toEqual(footballDeptLevy(args));
  });
});

describe("careerFootballDept", () => {
  it("sums career.staff wages (missing wages = 0) and handles empty careers", () => {
    const career = { staff: [{ wage: 900_000 }, { wage: 700_000 }, {}] };
    expect(careerFootballDept(career, 1).spend).toBe(1_600_000);
    expect(careerFootballDept({}, 1).spend).toBe(0);
    expect(careerFootballDept({}, 1).levy).toBe(0);
  });
});
