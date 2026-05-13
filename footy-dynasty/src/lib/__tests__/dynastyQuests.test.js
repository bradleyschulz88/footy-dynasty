import { describe, it, expect } from "vitest";
import {
  assignDynastyQuestsForSeason,
  dynastyRecordHomeAwayWin,
  finalizeDynastyLadderAtSeasonEnd,
  ensureDynastyAssignments,
} from "../dynastyQuests.js";

describe("dynastyQuests", () => {
  function baseCareer() {
    return {
      season: 2028,
      coachReputation: 40,
      coachTier: "Journeyman",
      dynasty: null,
      news: [],
    };
  }

  it("assigns two quests keyed to league size", () => {
    const c = baseCareer();
    assignDynastyQuestsForSeason(c, 2, 10);
    expect(c.dynasty.quests.length).toBe(2);
    expect(c.dynasty.quests.some((q) => q.kind === "wins")).toBe(true);
    expect(c.dynasty.quests.some((q) => q.kind === "ladder_pos")).toBe(true);
    expect(c.dynasty.seasonKey).toBe(2028);
  });

  it("counts HA wins toward win quest and awards reputation once", () => {
    const c = baseCareer();
    assignDynastyQuestsForSeason(c, 3, 10);
    const winQ = c.dynasty.quests.find((q) => q.kind === "wins");
    winQ.target = 2;
    dynastyRecordHomeAwayWin(c);
    dynastyRecordHomeAwayWin(c);
    expect(winQ.complete).toBe(true);
    expect(c.coachReputation).toBeGreaterThan(40);
    expect(c.news.some((n) => n.text.includes("Dynasty goal"))).toBe(true);
  });

  it("finalizeDynastyLadderAtSeasonEnd completes ladder quest when placement met", () => {
    const c = baseCareer();
    assignDynastyQuestsForSeason(c, 3, 8);
    const ladderQ = c.dynasty.quests.find((q) => q.kind === "ladder_pos");
    expect(ladderQ).toBeTruthy();
    finalizeDynastyLadderAtSeasonEnd(c, 3, 8, 3);
    expect(ladderQ.complete).toBe(true);
  });

  it("ensureDynastyAssignments fills empty migrated saves", () => {
    const c = { ...baseCareer(), dynasty: { seasonKey: null, quests: [], lifetimeGoals: 0 } };
    ensureDynastyAssignments(c, 2, 11);
    expect(c.dynasty.quests.length).toBe(2);
  });
});
