import { describe, it, expect } from "vitest";
import { computeLeagueAwards } from "../awards.js";

// Minimal career/ladder using real AFL club ids so findClub resolves short names.
function makeCareer() {
  return {
    clubId: "car",
    season: 2026,
    ladder: [
      { id: "car", pts: 40, pct: 120, F: 2000, A: 1600 },
      { id: "gee", pts: 36, pct: 110, F: 1900, A: 1700 },
      { id: "syd", pts: 20, pct: 95, F: 1700, A: 1800 },
    ],
    // user star mid with genuine votes
    brownlow: { u_star: 28 },
    squad: [
      { id: "u_star", firstName: "Sam", lastName: "Walsh", position: "C", overall: 90, age: 24, goals: 8 },
      { id: "u_fwd", firstName: "Charlie", lastName: "Curnow", position: "KF", overall: 88, age: 26, goals: 55 },
    ],
  };
}

describe("computeLeagueAwards", () => {
  it("draws winners from the whole competition, not just the user club", () => {
    const c = makeCareer();
    const ai = {
      gee: [
        { id: "g_gun", firstName: "Patrick", lastName: "Dangerfield", position: "C", overall: 94, age: 27, goals: 20 },
        { id: "g_ff", firstName: "Jeremy", lastName: "Cameron", position: "KF", overall: 92, age: 28, goals: 0 },
      ],
      syd: [
        { id: "s_kid", firstName: "Errol", lastName: "Gulden", position: "WG", overall: 82, age: 20, goals: 12 },
      ],
    };
    const { brownlow, coleman, risingStar } = computeLeagueAwards(c, { tier: 1 }, ai);
    // Every award is populated and carries the winning club.
    for (const a of [brownlow, coleman, risingStar]) {
      expect(a).toBeTruthy();
      expect(a.club).toBeTruthy();
      expect(typeof a.isMine).toBe("boolean");
    }
    // Proof it's league-wide: the best U21 in the competition is Sydney's kid,
    // not one of the user's players — an AI club can win an award.
    expect(risingStar.name).toContain("Gulden");
    expect(risingStar.club).toBe("SYD");
    expect(risingStar.isMine).toBe(false);
    // Brownlow is a genuine, well-rated midfielder with real votes.
    expect(brownlow.votes).toBeGreaterThan(0);
    expect(["C", "R", "WG"]).toContain(brownlow.position);
  });

  it("selects an All-Australian team spanning multiple clubs and lines", () => {
    const c = makeCareer();
    const ai = {};
    // build a deep pool so all lines can fill
    const lines = { KB: "def", HB: "def", C: "mid", R: "mid", WG: "mid", KF: "fwd", HF: "fwd", RU: "ruck" };
    ["gee", "syd", "bri", "col", "haw", "ess"].forEach((club, ci) => {
      ai[club] = Object.keys(lines).map((pos, pi) => ({
        id: `${club}_${pos}_${pi}`, firstName: club.toUpperCase(), lastName: pos,
        position: pos, overall: 70 + ((ci + pi) % 20), age: 25, goals: pos === "KF" ? 30 : 2,
      }));
    });
    const { allAustralian } = computeLeagueAwards(c, { tier: 1 }, ai);
    expect(allAustralian.length).toBeGreaterThanOrEqual(19);
    // has each line represented
    expect(allAustralian.some((p) => p.line === "DEF")).toBe(true);
    expect(allAustralian.some((p) => p.line === "MID")).toBe(true);
    expect(allAustralian.some((p) => p.line === "FWD")).toBe(true);
    expect(allAustralian.some((p) => p.line === "RUCK")).toBe(true);
    // drawn from more than one club
    expect(new Set(allAustralian.map((p) => p.club)).size).toBeGreaterThan(1);
    // no duplicate players
    expect(new Set(allAustralian.map((p) => p.name + p.club)).size).toBe(allAustralian.length);
  });

  it("respects the user's real accrued goals for their own players", () => {
    const c = makeCareer();
    // No AI forwards with goals → user's 55-goal forward leads the Coleman.
    const { coleman } = computeLeagueAwards(c, { tier: 1 }, {});
    expect(coleman.name).toContain("Curnow");
    expect(coleman.goals).toBe(55);
    expect(coleman.isMine).toBe(true);
  });
});
