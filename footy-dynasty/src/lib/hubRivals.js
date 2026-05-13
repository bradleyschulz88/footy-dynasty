import { findClub } from "../data/pyramid.js";

/** Rows immediately above/below the player club on the current ladder ordering. */
export function ladderNeighbourRows(sortedLadderRows, clubId) {
  if (!Array.isArray(sortedLadderRows) || !clubId) return [];
  const i = sortedLadderRows.findIndex((r) => r.id === clubId);
  if (i < 0 || sortedLadderRows.length < 2) return [];
  const rows = [];
  if (i > 0) rows.push(sortedLadderRows[i - 1]);
  if (i < sortedLadderRows.length - 1) rows.push(sortedLadderRows[i + 1]);
  return rows;
}

/** Resolved pyramid clubs (+ ladder row pts) beside the player's position — for flavour copy only. */
export function ladderNeighbourClubs(sortedLadderRows, clubId) {
  return ladderNeighbourRows(sortedLadderRows, clubId)
    .map((row) => {
      const c = findClub(row.id);
      if (!c) return null;
      return { club: c, pts: row.pts ?? 0, position: row };
    })
    .filter(Boolean);
}
