// Single source of truth: trade period & national draft lifecycle flags.

/** Post-season trade period (Hub "Advance day" pipeline). */
export function isPostSeasonTradePeriod(career) {
  return career?.postSeasonPhase === "trade_period" && !!career?.inTradePeriod;
}

/** Pool and pick order exist (scouting or live). */
export function hasDraftPool(career) {
  return (career?.draftPool?.length > 0) && (career?.draftOrder?.length > 0);
}

/** Calendar date when national draft picks begin. */
export function nationalDraftDayDate(career) {
  if (career?.draftStartDate) return career.draftStartDate;
  const season = Number(career?.season) || 2026;
  const ev = (career?.eventQueue || []).find(
    (e) => e.type === "key_event" && e.name === "National Draft Day",
  );
  return ev?.date || `${season}-01-10`;
}

/** True when calendar has not yet reached draft day. */
export function isBeforeDraftDay(career) {
  const cur = career?.currentDate;
  if (!cur) return true;
  return cur < nationalDraftDayDate(career);
}

/** Combine scouting window — pool visible, no picks on the clock yet. */
export function isDraftScoutingPhase(career) {
  if (career?.draftPhase === "complete") return false;
  if (!hasDraftPool(career)) return false;
  return career?.draftPhase === "scouting";
}

/** Draft night — picks resolving one at a time. */
export function isDraftLive(career) {
  if (career?.draftPhase !== "live") return false;
  const order = career?.draftOrder || [];
  const pool = career?.draftPool || [];
  return order.length > 0 && pool.length > 0 && order.some((d) => !d.used);
}

/** Club still has at least one unused pick slot in the order. */
export function hasUnusedClubDraftPick(career) {
  const clubId = career?.clubId;
  if (!clubId) return false;
  return (career?.draftOrder || []).some((d) => d.clubId === clubId && !d.used);
}

/** Index of the next pick in draft order (any club). */
export function nextDraftPickIndex(career) {
  return (career?.draftOrder || []).findIndex((d) => !d.used);
}

/** True when the next pick on the clock belongs to the player club. */
export function isPlayerDraftTurn(career) {
  if (!isDraftLive(career)) return false;
  const idx = nextDraftPickIndex(career);
  if (idx < 0) return false;
  return career.draftOrder[idx]?.clubId === career.clubId;
}

/** Hard gate: player must make a draft selection before time advances. */
export function draftPickBlocksAdvance(career) {
  return isPlayerDraftTurn(career);
}

/** Next calendar key_event if any. */
export function nextCalendarEvent(career) {
  return (career?.eventQueue || []).find((e) => !e.completed) ?? null;
}

export function isKeyEventNamed(career, name) {
  const ev = nextCalendarEvent(career);
  return ev?.type === "key_event" && ev?.name === name;
}
