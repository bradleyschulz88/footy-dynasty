import { describe, it, expect } from "vitest";
import { memberCount, careerMemberCount } from "../finance/membership.js";
import { MEMBER_BASE } from "../finance/constants.js";

describe("memberCount", () => {
  it("scales by tier base at health 1.0", () => {
    expect(memberCount(1, 1.0)).toBe(MEMBER_BASE[1]);
    expect(memberCount(2, 1.0)).toBe(MEMBER_BASE[2]);
    expect(memberCount(3, 1.0)).toBe(MEMBER_BASE[3]);
    expect(memberCount(4, 1.0)).toBe(MEMBER_BASE[4]);
    expect(memberCount(99, 1.0)).toBe(0); // unknown tier
  });
  it("is proportional to membership health and clamped to the engine's 0.5–2.5 range", () => {
    expect(memberCount(1, 2.0)).toBe(MEMBER_BASE[1] * 2);
    expect(memberCount(1, 0.1)).toBe(MEMBER_BASE[1] * 0.5);  // clamped low
    expect(memberCount(1, 9.9)).toBe(MEMBER_BASE[1] * 2.5);  // clamped high
  });
  it("is NaN-safe (old saves) and deterministic", () => {
    expect(memberCount(1, NaN)).toBe(MEMBER_BASE[1]);        // defaults to 1.0
    expect(memberCount(1, undefined)).toBe(MEMBER_BASE[1]);
    expect(memberCount(1, 1.37)).toBe(memberCount(1, 1.37));
  });
});

describe("careerMemberCount", () => {
  it("reads career.membershipBase with a 1.0 default for old saves", () => {
    expect(careerMemberCount({ membershipBase: 1.5 }, 1)).toBe(Math.round(MEMBER_BASE[1] * 1.5));
    expect(careerMemberCount({}, 1)).toBe(MEMBER_BASE[1]);
    expect(careerMemberCount(null, 2)).toBe(MEMBER_BASE[2]);
  });
});
