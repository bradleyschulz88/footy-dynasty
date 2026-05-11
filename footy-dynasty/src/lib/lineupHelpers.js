import { primaryLineBucket } from "./lineupBalance.js";

/** Match-day squad (18 on field + 5 interchange). */
export const LINEUP_CAP = 23;

/** Slots 0–14: five rows of three on the oval (B → HB → C → HF → F, defence top). */
export const LINEUP_OVAL_SLOT_COUNT = 15;

/** Slots 15–17: followers row directly under the oval. */
export const LINEUP_FOLLOWERS_COUNT = 3;

/** On-field only (oval + followers), before interchange. */
export const LINEUP_FIELD_COUNT = LINEUP_OVAL_SLOT_COUNT + LINEUP_FOLLOWERS_COUNT;

/** Interchange / bench (slots 18–22). */
export const LINEUP_INTERCHANGE_COUNT = 5;

/** How many players are selected in the lineup (non-empty slots). */
export function lineupPlayerCount(lineup) {
  return (lineup || []).filter((id) => id != null && id !== "").length;
}

export function lineupHasPlayer(lineup, playerId) {
  const s = String(playerId);
  return (lineup || []).some((id) => id != null && String(id) === s);
}

/** @returns {boolean} */
export function isLineupSlotId(overId) {
  return /^lineup-slot-\d+$/.test(String(overId || ""));
}

/** @returns {number | null} */
export function lineupSlotIndexFromId(overId) {
  const m = String(overId || "").match(/^lineup-slot-(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** Map career.lineup ids to squad players in order (drops empty slots). */
export function lineupPlayersOrdered(squad, lineupIds) {
  const map = new Map((squad || []).map((p) => [p.id, p]));
  return (lineupIds || [])
    .filter((id) => id != null && id !== "")
    .map((id) => map.get(id))
    .filter(Boolean);
}

/** Remove one id from lineup (splices that index out so fixed map slots stay contiguous). */
export function removeIdFromLineup(lineup, id) {
  const bid = String(id);
  const L = [...(lineup || [])];
  const idx = L.findIndex((pid) => pid != null && String(pid) === bid);
  if (idx !== -1) L.splice(idx, 1);
  let end = L.length;
  while (end > 0 && (L[end - 1] == null || L[end - 1] === "")) end--;
  return L.slice(0, end);
}

/**
 * Dense list insert: remove `id` if present, insert at `index` (clamped to current length), cap length.
 * Use for list-order operations (bucket insert, drop onto a player row).
 */
export function addIdToLineupAt(lineup, id, index, cap = LINEUP_CAP) {
  const bid = String(id);
  const L = [...(lineup || [])].filter((pid) => pid != null && String(pid) !== bid);
  const i = Math.max(0, Math.min(index, L.length));
  L.splice(i, 0, bid);
  return L.slice(0, cap);
}

/**
 * Ground-map slot: fixed indices 0..cap-1; shift players at/ after `slotIndex`; trim trailing empties.
 */
export function insertIdAtLineupSlot(lineup, id, slotIndex, cap = LINEUP_CAP) {
  const bid = String(id);
  const slots = new Array(cap).fill(null);
  const old = lineup || [];
  for (let j = 0; j < Math.min(old.length, cap); j++) {
    const v = old[j];
    slots[j] = v != null && v !== "" ? String(v) : null;
  }
  for (let j = 0; j < cap; j++) {
    if (slots[j] != null && String(slots[j]) === bid) slots[j] = null;
  }
  const target = Math.max(0, Math.min(slotIndex, cap - 1));
  for (let j = cap - 1; j > target; j--) slots[j] = slots[j - 1];
  slots[target] = bid;
  let end = cap;
  while (end > 0 && (slots[end - 1] == null || slots[end - 1] === "")) end--;
  return slots.slice(0, end);
}

/** Field order for inserting an empty positional bucket into the lineup (presentation only). */
const BUCKET_ORDER = { fwd: 0, mid: 1, ruck: 2, back: 3 };

function bucketOfId(squad, id) {
  const p = (squad || []).find((x) => String(x.id) === String(id));
  return primaryLineBucket(p?.position);
}

/**
 * Insert or move a player so they sit after the last teammate in the same line bucket.
 * Does not change match simulation — only lineup order / squad UX.
 * @param {string} bucket — 'fwd' | 'mid' | 'ruck' | 'back'
 */
export function addIdToLineupInBucket(lineup, squad, playerId, bucket, cap = LINEUP_CAP) {
  const bid = String(playerId);
  const bKey = String(bucket);
  const compact = (lineup || []).filter((pid) => pid != null && pid !== "");
  const L = compact.filter((pid) => String(pid) !== bid);
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
  return addIdToLineupAt(compact, bid, insertAt, cap);
}

/** Move element from `from` to `to` index (both in range of current length). */
export function moveLineupIndex(lineup, from, to) {
  const L = [...(lineup || [])].filter((id) => id != null && id !== "");
  if (from < 0 || from >= L.length || to < 0 || from === to) return L;
  const clampedTo = Math.min(to, L.length - 1);
  const [removed] = L.splice(from, 1);
  L.splice(clampedTo, 0, removed);
  return L;
}

export function dedupeLineup(lineup) {
  const seen = new Set();
  const L = (lineup || []).map((id) => {
    if (id == null || id === "") return null;
    if (seen.has(id)) return null;
    seen.add(id);
    return id;
  });
  let end = L.length;
  while (end > 0 && (L[end - 1] == null || L[end - 1] === "")) end--;
  return L.slice(0, end);
}
