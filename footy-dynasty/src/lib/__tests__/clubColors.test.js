// Guards the club-theme colour path.
//
// Regression context: ThemeProvider used to call injectClubTheme({colors,id})
// with an OBJECT, but the lookup (findClub / CLUB_COLOR_MAP) keys off a STRING
// id — so every club silently fell back to the gold default. generateClubTheme
// must return each club's real colours when handed its id string, and only the
// gold fallback for genuinely unknown ids. If the object bug ever returns,
// real clubs would resolve to the fallback and these assertions fail.
import { describe, it, expect } from "vitest";
import { generateClubTheme } from "../clubColors.ts";

const GOLD_FALLBACK = "#e8b43f";

describe("generateClubTheme", () => {
  it("resolves a known club's mapped primary colour from its id string", () => {
    expect(generateClubTheme("col").primary).toBe("#000000"); // Collingwood black
    expect(generateClubTheme("ric").primary).toBe("#FFD200"); // Richmond yellow
    expect(generateClubTheme("col").primary).not.toBe(GOLD_FALLBACK);
  });

  it("computes readable text-on-primary (dark ink on light club colour)", () => {
    // Richmond primary is bright yellow → text must go dark, not white.
    expect(generateClubTheme("ric").textOnPrimary.toLowerCase()).not.toBe("#ffffff");
  });

  it("only falls back to gold for genuinely unknown ids", () => {
    // A non-string / unmatched id is exactly what the old object-passing bug hit.
    expect(generateClubTheme("___nope___").primary).toBe(GOLD_FALLBACK);
    expect(generateClubTheme({ id: "col" }).primary).toBe(GOLD_FALLBACK);
  });
});
