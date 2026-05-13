import { describe, expect, it } from "vitest";
import { ladderNeighbourRows, ladderNeighbourClubs } from "../hubRivals.js";

describe("hubRivals", () => {
  const rows = [
    { id: "a", pts: 12 },
    { id: "b", pts: 10 },
    { id: "c", pts: 8 },
  ];

  it("returns neighbours beside the player's row", () => {
    expect(ladderNeighbourRows(rows, "b")).toEqual([
      { id: "a", pts: 12 },
      { id: "c", pts: 8 },
    ]);
  });

  it("handles ladder leader (only club below)", () => {
    expect(ladderNeighbourRows(rows, "a")).toEqual([{ id: "b", pts: 10 }]);
  });

  it("returns empty when club not on ladder", () => {
    expect(ladderNeighbourRows(rows, "missing")).toEqual([]);
  });

  it("maps neighbour rows through pyramid ids", () => {
    const pyramidRows = [
      { id: "mel", pts: 48 },
      { id: "car", pts: 44 },
      { id: "haw", pts: 40 },
    ];
    const clubs = ladderNeighbourClubs(pyramidRows, "car");
    expect(clubs).toHaveLength(2);
    expect(clubs.map((x) => x.club.short).sort()).toEqual(["HAW", "MEL"]);
  });
});
