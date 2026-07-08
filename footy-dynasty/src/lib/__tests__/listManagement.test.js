import { describe, it, expect } from "vitest";
import { listMax, listStatus, trimToListMax } from "../listManagement.js";

const mk = (n, base = 60) => Array.from({ length: n }, (_, i) => ({ id: `p${String(i).padStart(2, '0')}`, overall: base + i }));

describe("listMax / listStatus", () => {
  it("returns tier caps and a loose fallback", () => {
    expect(listMax(1)).toBe(44);
    expect(listMax(2)).toBe(40);
    expect(listMax(99)).toBe(40);
  });
  it("reports over/room correctly", () => {
    expect(listStatus(41, 1)).toEqual({ size: 41, max: 44, over: false, room: 3 });
    expect(listStatus(46, 1)).toEqual({ size: 46, max: 44, over: true, room: 0 });
  });
});

describe("trimToListMax", () => {
  it("is a no-op at or under the cap", () => {
    const squad = mk(40);
    const { kept, delisted } = trimToListMax(squad, 44);
    expect(kept).toHaveLength(40);
    expect(delisted).toHaveLength(0);
    expect(trimToListMax(mk(44), 44).delisted).toHaveLength(0); // exactly at cap
  });
  it("trims to exactly the max, delisting the lowest-rated", () => {
    const squad = mk(48, 60); // overalls 60..107
    const { kept, delisted } = trimToListMax(squad, 44);
    expect(kept).toHaveLength(44);
    expect(delisted).toHaveLength(4);
    // the four lowest overalls (60,61,62,63) are the ones delisted
    expect(delisted.map((p) => p.overall).sort((a, b) => a - b)).toEqual([60, 61, 62, 63]);
    expect(Math.min(...kept.map((p) => p.overall))).toBe(64);
  });
  it("is deterministic with a stable id tie-break on equal ratings", () => {
    const squad = [{ id: 'z', overall: 70 }, { id: 'a', overall: 70 }, { id: 'm', overall: 70 }];
    const a = trimToListMax(squad, 2);
    const b = trimToListMax(squad, 2);
    expect(a).toEqual(b);
    expect(a.delisted).toHaveLength(1);
    expect(a.delisted[0].id).toBe('z'); // last by id localeCompare
    expect(a.kept.map((p) => p.id)).toEqual(['a', 'm']);
  });
  it("does not mutate the input", () => {
    const squad = mk(46);
    const copy = squad.map((p) => ({ ...p }));
    trimToListMax(squad, 44);
    expect(squad).toEqual(copy);
  });
});
