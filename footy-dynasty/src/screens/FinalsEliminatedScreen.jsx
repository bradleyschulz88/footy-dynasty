import React from "react";
import { findClub } from "../data/pyramid.js";
import { css } from "../components/primitives.jsx";
import { finalsRoundLabel } from "../lib/finalsBracket.js";

export default function FinalsEliminatedScreen({ career, league, onSimRemainder, onContinue }) {
  const alive = career.finalsAlive || [];
  const results = career.finalsResults || [];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "linear-gradient(160deg, #1a0f14 0%, #0F172A 60%, #1E293B 100%)" }}
    >
      <div className="max-w-lg w-full text-center anim-in">
        <div className="text-5xl mb-4">💔</div>
        <h1 className="font-display text-3xl text-white mb-2">FINALS OVER</h1>
        <p className="text-sm text-atext-dim mb-6">
          Eliminated — {alive.length} club{alive.length === 1 ? "" : "s"} still fighting for the flag.
        </p>

        {results.length > 0 && (
          <div
            className="rounded-2xl p-4 mb-6 text-left max-h-48 overflow-y-auto"
            style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)" }}
          >
            <div className="text-[10px] uppercase tracking-widest text-atext-mute mb-2">Your finals</div>
            {results
              .filter((r) => r.home === career.clubId || r.away === career.clubId)
              .map((r, i) => {
                const opp = findClub(r.home === career.clubId ? r.away : r.home);
                const res = r.result;
                return (
                  <div key={i} className="text-sm py-1.5 border-b border-aline/50 last:border-0">
                    <span className="text-aaccent font-semibold">{r.label}</span>
                    {" · "}
                    vs {opp?.short}
                    {res && (
                      <span className="font-mono text-atext-dim ml-2">
                        {res.hScore}–{res.aScore}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {career.inFinals && (
            <button type="button" onClick={onSimRemainder} className={`${css.btnPrimary} px-6 py-2.5 text-sm`}>
              Sim to grand final
            </button>
          )}
          <button type="button" onClick={onContinue} className={`${css.btnGhost} px-6 py-2.5 text-sm`}>
            {career.inFinals ? "Watch from hub" : "Continue"}
          </button>
        </div>
        {career.inFinals && alive.length > 1 && (
          <p className="text-[10px] text-atext-mute mt-4">
            Next round: {finalsRoundLabel(alive.length, league?.tier ?? 1)}
          </p>
        )}
      </div>
    </div>
  );
}
