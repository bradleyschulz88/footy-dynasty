import { describe, it, expect } from "vitest";
import { addIdToLineupInBucket } from "../lineupHelpers.js";

describe("addIdToLineupInBucket", () => {
  const squad = [
    { id: "a", position: "KF" },
    { id: "b", position: "RU" },
    { id: "c", position: "C" },
  ];

  it("inserts after the last player already in that line bucket", () => {
    expect(addIdToLineupInBucket(["b", "a"], squad, "c", "fwd")).toEqual(["b", "a", "c"]);
  });

  it("when bucket empty, orders before first line with higher bucket order", () => {
    expect(addIdToLineupInBucket(["b", "a"], squad, "c", "mid")).toEqual(["c", "b", "a"]);
  });

  it("moves an existing id to end of its line bucket among teammates", () => {
    const sq = [
      { id: "a1", position: "KF" },
      { id: "a2", position: "HF" },
      { id: "b", position: "RU" },
    ];
    expect(addIdToLineupInBucket(["b", "a1", "a2"], sq, "a1", "fwd")).toEqual(["b", "a2", "a1"]);
  });
});
