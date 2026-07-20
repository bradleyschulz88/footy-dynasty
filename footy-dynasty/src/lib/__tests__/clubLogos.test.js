// Guards the bring-your-own logo resolver: the repo ships no logo files
// (official marks are trademarked), so by default every club falls back to
// the procedural crest — and the resolver must never crash on odd input.
import { describe, it, expect } from "vitest";
import { clubLogoUrl, CLUB_LOGO_URLS } from "../clubLogos.js";

describe("clubLogoUrl", () => {
  it("ships no bundled logos by default (procedural crests everywhere)", () => {
    expect(Object.keys(CLUB_LOGO_URLS)).toHaveLength(0);
  });

  it("returns null (never throws) for unknown/odd club ids", () => {
    expect(clubLogoUrl("col")).toBeNull();
    expect(clubLogoUrl("")).toBeNull();
    expect(clubLogoUrl(null)).toBeNull();
    expect(clubLogoUrl(undefined)).toBeNull();
    expect(clubLogoUrl("VFL_WERRIBEE")).toBeNull(); // case-insensitive path, still null when absent
  });
});
