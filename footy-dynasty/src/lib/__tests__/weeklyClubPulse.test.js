import { describe, it, expect, beforeEach } from "vitest";
import { dynastyLadderCutoff, weeklyClubOperationsPulse } from "../weeklyClubPulse.js";
import { seedRng } from "../rng.js";

beforeEach(() => seedRng(7));

describe("dynastyLadderCutoff", () => {
  it("scales with tier", () => {
    expect(dynastyLadderCutoff(18, 1)).toBe(8);
    expect(dynastyLadderCutoff(12, 2)).toBe(6);
    expect(dynastyLadderCutoff(9, 3)).toBe(5);
  });

  it("returns 1 for 0 or negative totalTeams", () => {
    expect(dynastyLadderCutoff(0, 1)).toBe(1);
    expect(dynastyLadderCutoff(-5, 1)).toBe(1);
  });

  it("caps tier-1 cutoff at 8 even for a large competition", () => {
    expect(dynastyLadderCutoff(50, 1)).toBe(8);
  });

  it("caps tier-2 cutoff at 6 even for a large competition", () => {
    expect(dynastyLadderCutoff(50, 2)).toBe(6);
  });

  it("tier-3 uses ceil(teams/2), minimum 1", () => {
    expect(dynastyLadderCutoff(7, 3)).toBe(4);
    expect(dynastyLadderCutoff(2, 3)).toBe(1);
    expect(dynastyLadderCutoff(1, 3)).toBe(1);
  });

  it("fewer teams than cap for tier 1 returns actual team count", () => {
    expect(dynastyLadderCutoff(6, 1)).toBe(6);
    expect(dynastyLadderCutoff(4, 2)).toBe(4);
  });
});

describe("weeklyClubOperationsPulse", () => {
  const makeCareer = (overrides = {}) => ({
    week: 10,
    facilities: {
      trainingGround: { level: 3 },
      gym: { level: 3 },
      medical: { level: 3 },
      academy: { level: 3 },
      stadium: { level: 3 },
      recovery: { level: 3 },
    },
    staff: [
      { id: "s1", role: "Senior Coach", rating: 65, volunteer: false, name: "Test Coach" },
    ],
    news: [],
    groundCondition: 85,
    phase: "season",
    training: { intensity: 60, focus: { marking: 30, kicking: 30 } },
    tacticChoice: "balanced",
    ...overrides,
  });

  it("returns early without crashing when facilities are missing", () => {
    const career = makeCareer({ facilities: null });
    expect(() => weeklyClubOperationsPulse(career, 2)).not.toThrow();
    expect(career.news).toEqual([]);
  });

  it("returns early without crashing when staff is not an array", () => {
    const career = makeCareer({ staff: null });
    expect(() => weeklyClubOperationsPulse(career, 2)).not.toThrow();
  });

  it("does not crash with empty staff array", () => {
    const career = makeCareer({ staff: [] });
    expect(() => weeklyClubOperationsPulse(career, 2)).not.toThrow();
  });

  it("may upgrade a staff rating when high-level facilities exist", () => {
    const career = makeCareer({
      facilities: {
        trainingGround: { level: 5 },
        gym: { level: 5 },
        medical: { level: 5 },
        academy: { level: 5 },
        stadium: { level: 5 },
        recovery: { level: 5 },
      },
      staff: [{ id: "s1", role: "Senior Coach", rating: 40, volunteer: false, name: "TC" }],
    });
    let staffUpgraded = false;
    for (let s = 0; s < 60 && !staffUpgraded; s++) {
      seedRng(s);
      const c = { ...career, staff: career.staff.map((st) => ({ ...st })), news: [] };
      weeklyClubOperationsPulse(c, 2);
      if (c.staff[0].rating > 40) staffUpgraded = true;
    }
    // In 60 attempts with rng < 0.085 threshold, at least one should fire
    expect(staffUpgraded).toBe(true);
  });

  it("generates at least one news item across many seeds for medium-level conditions", () => {
    let newsGenerated = false;
    for (let s = 0; s < 100 && !newsGenerated; s++) {
      seedRng(s);
      const c = makeCareer({ news: [] });
      weeklyClubOperationsPulse(c, 2);
      if (c.news.length > 0) newsGenerated = true;
    }
    expect(newsGenerated).toBe(true);
  });
});
