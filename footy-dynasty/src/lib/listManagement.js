// ---------------------------------------------------------------------------
// End-of-season list management — senior-list size caps + delisting. Pure and
// deterministic: the trim is a stable function of (squad, max).
// ---------------------------------------------------------------------------
import { LIST_LIMITS } from './finance/constants.js';

/** Maximum senior list size for a tier (falls back to the loosest cap). */
export function listMax(tier) {
  return LIST_LIMITS[tier]?.max ?? 40;
}

/** Current list position vs the tier cap. */
export function listStatus(size, tier) {
  const max = listMax(tier);
  const s = Math.max(0, Math.round(size) || 0);
  return { size: s, max, over: s > max, room: Math.max(0, max - s) };
}

/**
 * Trim a squad to the list max by delisting the lowest-rated players.
 * Stable: sorts by overall desc then id, keeps the top `max`, delists the rest.
 * No-op when at/under the cap. Pure — does not mutate the input.
 * @returns {{kept: object[], delisted: object[]}}
 */
export function trimToListMax(squad, max) {
  const list = [...(squad || [])];
  if (list.length <= max) return { kept: list, delisted: [] };
  const ranked = list
    .map((p, i) => ({ p, i }))
    .sort((a, b) =>
      ((b.p.overall ?? 0) - (a.p.overall ?? 0)) ||
      String(a.p.id).localeCompare(String(b.p.id)));
  return {
    kept: ranked.slice(0, max).map((x) => x.p),
    delisted: ranked.slice(max).map((x) => x.p),
  };
}
