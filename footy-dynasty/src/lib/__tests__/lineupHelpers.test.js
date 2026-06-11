import { describe, it, expect } from "vitest";
import {
  addIdToLineupInBucket,
  placeOrSwapLineupSlot,
  swapLineupSlots,
  lineupPlayerSlotIndex,
  isPlayerAvailable,
  sanitizeLineup,
} from "../lineupHelpers.js";

describe("isPlayerAvailable", () => {
  it("is true for a fit player and false for injured/suspended/missing", () => {
    expect(isPlayerAvailable({ id: "a" })).toBe(true);
    expect(isPlayerAvailable({ id: "a", injured: 0, suspended: 0 })).toBe(true);
    expect(isPlayerAvailable({ id: "a", injured: 2 })).toBe(false);
    expect(isPlayerAvailable({ id: "a", suspended: 1 })).toBe(false);
    expect(isPlayerAvailable(null)).toBe(false);
  });
});

describe("sanitizeLineup", () => {
  const squad = [
    { id: "fit", injured: 0, suspended: 0 },
    { id: "hurt", injured: 2, suspended: 0 },
    { id: "banned", injured: 0, suspended: 1 },
  ];

  it("clears slots for injured and suspended players in place", () => {
    expect(sanitizeLineup(["fit", "hurt", "banned", "fit2"], squad)).toEqual(["fit"]);
    expect(sanitizeLineup(["hurt", "fit"], squad)).toEqual([null, "fit"]);
  });

  it("clears ids that no longer exist in the squad (retired/released/traded)", () => {
    expect(sanitizeLineup(["ghost", "fit"], squad)).toEqual([null, "fit"]);
  });

  it("keeps unavailable players when dropUnavailable is false", () => {
    expect(sanitizeLineup(["hurt", "ghost", "fit"], squad, { dropUnavailable: false })).toEqual([
      "hurt",
      null,
      "fit",
    ]);
  });

  it("preserves slot positions and trims trailing empties", () => {
    expect(sanitizeLineup(["fit", null, "hurt"], squad)).toEqual(["fit"]);
    expect(sanitizeLineup([], squad)).toEqual([]);
    expect(sanitizeLineup(null, squad)).toEqual([]);
  });
});

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

describe("placeOrSwapLineupSlot / swapLineupSlots", () => {
  it("bench-style add replaces incumbent at slot without shifting others", () => {
    const before = ["a", "b", "c", "d", "e"];
    const next = placeOrSwapLineupSlot(before, "new", 2);
    expect(next).toContain("new");
    expect(next).not.toContain("c");
    expect(next[2]).toBe("new");
    expect(next.filter(Boolean).length).toBe(before.length);
  });

  it("swapLineupSlots exchanges two fixed indices", () => {
    const li = ["a", "b", "c"];
    const sw = swapLineupSlots(li, 0, 2);
    expect(sw[0]).toBe("c");
    expect(sw[2]).toBe("a");
    expect(lineupPlayerSlotIndex(sw, "b")).toBe(1);
  });
});
