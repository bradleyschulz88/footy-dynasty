import { primaryLineBucket } from "./lineupBalance.js";

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

/** Field order for inserting an empty positional bucket into the lineup (presentation only). */
const BUCKET_ORDER = { fwd: 0, mid: 1, ruck: 2, back: 3 };

function bucketOfId(squad, id) {
  const p = (squad || []).find((x) => String(x.id) === String(id));
  return primaryLineBucket(p?.position);
}

/**
 * Insert or move a player so they sit after the last teammate in the same line bucket.
 * Does not change match simulation — only lineup order / XXII UX.
 * @param {string} bucket — 'fwd' | 'mid' | 'ruck' | 'back'
 */
export function addIdToLineupInBucket(lineup, squad, playerId, bucket, cap = LINEUP_CAP) {
  const bid = String(playerId);
  const bKey = String(bucket);
  const L = [...(lineup || [])].filter((pid) => String(pid) !== bid);
  const idxInBucket = [];
  for (let i = 0; i < L.length; i++) {
    if (bucketOfId(squad, L[i]) === bKey) idxInBucket.push(i);
  }
  let insertAt;
  if (idxInBucket.length > 0) {
    insertAt = idxInBucket[idxInBucket.length - 1] + 1;
  } else {
    const target = BUCKET_ORDER[bKey] ?? 1;
    const found = L.findIndex((pid) => BUCKET_ORDER[bucketOfId(squad, pid)] > target);
    insertAt = found === -1 ? L.length : found;
  }
  return addIdToLineupAt(L, bid, insertAt, cap);
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
