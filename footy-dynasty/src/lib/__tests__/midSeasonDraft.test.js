import { describe, it, expect } from "vitest";
import { maybeOpenMidSeasonDraft, resolveMidSeasonDraft, MID_SEASON_DRAFT_ROUND } from "../midSeasonDraft.js";

const career = (over = {}) => ({ season: 2026, week: MID_SEASON_DRAFT_ROUND, squad: [], news: [], ...over });

describe("mid-season draft", () => {
  it("opens for tier-1 with a 4-player pool and stays closed for lower tiers", () => {
    const open = maybeOpenMidSeasonDraft(career(), { tier: 1 });
    expect(open).toBeTruthy();
    expect(open.pool).toHaveLength(4);
    expect(open.pool.every((p) => p.overall >= 50 && p.overall <= 80)).toBe(true);
    expect(maybeOpenMidSeasonDraft(career(), { tier: 2 })).toBe(null);
  });

  it("does not reopen once done or when the list is full", () => {
    expect(maybeOpenMidSeasonDraft(career({ midSeasonDraftDone: true }), { tier: 1 })).toBe(null);
    const fullList = career({ squad: Array.from({ length: 40 }, (_, i) => ({ id: `p${i}` })) });
    expect(maybeOpenMidSeasonDraft(fullList, { tier: 1 })).toBe(null);
  });

  it("signs the chosen prospect and marks the window done", () => {
    const open = maybeOpenMidSeasonDraft(career(), { tier: 1 });
    const c = career({ midSeasonDraftBlocking: open });
    const pick = open.pool[1];
    const patch = resolveMidSeasonDraft(c, pick.id);
    expect(patch.midSeasonDraftDone).toBe(true);
    expect(patch.midSeasonDraftBlocking).toBe(null);
    expect(patch.squad).toHaveLength(1);
    expect(patch.squad[0].id).toBe(pick.id);
  });

  it("passing adds no one but still closes the window", () => {
    const open = maybeOpenMidSeasonDraft(career(), { tier: 1 });
    const patch = resolveMidSeasonDraft(career({ midSeasonDraftBlocking: open }), null);
    expect(patch.midSeasonDraftDone).toBe(true);
    expect(patch.squad).toBeUndefined();
  });
});
