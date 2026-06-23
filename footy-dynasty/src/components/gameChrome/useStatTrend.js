// ---------------------------------------------------------------------------
// useStatTrend — UI-only ▲/▼ direction for a numeric stat across calendar ticks.
//
// Compares the value at the current advance tick against the value captured at
// the previous tick. Purely presentational: it lives in a ref so it never
// triggers a render and resets on reload (no model/save changes needed).
// Returns -1 (down), 0 (flat) or 1 (up).
// ---------------------------------------------------------------------------
import { useRef } from "react";

export function useStatTrend(value, tick) {
  const ref = useRef({ tick, value, dir: 0 });
  if (ref.current.tick !== tick) {
    const dir = value > ref.current.value ? 1 : value < ref.current.value ? -1 : 0;
    ref.current = { tick, value, dir };
  }
  return ref.current.dir;
}

/** Tiny inline ▲/▼ glyph for a trend direction; renders nothing when flat. */
export function trendGlyph(dir) {
  return dir > 0 ? "▲" : dir < 0 ? "▼" : "";
}

export function trendColor(dir) {
  return dir > 0 ? "var(--A-pos)" : dir < 0 ? "var(--A-neg)" : "var(--A-text-mute)";
}
