import { describe, it, expect } from "vitest";
import {
  addIdToLineupInBucket,
  placeOrSwapLineupSlot,
  swapLineupSlots,
  lineupPlayerSlotIndex,
  isPlayerAvailable,
  sanitizeLineup,
  lineupRole,
  addToBench,
  LINEUP_CAP,
} from "../lineupHelpers.js";

describe("lineupRole", () => {
  // slots 0–17 = on-ground (field), 18–22 = interchange (bench)
  const lineup = Array.from({ length: 23 }, (_, i) => `p${i}`);
  it("classifies field, bench, sub and out by slot", () => {
    expect(lineupRole(lineup, null, "p0")).toBe("field");   // first oval slot
    expect(lineupRole(lineup, null, "p17")).toBe("field");  // last on-ground slot
    expect(lineupRole(lineup, null, "p18")).toBe("bench");  // first interchange slot
    expect(lineupRole(lineup, null, "p22")).toBe("bench");  // last interchange slot
    expect(lineupRole(lineup, null, "ghost")).toBe("out");  // not selected
  });
  it("marks the designated sub regardless of slot", () => {
    expect(lineupRole(lineup, "p20", "p20")).toBe("sub");
    expect(lineupRole(lineup, "p20", "p19")).toBe("bench");
  });
});

describe("addToBench", () => {
  it("fills the first free interchange slot (18–22) without disturbing others", () => {
    const lineup = Array.from({ length: 20 }, (_, i) => `p${i}`); // 18 on-ground + 2 bench filled
    const next = addToBench(lineup, "new");
    expect(next[20]).toBe("new");               // landed on the next free bench slot
    expect(next.slice(0, 20)).toEqual(lineup);  // everyone else untouched
    expect(lineupRole(next, null, "new")).toBe("bench");
  });
  it("does not mutate the input and is a no-op when the 23 is full", () => {
    const full = Array.from({ length: LINEUP_CAP }, (_, i) => `p${i}`);
    const copy = [...full];
    const next = addToBench(full, "extra");
    expect(full).toEqual(copy);             // input unchanged
    expect(next).toHaveLength(LINEUP_CAP);  // nobody added
    expect(next).not.toContain("extra");
  });
  it("pads a short lineup so the player lands on the bench, not a field slot", () => {
    const next = addToBench(["a", "b"], "c");
    expect(next[18]).toBe("c");             // first bench slot, even though field is mostly empty
    expect(lineupRole(next, null, "c")).toBe("bench");
  });
});

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
