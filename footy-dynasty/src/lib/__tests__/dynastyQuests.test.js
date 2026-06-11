import { describe, it, expect } from "vitest";
import {
  assignDynastyQuestsForSeason,
  dynastyRecordHomeAwayWin,
  finalizeDynastyLadderAtSeasonEnd,
  ensureDynastyAssignments,
  ensureLegacyMilestones,
  recordCareerWin,
  checkLegacyMilestonesAfterSeason,
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

  describe("legacy milestones", () => {
    it("initialises milestones once per career", () => {
      const c = baseCareer();
      ensureLegacyMilestones(c, 3);
      expect(Array.isArray(c.dynasty.milestones)).toBe(true);
      expect(c.dynasty.milestones.length).toBeGreaterThan(0);
      const before = c.dynasty.milestones.length;
      ensureLegacyMilestones(c, 3); // second call is a no-op
      expect(c.dynasty.milestones.length).toBe(before);
    });

    it("includes tier milestones only when starting tier is below target", () => {
      const tier3 = baseCareer();
      ensureLegacyMilestones(tier3, 3);
      expect(tier3.dynasty.milestones.some((m) => m.id === "legacy_tier2")).toBe(true);
      expect(tier3.dynasty.milestones.some((m) => m.id === "legacy_tier1")).toBe(true);

      const tier1 = baseCareer();
      ensureLegacyMilestones(tier1, 1);
      expect(tier1.dynasty.milestones.some((m) => m.id === "legacy_tier2")).toBe(false);
      expect(tier1.dynasty.milestones.some((m) => m.id === "legacy_tier1")).toBe(false);
    });

    it("recordCareerWin completes career_wins milestone at target", () => {
      const c = baseCareer();
      ensureLegacyMilestones(c, 3);
      const m50 = c.dynasty.milestones.find((m) => m.id === "legacy_wins_50");
      m50.target = 3; // lower target for test speed
      recordCareerWin(c);
      recordCareerWin(c);
      expect(m50.complete).toBe(false);
      recordCareerWin(c);
      expect(m50.complete).toBe(true);
      expect(c.coachReputation).toBeGreaterThan(40);
      expect(c.dynasty.careerWins).toBe(3);
    });

    it("checkLegacyMilestonesAfterSeason completes premiership milestone", () => {
      const c = { ...baseCareer(), coachStats: { premierships: 1, seasonsManaged: 1 } };
      ensureLegacyMilestones(c, 3);
      checkLegacyMilestonesAfterSeason(c, 3);
      const flag1 = c.dynasty.milestones.find((m) => m.id === "legacy_flag_1");
      expect(flag1.complete).toBe(true);
    });

    it("checkLegacyMilestonesAfterSeason completes tier_reached milestone on promotion", () => {
      const c = { ...baseCareer(), coachStats: { premierships: 0, seasonsManaged: 3 } };
      ensureLegacyMilestones(c, 3);
      checkLegacyMilestonesAfterSeason(c, 2); // now in tier 2
      const tier2 = c.dynasty.milestones.find((m) => m.id === "legacy_tier2");
      expect(tier2.complete).toBe(true);
    });
  });
});
