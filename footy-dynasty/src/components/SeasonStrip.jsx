import React from "react";
import { Pill } from "./primitives.jsx";
import { getAdvanceContext } from "../lib/advanceContext.js";
import { effectiveWageCap, currentPlayerWageBill, capHeadroom } from "../lib/finance/engine.js";
import { fmtK } from "../lib/format.js";

export default function SeasonStrip({ career, league, club }) {
  const ctx = getAdvanceContext(career, league);
  const cap = effectiveWageCap(career);
  const bill = currentPlayerWageBill(career);
  const headroom = capHeadroom(career);

  let phasePill = "Season";
  let phaseColor = "var(--A-accent)";
  if (career.postSeasonPhase === "trade_period" && career.inTradePeriod) {
    phasePill = "Trade period";
    phaseColor = "#4AE89A";
  } else if (career.postSeasonPhase === "draft_waiting") {
    phasePill = "List reset";
    phaseColor = "#FDBA74";
  } else if (career.inFinals) {
    phasePill = "Finals";
    phaseColor = "#E84A6F";
  } else if (career.phase === "preseason") {
    phasePill = "Pre-season";
    phaseColor = "#4ADBE8";
  } else {
    phasePill = `Season · Rd ${career.week ?? "—"}`;
  }

  return (
    <div className="border-t border-aline/60 bg-apanel/50 px-3 md:px-6 py-2">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] md:text-sm">
        <span className="font-mono uppercase tracking-widest text-atext-mute shrink-0">{league?.name}</span>
        <span className="text-atext-mute hidden sm:inline">·</span>
        <span className="font-display text-atext shrink-0">
          {club?.short} · S{career.season}
        </span>
        <Pill color={phaseColor}>{phasePill}</Pill>
        <span className="text-atext-dim hidden md:inline min-w-0">{ctx.summary}</span>
        {cap > 0 && (
          <span className="text-atext-mute ml-auto font-mono text-[11px] whitespace-nowrap">
            Cap {fmtK(bill)}/{fmtK(cap)} · room {fmtK(headroom)}
          </span>
        )}
      </div>
    </div>
  );
}
