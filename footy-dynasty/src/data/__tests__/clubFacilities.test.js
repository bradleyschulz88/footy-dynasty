// Guards the real-world facilities data: every AFL club must have a named
// base, every facility must describe all 5 levels, and tier start levels must
// stay inside the upgrade range.
import { describe, it, expect } from "vitest";
import {
  AFL_CLUB_FACILITIES, facilityBaseFor, FACILITY_LEVEL_LABELS,
  facilityLevelLabel, TIER_START_LEVELS, startLevelsForTier,
} from "../clubFacilities.js";
import { PYRAMID } from "../pyramid.js";

describe("AFL club facilities data", () => {
  it("covers every AFL club in the pyramid with a named base", () => {
    for (const club of PYRAMID.AFL.clubs) {
      const fac = AFL_CLUB_FACILITIES[club.id];
      expect(fac, `missing facilities for ${club.id}`).toBeTruthy();
      expect(fac.base.length).toBeGreaterThan(3);
      expect(fac.suburb).toMatch(/, (VIC|NSW|QLD|SA|WA|TAS|NT|ACT)$/);
    }
  });

  it("returns the real base for tier 1 and honest descriptors below", () => {
    expect(facilityBaseFor("col", 1).base).toBe("AIA Centre");
    expect(facilityBaseFor("ess", 1).base).toBe("The Hangar");
    expect(facilityBaseFor("wce", 1).base).toBe("Mineral Resources Park");
    // Non-AFL club id at tier 2/3 gets a tier descriptor, never undefined.
    expect(facilityBaseFor("vfl_werribee", 2).base).toBeTruthy();
    expect(facilityBaseFor("anything", 3).base).toBeTruthy();
  });
});

describe("facility level labels", () => {
  it("describes all 5 levels for all six facilities", () => {
    const keys = ["trainingGround", "gym", "medical", "academy", "stadium", "recovery"];
    for (const key of keys) {
      expect(FACILITY_LEVEL_LABELS[key]).toHaveLength(5);
    }
    expect(facilityLevelLabel("gym", 1)).toMatch(/shed/i);
    expect(facilityLevelLabel("gym", 5)).toMatch(/elite/i);
    // Out-of-range levels clamp instead of crashing the Facilities tab.
    expect(facilityLevelLabel("gym", 0)).toBe(facilityLevelLabel("gym", 1));
    expect(facilityLevelLabel("gym", 99)).toBe(facilityLevelLabel("gym", 5));
    expect(facilityLevelLabel("nope", 3)).toBe("");
  });
});

describe("tier start levels", () => {
  it("stay within 1..5 and rank AFL ≥ state ≥ community for every facility", () => {
    for (const levels of Object.values(TIER_START_LEVELS)) {
      for (const v of Object.values(levels)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
    for (const key of Object.keys(TIER_START_LEVELS[1])) {
      expect(TIER_START_LEVELS[1][key]).toBeGreaterThanOrEqual(TIER_START_LEVELS[2][key]);
      expect(TIER_START_LEVELS[2][key]).toBeGreaterThanOrEqual(TIER_START_LEVELS[3][key]);
    }
    // Unknown tiers resolve to community basics.
    expect(startLevelsForTier(undefined)).toEqual(TIER_START_LEVELS[3]);
    expect(startLevelsForTier(7)).toEqual(TIER_START_LEVELS[3]);
  });
});
