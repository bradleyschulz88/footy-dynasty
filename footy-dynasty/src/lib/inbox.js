/**
 * Manager inbox (`career.inbox`): queued notices + optional calendar gate.
 * Mirrors some Board / trade-period signals so the Hub banner stays unified.
 */

/** Pending trade-period offers that still need accept / decline / counter. */
export function hasBlockingTradePeriodOffers(career) {
  return (career?.pendingTradeOffers || []).some((t) => t.status === "pending" && t.tradePeriod);
}

/** Board tab inbox — every row needs a reply before it is cleared. */
export function hasBlockingBoardInbox(career) {
  return (career?.board?.inbox || []).length > 0;
}

/**
 * Calendar advance gate (in addition to tutorial + full-screen board flows).
 * Blocks while trade-period offers are pending, Club → Board inbox has mail,
 * or a generic blocking manager-inbox item exists (board/trade mirrors excluded —
 * those are covered by the first two checks).
 */
export function advanceBlockedByCareerNeeds(career) {
  if (hasBlockingTradePeriodOffers(career)) return true;
  if (hasBlockingBoardInbox(career)) return true;
  return (career?.inbox || []).some(
    (m) =>
      m.blocking &&
      !m.resolved &&
      m.kind !== "board" &&
      m.kind !== "trade_period",
  );
}

/** Stable id for the trade-period mirror row in career.inbox */
export const MANAGER_INBOX_TRADE_PERIOD_ID = "mgr_trade_period";

/** Prefix for board-linked mirror ids */
export function managerInboxBoardMirrorId(boardMessageId) {
  return `mgr_board_${boardMessageId}`;
}

/** Remove manager-inbox board mirrors whose message no longer exists on the board. */
export function pruneStaleBoardMirrors(career) {
  if (!career?.inbox?.length) return;
  const boardIds = new Set((career.board?.inbox || []).map((m) => m.id));
  career.inbox = career.inbox.filter(
    (m) => m.kind !== "board" || !m.boardMessageId || boardIds.has(m.boardMessageId),
  );
}

/** Push a Hub-visible mirror when a board inbox message is queued. */
export function pushManagerInboxBoardMirror(career, boardMsg) {
  if (!career || !boardMsg?.id) return;
  if (!Array.isArray(career.inbox)) career.inbox = [];
  const id = managerInboxBoardMirrorId(boardMsg.id);
  if (career.inbox.some((m) => m.id === id)) return;
  career.inbox.unshift({
    id,
    kind: "board",
    blocking: true,
    resolved: false,
    boardMessageId: boardMsg.id,
    title: "Board: response required",
    detail: `${boardMsg.fromRole} — ${boardMsg.title}. Open Club → Board to reply.`,
  });
}

/** Remove mirror rows tied to a board message id (after reply). */
export function removeManagerInboxBoardMirrors(career, boardMessageId) {
  if (!career || boardMessageId == null) return;
  const pref = managerInboxBoardMirrorId(boardMessageId);
  career.inbox = (career.inbox || []).filter((m) => m.id !== pref && m.boardMessageId !== boardMessageId);
}

/**
 * Keep trade-period mirror row in sync with pending postseason offers.
 */
export function syncTradePeriodManagerInboxRow(career) {
  if (!career) return;
  const pending = hasBlockingTradePeriodOffers(career);
  let inbox = [...(career.inbox || [])];
  const idx = inbox.findIndex((m) => m.id === MANAGER_INBOX_TRADE_PERIOD_ID);
  if (pending) {
    const row = {
      id: MANAGER_INBOX_TRADE_PERIOD_ID,
      kind: "trade_period",
      blocking: true,
      resolved: false,
      title: "Trade period",
      detail: "Incoming offers need a decision — Recruit → Trades.",
    };
    if (idx >= 0) inbox[idx] = { ...inbox[idx], ...row, resolved: false };
    else inbox.unshift(row);
  } else if (idx >= 0) {
    inbox.splice(idx, 1);
  }
  career.inbox = inbox;
}

/**
 * Merge a shallow patch into career and refresh derived trade-period inbox mirrors when needed.
 */
export function mergeCareerPatchWithInboxSync(prevCareer, patch) {
  const next = { ...prevCareer, ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, "pendingTradeOffers")) {
    syncTradePeriodManagerInboxRow(next);
  }
  return next;
}

/** Mark one manager inbox row resolved (idempotent). */
export function resolveInboxItem(inbox, itemId) {
  const arr = Array.isArray(inbox) ? inbox : [];
  return arr.map((m) => (String(m.id) === String(itemId) ? { ...m, resolved: true } : m));
}

/**
 * True when a blocking row can be cleared without repeating the underlying action
 * (e.g. mirror left over after you already replied on another screen).
 */
export function canAcknowledgeBlockingInboxItem(career, item) {
  if (!item?.blocking || item.resolved) return false;
  if (item.kind === "board") {
    return !(career?.board?.inbox || []).some((b) => b.id === item.boardMessageId);
  }
  if (item.kind === "trade_period") {
    return !hasBlockingTradePeriodOffers(career);
  }
  return true;
}
