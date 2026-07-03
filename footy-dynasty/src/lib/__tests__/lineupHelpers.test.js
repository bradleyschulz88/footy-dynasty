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
  hasFreeBenchSlot,
  sanitizeSubPlayerId,
  removeIdFromLineup,
  LINEUP_CAP,
  slotRoleCode,
  playerFitsSlot,
} from "../lineupHelpers.js";

describe("removeIdFromLineup", () => {
  it("nulls the slot in place — no player shifts position", () => {
    const lineup = Array.from({ length: 23 }, (_, i) => `p${i}`);
    const next = removeIdFromLineup(lineup, "p4"); // remove a half-back
    expect(next[4]).toBeNull();          // slot vacated
    expect(next[5]).toBe("p5");          // nobody slides up
    expect(next[18]).toBe("p18");        // interchange never promoted onto the ground
    expect(next).toHaveLength(23);       // trailing players keep their slots
  });
  it("trims trailing empties after removing the last player", () => {
    const next = removeIdFromLineup(["a", "b", "c"], "c");
    expect(next).toEqual(["a", "b"]);
  });
});

describe("sanitizeSubPlayerId", () => {
  const lineup = Array.from({ length: 23 }, (_, i) => `p${i}`);
  it("keeps a sub who holds an interchange slot", () => {
    expect(sanitizeSubPlayerId(lineup, "p20")).toBe("p20");
  });
  it("clears a sub who is on the ground or out of the 23", () => {
    expect(sanitizeSubPlayerId(lineup, "p5")).toBeNull();   // on-field
    expect(sanitizeSubPlayerId(lineup, "ghost")).toBeNull(); // not selected
    expect(sanitizeSubPlayerId(lineup, null)).toBeNull();
  });
});

describe("hasFreeBenchSlot", () => {
  it("reflects interchange occupancy regardless of field holes", () => {
    expect(hasFreeBenchSlot(Array.from({ length: 20 }, (_, i) => `p${i}`))).toBe(true);  // 2 bench filled
    const full = Array.from({ length: 23 }, (_, i) => `p${i}`);
    expect(hasFreeBenchSlot(full)).toBe(false);
    const fieldHoleBenchFull = full.map((v, i) => (i === 3 ? null : v)); // hole at half-back only
    expect(hasFreeBenchSlot(fieldHoleBenchFull)).toBe(false);
  });
});

describe("slotRoleCode", () => {
  it("maps on-ground slots to AFL roles (defence-top) and interchange to INT", () => {
    expect(slotRoleCode(1)).toBe("FB");   // back line centre
    expect(slotRoleCode(4)).toBe("CHB");  // half-back centre
    expect(slotRoleCode(7)).toBe("C");    // centre
    expect(slotRoleCode(13)).toBe("FF");  // full forward
    expect(slotRoleCode(15)).toBe("RU");  // ruck (first follower)
    expect(slotRoleCode(18)).toBe("INT"); // first interchange slot
    expect(slotRoleCode(22)).toBe("INT");
  });
});

describe("playerFitsSlot", () => {
  const back = { position: "KB", secondaryPosition: "HB" };
  const fwd = { position: "KF", secondaryPosition: "HF" };
  const utilWing = { position: "C", secondaryPosition: "HB" };
  it("accepts a player whose primary or secondary matches the slot's line", () => {
    expect(playerFitsSlot(back, 1)).toBe(true);   // KB in back line
    expect(playerFitsSlot(fwd, 13)).toBe(true);   // KF in forward line
    expect(playerFitsSlot(utilWing, 4)).toBe(true); // secondary HB covers half-back
  });
  it("rejects a player who suits neither line position", () => {
    expect(playerFitsSlot(fwd, 1)).toBe(false);   // a forward in the back line
    expect(playerFitsSlot(back, 13)).toBe(false); // a defender at full forward
  });
  it("lets anyone fill an interchange slot, and handles missing players", () => {
    expect(playerFitsSlot(fwd, 20)).toBe(true);   // interchange accepts anyone
    expect(playerFitsSlot(null, 1)).toBe(false);
  });
  it("matches the oval's zone rules: UT fits everywhere, WG covers HB/HF, followers take rover types", () => {
    const util = { position: "UT", secondaryPosition: null };
    for (const slot of [1, 4, 7, 10, 13, 16]) expect(playerFitsSlot(util, slot)).toBe(true);
    const wing = { position: "WG", secondaryPosition: null };
    expect(playerFitsSlot(wing, 4)).toBe(true);   // WG at half-back — allowed on the oval too
    expect(playerFitsSlot(wing, 10)).toBe(true);  // WG at half-forward
    expect(playerFitsSlot(wing, 1)).toBe(false);  // but not in the back pocket / full-back line
    const rover = { position: "R", secondaryPosition: null };
    expect(playerFitsSlot(rover, 16)).toBe(true); // rover in the followers row
    const keyBack = { position: "KB", secondaryPosition: null };
    expect(playerFitsSlot(keyBack, 15)).toBe(true); // pinch-hitting ruck KB — matches oval rules
  });
});

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
  it("marks the designated sub only while they hold an interchange slot", () => {
    expect(lineupRole(lineup, "p20", "p20")).toBe("sub");   // sub on the interchange
    expect(lineupRole(lineup, "p20", "p19")).toBe("bench"); // other interchange players unaffected
    expect(lineupRole(lineup, "p5", "p5")).toBe("field");   // stale sub id on an on-ground player ≠ sub
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
  it("never falls back to a field hole when the interchange is full", () => {
    const full = Array.from({ length: 23 }, (_, i) => `p${i}`);
    const fieldHole = full.map((v, i) => (i === 1 ? null : v)); // full-back empty, bench full
    const next = addToBench(fieldHole, "new");
    expect(next).not.toContain("new");      // no silent on-ground placement
    expect(next[1]).toBeNull();             // the hole stays for a deliberate assignment
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
