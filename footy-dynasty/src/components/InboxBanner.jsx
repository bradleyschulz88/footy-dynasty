import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { css } from "./primitives.jsx";
import {
  hasBlockingTradePeriodOffers,
  hasBlockingBoardInbox,
  resolveInboxItem,
  canAcknowledgeBlockingInboxItem,
} from "../lib/inbox.js";

/** Hide system mirrors here — dedicated strips cover board + trade period. */
function visibleManagerInboxRows(career) {
  const inbox = career.inbox || [];
  return inbox.filter((m) => !m.resolved && m.kind !== "board" && m.kind !== "trade_period");
}

export function InboxBanner({ career, updateCareer, onGoRecruit, onGoClubBoard }) {
  const inbox = career.inbox || [];
  const tradeBlock = hasBlockingTradePeriodOffers(career);
  const boardBlock = hasBlockingBoardInbox(career);
  const open = visibleManagerInboxRows(career);

  if (!tradeBlock && !boardBlock && open.length === 0) return null;

  return (
    <div className="px-3 md:px-6 pt-3 max-w-[1400px] mx-auto w-full space-y-2">
      {tradeBlock && (
        <div
          className={`${css.panel} px-4 py-3 flex flex-wrap items-center gap-3 border border-[rgba(232,74,111,0.35)] bg-[rgba(232,74,111,0.06)]`}
          role="status"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-[#E84A6F]" aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-atext">Trade period</div>
            <div className="text-sm text-atext-dim mt-0.5">
              You have pending trade offers. Visit Recruit → Trades to accept or decline before advancing time.
            </div>
          </div>
          {onGoRecruit && (
            <button type="button" className={`${css.btnPrimary} text-xs shrink-0`} onClick={onGoRecruit}>
              Open trades
            </button>
          )}
        </div>
      )}
      {boardBlock && (
        <div
          className={`${css.panel} px-4 py-3 flex flex-wrap items-center gap-3 border border-[rgba(232,74,111,0.35)] bg-[rgba(232,74,111,0.06)]`}
          role="status"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-[#E84A6F]" aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wide text-atext">Board inbox</div>
            <div className="text-sm text-atext-dim mt-0.5">
              Directors need an on-record reply. Open Club → Board — calendar advance stays locked until every message is answered.
            </div>
          </div>
          {onGoClubBoard && (
            <button type="button" className={`${css.btnPrimary} text-xs shrink-0`} onClick={onGoClubBoard}>
              Open board
            </button>
          )}
        </div>
      )}
      {open.map((m) => {
        const canAck = m.blocking && canAcknowledgeBlockingInboxItem(career, m);
        return (
          <div
            key={m.id}
            className={`${css.panel} px-4 py-3 flex flex-wrap items-start gap-3 ${
              m.blocking ? "border border-[rgba(232,74,111,0.35)] bg-[rgba(232,74,111,0.05)]" : ""
            }`}
          >
            <AlertCircle className={`w-5 h-5 shrink-0 ${m.blocking ? "text-[#E84A6F]" : "text-atext-mute"}`} aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-atext">{m.title || "Notice"}</div>
              {m.detail && <div className="text-sm text-atext-dim mt-0.5 leading-snug">{m.detail}</div>}
              {m.blocking && !canAck && (
                <div className="text-[10px] text-atext-mute mt-2 leading-snug">
                  Complete the required action first; if this card is out of date after you acted elsewhere, use Acknowledge.
                </div>
              )}
            </div>
            {m.blocking && !canAck && (m.kind === "draft_pick" || m.kind === "trade_open" || m.kind === "trade_window") && onGoRecruit && (
              <button type="button" className={`${css.btnPrimary} text-xs shrink-0`} onClick={onGoRecruit}>
                Open Recruit
              </button>
            )}
            {m.blocking && canAck && (
              <button
                type="button"
                className={`${css.btnGhost} text-xs shrink-0 flex items-center gap-1`}
                onClick={() => updateCareer({ inbox: resolveInboxItem(inbox, m.id) })}
              >
                <CheckCircle2 className="w-4 h-4" /> Acknowledge
              </button>
            )}
            {!m.blocking && (
              <button
                type="button"
                className={`${css.btnGhost} text-xs shrink-0 flex items-center gap-1`}
                onClick={() => updateCareer({ inbox: resolveInboxItem(inbox, m.id) })}
              >
                <CheckCircle2 className="w-4 h-4" /> Dismiss
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
