/**
 * Manager inbox (`career.inbox`): queued notices + optional calendar gate.
 * Mirrors some Board / trade-period signals so the Hub banner stays unified.
 */

import { draftPickBlocksAdvance, isPostSeasonTradePeriod } from "./recruitPhase.js";

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
  if (draftPickBlocksAdvance(career)) return true;
  if (hasUnackedTradePeriodOpen(career)) return true;
  if (hasUnackedTradeWindowOpen(career)) return true;
  return (career?.inbox || []).some(
    (m) =>
      m.blocking &&
      !m.resolved &&
      m.kind !== "board" &&
      m.kind !== "trade_period" &&
      m.kind !== "trade_open" &&
      m.kind !== "trade_window" &&
      m.kind !== "draft_pick",
  );
}

/** Post-season trade period — acknowledge Recruit before advancing past day 1. */
export function hasUnackedTradePeriodOpen(career) {
  if (!isPostSeasonTradePeriod(career)) return false;
  const day = career.tradePeriodDay ?? 0;
  return day <= 1 && !career.tradePeriodBriefingAck;
}

/** Pre-season calendar Transfer Window Opens — visit Recruit once. */
export function hasUnackedTradeWindowOpen(career) {
  return !!career.tradeWindowBriefingPending && !career.tradeWindowBriefingAck;
}

/** Stable id for the trade-period mirror row in career.inbox */
export const MANAGER_INBOX_TRADE_PERIOD_ID = "mgr_trade_period";
export const MANAGER_INBOX_TRADE_OPEN_ID = "mgr_trade_open";
export const MANAGER_INBOX_TRADE_WINDOW_ID = "mgr_trade_window";
export const MANAGER_INBOX_DRAFT_PICK_ID = "mgr_draft_pick";

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

/** Post-season: Trade Period just opened — block until Recruit → Trades briefing ack. */
export function syncTradePeriodOpenInboxRow(career) {
  if (!career) return;
  const show = isPostSeasonTradePeriod(career) && (career.tradePeriodDay ?? 0) <= 1 && !career.tradePeriodBriefingAck;
  let inbox = [...(career.inbox || [])];
  const idx = inbox.findIndex((m) => m.id === MANAGER_INBOX_TRADE_OPEN_ID);
  if (show) {
    const row = {
      id: MANAGER_INBOX_TRADE_OPEN_ID,
      kind: "trade_open",
      blocking: true,
      resolved: false,
      title: "Trade period open",
      detail: "Post-season list shaping is live — open Recruit → Trades before advancing (14-day window).",
    };
    if (idx >= 0) inbox[idx] = { ...inbox[idx], ...row, resolved: false };
    else inbox.unshift(row);
  } else if (idx >= 0) {
    inbox.splice(idx, 1);
  }
  career.inbox = inbox;
}

/** Pre-season calendar transfer window milestone. */
export function syncTradeWindowOpenInboxRow(career) {
  if (!career) return;
  const show = !!career.tradeWindowBriefingPending && !career.tradeWindowBriefingAck;
  let inbox = [...(career.inbox || [])];
  const idx = inbox.findIndex((m) => m.id === MANAGER_INBOX_TRADE_WINDOW_ID);
  if (show) {
    const row = {
      id: MANAGER_INBOX_TRADE_WINDOW_ID,
      kind: "trade_window",
      blocking: true,
      resolved: false,
      title: "Transfer window open",
      detail: "Pre-season trades and free agency — Recruit → Trades before you continue the calendar.",
    };
    if (idx >= 0) inbox[idx] = { ...inbox[idx], ...row, resolved: false };
    else inbox.unshift(row);
  } else if (idx >= 0) {
    inbox.splice(idx, 1);
  }
  career.inbox = inbox;
}

/** National draft — block advance while your pick is on the clock. */
export function syncDraftPickInboxRow(career) {
  if (!career) return;
  const due = draftPickBlocksAdvance(career);
  let inbox = [...(career.inbox || [])];
  const idx = inbox.findIndex((m) => m.id === MANAGER_INBOX_DRAFT_PICK_ID);
  if (due) {
    const row = {
      id: MANAGER_INBOX_DRAFT_PICK_ID,
      kind: "draft_pick",
      blocking: true,
      resolved: false,
      title: "National draft — your pick",
      detail: "You are on the clock. Open Recruit → Draft and select a prospect.",
    };
    if (idx >= 0) inbox[idx] = { ...inbox[idx], ...row, resolved: false };
    else inbox.unshift(row);
  } else if (idx >= 0) {
    inbox.splice(idx, 1);
  }
  career.inbox = inbox;
}

/** Refresh all recruit-phase inbox mirrors (call after draft/trade state changes). */
export function syncRecruitPhaseInboxRows(career) {
  if (!career) return;
  syncTradePeriodManagerInboxRow(career);
  syncTradePeriodOpenInboxRow(career);
  syncTradeWindowOpenInboxRow(career);
  syncDraftPickInboxRow(career);
}

/**
 * Merge a shallow patch into career and refresh derived trade-period inbox mirrors when needed.
 */
export function mergeCareerPatchWithInboxSync(prevCareer, patch) {
  const next = { ...prevCareer, ...patch };
  if (
    Object.prototype.hasOwnProperty.call(patch, "pendingTradeOffers") ||
    Object.prototype.hasOwnProperty.call(patch, "draftOrder") ||
    Object.prototype.hasOwnProperty.call(patch, "draftPool") ||
    Object.prototype.hasOwnProperty.call(patch, "tradePeriodBriefingAck") ||
    Object.prototype.hasOwnProperty.call(patch, "tradeWindowBriefingAck") ||
    Object.prototype.hasOwnProperty.call(patch, "tradeWindowBriefingPending") ||
    Object.prototype.hasOwnProperty.call(patch, "inTradePeriod") ||
    Object.prototype.hasOwnProperty.call(patch, "tradePeriodDay")
  ) {
    syncRecruitPhaseInboxRows(next);
  }
  return next;
}

/**
 * Apply an object patch or updater `(career) => patch` (match-day exit uses the latter).
 */
export function applyCareerPatch(prevCareer, patchOrFn) {
  const patch = typeof patchOrFn === "function" ? patchOrFn(prevCareer) : patchOrFn;
  if (!patch || typeof patch !== "object") return prevCareer;
  return mergeCareerPatchWithInboxSync(prevCareer, patch);
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
  if (item.kind === "trade_open") {
    return !hasUnackedTradePeriodOpen(career);
  }
  if (item.kind === "trade_window") {
    return !hasUnackedTradeWindowOpen(career);
  }
  if (item.kind === "draft_pick") {
    return !draftPickBlocksAdvance(career);
  }
  return true;
}
