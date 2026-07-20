// Guards the theme registry that drives the pre-game theme picker and the
// resolveThemeClass validation. If dirV5 (Day Match) ever drops out of the
// list, or the toggle stops cycling, the picker silently breaks — these lock
// both down.
import { describe, it, expect } from "vitest";
import {
  DEFAULT_THEME, THEME_CLASSES, THEME_META, SWITCHABLE_THEMES,
  isValidTheme, nextTheme, themeMode,
} from "../themes.js";

describe("theme registry", () => {
  it("recognises every shipped theme and rejects junk", () => {
    expect(isValidTheme("dirV4")).toBe(true);
    expect(isValidTheme("dirV5")).toBe(true);
    expect(isValidTheme("dirV6")).toBe(true);
    expect(isValidTheme("dirV7")).toBe(true);
    expect(isValidTheme("nope")).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme({ id: "dirV4" })).toBe(false);
  });

  it("has both switchable kits with labels and a light/dark mode", () => {
    for (const t of SWITCHABLE_THEMES) {
      expect(THEME_CLASSES).toContain(t);
      expect(THEME_META[t].label).toBeTruthy();
      expect(["light", "dark"]).toContain(THEME_META[t].mode);
    }
    expect(themeMode("dirV4")).toBe("dark");
    expect(themeMode("dirV5")).toBe("light");
  });

  it("cycles through every kit and wraps back to the start", () => {
    // Walk the full ring and confirm it returns to where it began, visiting
    // each switchable kit exactly once.
    const seen = [];
    let cur = SWITCHABLE_THEMES[0];
    for (let i = 0; i < SWITCHABLE_THEMES.length; i++) { seen.push(cur); cur = nextTheme(cur); }
    expect(seen.sort()).toEqual([...SWITCHABLE_THEMES].sort());
    expect(cur).toBe(SWITCHABLE_THEMES[0]); // wrapped
    expect(nextTheme("dirV4")).toBe("dirV5");
  });

  it("recovers from an unknown/legacy current", () => {
    expect(SWITCHABLE_THEMES).toContain(nextTheme("dirB"));
    expect(nextTheme(DEFAULT_THEME)).not.toBe(DEFAULT_THEME);
  });
});
