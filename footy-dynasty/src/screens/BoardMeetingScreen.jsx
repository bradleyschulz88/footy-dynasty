// ---------------------------------------------------------------------------
// Mandatory board meeting (mid-season / finance) — blocks hub until resolved.
// ---------------------------------------------------------------------------
import React from "react";
import { Landmark } from "lucide-react";
import { css } from "../components/primitives.jsx";

export default function BoardMeetingScreen({ career, blocking, onChoose }) {
  const title  = blocking?.title || "Board meeting";
  const intro  = blocking?.intro || "";
  const choices = blocking?.choices || [];
  const tier = blocking?.leagueTier ?? 2;
  const isCommittee = tier === 3;
  const headerLabel = isCommittee ? "Scheduled committee session" : "Scheduled board session";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #07101F 0%, #1E293B 100%)" }}>
      <div className="px-6 py-4 flex items-center justify-center gap-2">
        <Landmark className="w-4 h-4 text-aaccent" />
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-atext-mute">{headerLabel}</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full anim-in">
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center mb-2">
            Round {career.week} · {career.season}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-atext mb-6 text-center leading-none">{title.toUpperCase()}</h1>
          {isCommittee && (
            <p className="text-center text-[11px] text-atext-mute font-mono mb-4 px-2">
              Community club: volunteer committee roundtable — same decisions, different tone.
            </p>
          )}
          <div className="rounded-2xl p-6 mb-6" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}>
            <p className="text-atext leading-relaxed text-sm">{intro}</p>
          </div>
          <div className="text-[11px] text-atext-mute uppercase tracking-widest mb-3 font-mono">Your stance</div>
          <div className="space-y-3">
            {choices.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => onChoose(ch.id)}
                className={`${css.btnPrimary} w-full text-left text-[13px] py-3 px-4`}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
