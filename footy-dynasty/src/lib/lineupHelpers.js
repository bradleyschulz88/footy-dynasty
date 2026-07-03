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

/** Available for selection this week (not injured or suspended). */
export function isPlayerAvailable(player) {
  return !!player && (player.injured ?? 0) === 0 && (player.suspended ?? 0) === 0;
}

/**
 * Null out lineup ids that no longer map to a squad player (retired, released,
 * traded) or whose player can't take the field (injured/suspended). Slots are
 * cleared in place so the rest of the selected side keeps its positions.
 */
export function sanitizeLineup(lineup, squad, { dropUnavailable = true } = {}) {
  const byId = new Map((squad || []).map((p) => [String(p.id), p]));
  const L = (lineup || []).map((id) => {
    if (id == null || id === "") return null;
    const p = byId.get(String(id));
    if (!p) return null;
    if (dropUnavailable && !isPlayerAvailable(p)) return null;
    return id;
  });
  let end = L.length;
  while (end > 0 && (L[end - 1] == null || L[end - 1] === "")) end--;
  return L.slice(0, end);
}

/** Remove one id from lineup, keeping every other player in their slot (null-in-place, trim trailing). */
export function removeIdFromLineup(lineup, id) {
  const bid = String(id);
  const L = (lineup || []).map((pid) => (pid != null && String(pid) === bid ? null : pid));
  return fixedSlotsToLineup(L);
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

/** Expand lineup to fixed-length slot array (null = empty). */
export function lineupToFixedSlots(lineup, cap = LINEUP_CAP) {
  const slots = new Array(cap).fill(null);
  const old = lineup || [];
  for (let j = 0; j < Math.min(old.length, cap); j++) {
    const v = old[j];
    slots[j] = v != null && v !== "" ? String(v) : null;
  }
  return slots;
}

/** Trim trailing empty slots to a dense lineup array. */
export function fixedSlotsToLineup(slots) {
  let end = slots.length;
  while (end > 0 && (slots[end - 1] == null || slots[end - 1] === "")) end--;
  return slots.slice(0, end).map((x) => x);
}

/** Slot index for this player in fixed grid order, or -1 if not in lineup. */
export function lineupPlayerSlotIndex(lineup, playerId, cap = LINEUP_CAP) {
  const slots = lineupToFixedSlots(lineup, cap);
  const bid = String(playerId);
  for (let j = 0; j < cap; j++) {
    if (slots[j] != null && String(slots[j]) === bid) return j;
  }
  return -1;
}

/**
 * Put player at slot without shifting other slots. Previous occupant is dropped from the lineup (→ bench).
 * Removes duplicate instances of `playerId` elsewhere first.
 */
export function placeOrSwapLineupSlot(lineup, playerId, slotIndex, cap = LINEUP_CAP) {
  const slots = lineupToFixedSlots(lineup, cap);
  const bid = String(playerId);
  const target = Math.max(0, Math.min(slotIndex, cap - 1));
  for (let j = 0; j < cap; j++) {
    if (slots[j] != null && String(slots[j]) === bid) slots[j] = null;
  }
  slots[target] = bid;
  return dedupeLineup(fixedSlotsToLineup(slots));
}

/** Swap whoever is at two slot indices (players only move between those positions). */
export function swapLineupSlots(lineup, idxA, idxB, cap = LINEUP_CAP) {
  if (idxA === idxB) return dedupeLineup(lineup);
  const slots = lineupToFixedSlots(lineup, cap);
  const a = Math.max(0, Math.min(idxA, cap - 1));
  const b = Math.max(0, Math.min(idxB, cap - 1));
  const tmp = slots[a];
  slots[a] = slots[b];
  slots[b] = tmp;
  return dedupeLineup(fixedSlotsToLineup(slots));
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

/**
 * AFL role code for each of the 18 on-ground slots (defence-top, matching the
 * oval rows B→HB→C→HF→F, then followers). Interchange slots (18–22) are 'INT'.
 */
export const LINEUP_SLOT_ROLES = [
  "BP", "FB", "BP",     // 0–2  back line
  "HBF", "CHB", "HBF",  // 3–5  half-back
  "WG", "C", "WG",      // 6–8  centre
  "HFF", "CHF", "HFF",  // 9–11 half-forward
  "FP", "FF", "FP",     // 12–14 forward line
  "RU", "RO", "RR",     // 15–17 followers: ruck, rover, ruck-rover
];

/** Ground zone of each lineup slot (matches the oval rows; followers = RUCK, interchange = IC). */
export const SLOT_ZONES = [
  "B", "B", "B",
  "HB", "HB", "HB",
  "C", "C", "C",
  "HF", "HF", "HF",
  "F", "F", "F",
  "RUCK", "RUCK", "RUCK",
  "IC", "IC", "IC", "IC", "IC",
];

/**
 * Positions considered at home in each ground zone — the single source of truth
 * for out-of-position checks on the oval AND the Positions/Depth views.
 */
export const ZONE_POSITIONS = {
  B:    new Set(["KB", "UT"]),
  HB:   new Set(["HB", "KB", "WG", "UT"]),
  C:    new Set(["C", "R", "WG", "UT"]),
  HF:   new Set(["HF", "KF", "WG", "UT"]),
  F:    new Set(["KF", "HF", "UT"]),
  RUCK: new Set(["RU", "R", "C", "KB", "UT"]), // followers row: ruck (or pinch-hitting KB) plus rover / ruck-rover types
  IC:   null,
};

export function positionFitsZone(position, zone) {
  if (!zone || zone === "IC") return true;
  const allowed = ZONE_POSITIONS[zone];
  if (!allowed) return true;
  return allowed.has(position);
}

/** AFL role label for a lineup slot index ('INT' for interchange). */
export function slotRoleCode(i) {
  return i < LINEUP_FIELD_COUNT ? LINEUP_SLOT_ROLES[i] : "INT";
}

/**
 * Whether a player suits a given slot by primary or secondary position.
 * Interchange slots accept anyone.
 */
export function playerFitsSlot(player, i) {
  if (!player) return false;
  const zone = SLOT_ZONES[i] ?? "IC";
  return positionFitsZone(player.position, zone)
    || (player.secondaryPosition != null && positionFitsZone(player.secondaryPosition, zone));
}

/**
 * Role of a player within the match-day side, from their lineup slot:
 * 'field' (slots 0–17, on-ground), 'bench' (18–22, interchange),
 * 'sub' (the designated medical sub), or 'out' (not selected).
 */
export function lineupRole(lineup, subId, id, fieldCount = LINEUP_FIELD_COUNT) {
  const idx = (lineup || []).findIndex((pid) => pid != null && String(pid) === String(id));
  if (idx < 0) return "out";
  if (idx < fieldCount) return "field"; // a sub designation is only meaningful on the interchange
  return subId != null && String(subId) === String(id) ? "sub" : "bench";
}

/** A designated medical sub is only valid while they hold an interchange slot; otherwise null. */
export function sanitizeSubPlayerId(lineup, subId) {
  return subId != null && lineupRole(lineup, subId, subId) === "sub" ? subId : null;
}

/**
 * Add a player onto the interchange (first free bench slot 18–22). Returns a new
 * lineup, or the original unchanged when the interchange is full — field slots
 * are assigned deliberately (Pitch drag / Positions), never as a silent fallback.
 * Pure — does not mutate the input.
 */
export function addToBench(lineup, id, cap = LINEUP_CAP, fieldCount = LINEUP_FIELD_COUNT) {
  const L = [...(lineup || [])];
  while (L.length < cap) L.push(null);
  const slot = L.findIndex((v, i) => i >= fieldCount && (v == null || v === ""));
  if (slot < 0) return lineup || []; // interchange full
  L[slot] = id;
  return fixedSlotsToLineup(L);
}

/** True when the interchange (slots 18–22) has a free spot for addToBench. */
export function hasFreeBenchSlot(lineup, cap = LINEUP_CAP, fieldCount = LINEUP_FIELD_COUNT) {
  const slots = lineupToFixedSlots(lineup, cap);
  return slots.some((v, i) => i >= fieldCount && (v == null || v === ""));
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
