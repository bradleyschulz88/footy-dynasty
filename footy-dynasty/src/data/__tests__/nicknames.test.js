import { describe, it, expect } from "vitest";
import { NICKNAME_BY_CLUB_ID, clubNickname } from "../nicknames.js";
import { findClub } from "../pyramid.js";

describe("club nicknames", () => {
  it("resolves by id and by club object", () => {
    expect(clubNickname("sanfl_norwood")).toBe("Redlegs");
    expect(clubNickname(findClub("wafl_east_perth"))).toBe("Royals");
  });

  it("returns null for AFL clubs (name already carries it) and bad input", () => {
    expect(clubNickname("car")).toBe(null);
    expect(clubNickname(null)).toBe(null);
    expect(clubNickname(undefined)).toBe(null);
  });

  // Guards against id drift if the pyramid is regenerated.
  it("every mapped id exists in the pyramid", () => {
    for (const id of Object.keys(NICKNAME_BY_CLUB_ID)) {
      expect(findClub(id), `unknown club id: ${id}`).toBeTruthy();
    }
  });
});
