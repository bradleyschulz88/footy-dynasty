import { describe, it, expect } from "vitest";
import { defaultVision, evaluateBoardVision, visionSummary } from "../boardVision.js";

describe("defaultVision", () => {
  it("gives T1/T2 a finals mandate and T3/T4 a solvency mandate, 3-season horizon", () => {
    const v1 = defaultVision(2026, 1);
    expect(v1.type).toBe('finals_by');
    expect(v1.targetSeason).toBe(2029);
    expect(defaultVision(2026, 3).type).toBe('solvency_by');
  });
});

describe("evaluateBoardVision", () => {
  const vision = defaultVision(2026, 1); // finals_by, target 2029

  it("carries over unchanged while inside the window and unmet", () => {
    const r = evaluateBoardVision(vision, { madeFinals: false, cash: 100, season: 2027, tier: 1 });
    expect(r.achieved).toBe(false);
    expect(r.expired).toBe(false);
    expect(r.confidenceDelta).toBe(0);
    expect(r.lines).toHaveLength(0);
    expect(r.nextVision).toBe(vision);
  });

  it("is achieved early on making finals — confidence up, fresh further-out mandate", () => {
    const r = evaluateBoardVision(vision, { madeFinals: true, season: 2027, tier: 1 });
    expect(r.achieved).toBe(true);
    expect(r.confidenceDelta).toBeGreaterThan(0);
    expect(r.lines).toHaveLength(1);
    expect(r.nextVision.targetSeason).toBe(2028 + 3); // seeded from season+1
  });

  it("expires at the deadline when unmet — confidence down, fresh mandate", () => {
    const r = evaluateBoardVision(vision, { madeFinals: false, season: 2029, tier: 1 });
    expect(r.expired).toBe(true);
    expect(r.achieved).toBe(false);
    expect(r.confidenceDelta).toBeLessThan(0);
    expect(r.nextVision).not.toBe(vision);
  });

  it("solvency mandate is only judged at the deadline", () => {
    const sv = defaultVision(2026, 3); // solvency_by, target 2029
    // solvent but before deadline → ongoing
    expect(evaluateBoardVision(sv, { cash: 500, season: 2027, tier: 3 }).achieved).toBe(false);
    // solvent at deadline → achieved
    expect(evaluateBoardVision(sv, { cash: 500, season: 2029, tier: 3 }).achieved).toBe(true);
    // insolvent at deadline → expired
    expect(evaluateBoardVision(sv, { cash: -500, season: 2029, tier: 3 }).expired).toBe(true);
  });

  it("is deterministic and null-safe", () => {
    const ctx = { madeFinals: true, season: 2028, tier: 1 };
    expect(evaluateBoardVision(vision, ctx)).toEqual(evaluateBoardVision(vision, ctx));
    expect(evaluateBoardVision(null, ctx)).toEqual({ achieved: false, expired: false, lines: [], confidenceDelta: 0, nextVision: null });
  });
});

describe("visionSummary", () => {
  it("reports seasons left and flags the final season urgent", () => {
    const v = defaultVision(2026, 1); // target 2029
    expect(visionSummary(v, 2026).seasonsLeft).toBe(3);
    expect(visionSummary(v, 2028).seasonsLeft).toBe(1);
    expect(visionSummary(v, 2028).urgent).toBe(true);
    expect(visionSummary(v, 2027).urgent).toBe(false);
    expect(visionSummary(null, 2026)).toBeNull();
  });
});
