/** Max players in match-day XXII. */
export const LINEUP_CAP = 22;

/** Map career.lineup ids to squad players in that order (drops missing ids). */
export function lineupPlayersOrdered(squad, lineupIds) {
  const map = new Map((squad || []).map((p) => [p.id, p]));
  return (lineupIds || []).map((id) => map.get(id)).filter(Boolean);
}

/** Remove one id from lineup. */
export function removeIdFromLineup(lineup, id) {
  return (lineup || []).filter((pid) => pid !== id);
}

/**
 * Insert id at index (0-based), removing any prior occurrence. Result capped at `cap`.
 * @returns {string[]}
 */
export function addIdToLineupAt(lineup, id, index, cap = LINEUP_CAP) {
  const L = [...(lineup || [])].filter((pid) => pid !== id);
  const i = Math.max(0, Math.min(index, L.length));
  L.splice(i, 0, id);
  return L.slice(0, cap);
}

/** Move element from `from` to `to` index (both in range of current length). */
export function moveLineupIndex(lineup, from, to) {
  const L = [...(lineup || [])];
  if (from < 0 || from >= L.length || to < 0 || from === to) return L;
  const clampedTo = Math.min(to, L.length - 1);
  const [removed] = L.splice(from, 1);
  L.splice(clampedTo, 0, removed);
  return L;
}

export function dedupeLineup(lineup) {
  const seen = new Set();
  return (lineup || []).filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
