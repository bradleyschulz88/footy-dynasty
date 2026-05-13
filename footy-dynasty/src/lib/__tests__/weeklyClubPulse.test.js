import { describe, it, expect } from "vitest";
import { dynastyLadderCutoff } from "../weeklyClubPulse.js";

describe("weeklyClubPulse", () => {
  it("dynastyLadderCutoff scales with tier", () => {
    expect(dynastyLadderCutoff(18, 1)).toBe(8);
    expect(dynastyLadderCutoff(12, 2)).toBe(6);
    expect(dynastyLadderCutoff(9, 3)).toBe(5);
  });
});
