// Single source of truth: trade period & national draft lifecycle flags.

/** Post-season trade period (Hub "Advance day" pipeline). */
export function isPostSeasonTradePeriod(career) {
  return career?.postSeasonPhase === "trade_period" && !!career?.inTradePeriod;
}

/** Draft pool + pick order active (after season rollover or draft day). */
export function isDraftLive(career) {
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
