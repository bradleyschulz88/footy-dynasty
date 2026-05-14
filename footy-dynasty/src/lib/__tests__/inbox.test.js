import { describe, it, expect } from "vitest";
import {
  advanceBlockedByCareerNeeds,
  hasBlockingBoardInbox,
  mergeCareerPatchWithInboxSync,
  applyCareerPatch,
  syncRecruitPhaseInboxRows,
  MANAGER_INBOX_TRADE_PERIOD_ID,
  MANAGER_INBOX_DRAFT_PICK_ID,
  pushManagerInboxBoardMirror,
  pruneStaleBoardMirrors,
  removeManagerInboxBoardMirrors,
  canAcknowledgeBlockingInboxItem,
} from "../inbox.js";

describe("advanceBlockedByCareerNeeds", () => {
  it("blocks when board inbox has pending mail", () => {
    const career = {
      board: {
        inbox: [{ id: "x", title: "Hi", body: "?", options: [] }],
      },
      inbox: [],
      pendingTradeOffers: [],
    };
    expect(hasBlockingBoardInbox(career)).toBe(true);
    expect(advanceBlockedByCareerNeeds(career)).toBe(true);
  });

  it("does not double-count board/trade mirror rows", () => {
    const career = {
      board: { inbox: [] },
      pendingTradeOffers: [],
      inbox: [
        { id: "mgr_board_1", kind: "board", blocking: true, resolved: false, boardMessageId: "1" },
        { id: MANAGER_INBOX_TRADE_PERIOD_ID, kind: "trade_period", blocking: true, resolved: false },
      ],
    };
    expect(advanceBlockedByCareerNeeds(career)).toBe(false);
  });
});

describe("syncRecruitPhaseInboxRows / mergeCareerPatchWithInboxSync", () => {
  it("inserts mirror row when pending trade-period offers exist", () => {
    const c = { inbox: [], pendingTradeOffers: [{ status: "pending", tradePeriod: true }] };
    syncRecruitPhaseInboxRows(c);
    expect(c.inbox.some((m) => m.id === MANAGER_INBOX_TRADE_PERIOD_ID)).toBe(true);
  });

  it("blocks advance when player draft pick is due", () => {
    const career = {
      clubId: 'c1',
      draftPhase: 'live',
      board: { inbox: [] },
      pendingTradeOffers: [],
      draftOrder: [{ pick: 1, clubId: 'c1', used: false }],
      draftPool: [{ id: 'p1' }],
      inbox: [],
    };
    syncRecruitPhaseInboxRows(career);
    expect(career.inbox.some((m) => m.id === MANAGER_INBOX_DRAFT_PICK_ID)).toBe(true);
    expect(advanceBlockedByCareerNeeds(career)).toBe(true);
  });

  it("mergeCareerPatchWithInboxSync refreshes mirror when pendingTradeOffers changes", () => {
    const prev = { inbox: [], pendingTradeOffers: [] };
    const next = mergeCareerPatchWithInboxSync(prev, {
      pendingTradeOffers: [{ status: "pending", tradePeriod: true }],
    });
    expect(next.inbox.some((m) => m.id === MANAGER_INBOX_TRADE_PERIOD_ID)).toBe(true);
  });
});

describe("board mirror helpers", () => {
  it("pruneStaleBoardMirrors drops orphans after board reply", () => {
    const career = {
      board: { inbox: [] },
      inbox: [
        {
          id: "mgr_board_old",
          kind: "board",
          blocking: true,
          resolved: false,
          boardMessageId: "gone",
        },
      ],
    };
    pruneStaleBoardMirrors(career);
    expect(career.inbox.length).toBe(0);
  });

  it("removeManagerInboxBoardMirrors clears by message id", () => {
    const career = {
      inbox: [
        {
          id: "mgr_board_x",
          kind: "board",
          boardMessageId: "x",
          blocking: true,
          resolved: false,
        },
      ],
    };
    removeManagerInboxBoardMirrors(career, "x");
    expect(career.inbox.length).toBe(0);
  });

  it("pushManagerInboxBoardMirror is idempotent", () => {
    const msg = { id: "bm1", fromRole: "Chairman", title: "Hey", body: "?", options: [] };
    const career = { inbox: [] };
    pushManagerInboxBoardMirror(career, msg);
    pushManagerInboxBoardMirror(career, msg);
    expect(career.inbox.filter((m) => m.boardMessageId === "bm1").length).toBe(1);
  });
});

describe("canAcknowledgeBlockingInboxItem", () => {
  it("allows stale board mirror acknowledge when board message is gone", () => {
    const career = { board: { inbox: [] }, pendingTradeOffers: [] };
    const item = { blocking: true, resolved: false, kind: "board", boardMessageId: "old" };
    expect(canAcknowledgeBlockingInboxItem(career, item)).toBe(true);
  });

  it("allows generic blocking acknowledge", () => {
    const career = {};
    expect(canAcknowledgeBlockingInboxItem(career, { blocking: true, resolved: false })).toBe(true);
  });
});

describe("applyCareerPatch", () => {
  it("applies updater function patches (match-day exit)", () => {
    const prev = {
      clubId: "c1",
      inMatchDay: true,
      currentMatchResult: { homeTotal: 80 },
      lastMatchSummary: { label: "R1" },
    };
    const next = applyCareerPatch(prev, (c) => ({
      inMatchDay: false,
      currentMatchResult: null,
      lastMatchSummary: null,
      pendingPlayerMatchResult: c.pendingPlayerMatchResult,
    }));
    expect(next.inMatchDay).toBe(false);
    expect(next.currentMatchResult).toBe(null);
    expect(next.lastMatchSummary).toBe(null);
  });

  it("still applies plain object patches", () => {
    const next = applyCareerPatch({ week: 1 }, { week: 2 });
    expect(next.week).toBe(2);
  });
});
