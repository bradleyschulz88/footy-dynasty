// ---------------------------------------------------------------------------
// Mandatory board meeting (mid-season / finance) — blocks hub until resolved.
// ---------------------------------------------------------------------------
import React from "react";
import { Landmark } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { useCareer } from "../lib/careerStore.js";
import { BOARD_PERSONALITIES, boardMemberFlavor } from "../lib/board.js";

function moodForConfidence(conf) {
  if (conf >= 70) return "warm";
  if (conf >= 40) return "neutral";
  return "critical";
}

export default function BoardMeetingScreen({ blocking, onChoose }) {
  const career = useCareer();
  const title  = blocking?.title || "Board meeting";
  const intro  = blocking?.intro || "";
  const choices = blocking?.choices || [];
  const tier = blocking?.leagueTier ?? 2;
  const isCommittee = tier === 3;
  const headerLabel = isCommittee ? "Scheduled committee session" : "Scheduled board session";
  const members = career.board?.members || [];
  const topic = blocking?.kind || "review";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)" }}>
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
          {members.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] text-atext-mute uppercase tracking-widest mb-3 font-mono">
                {isCommittee ? "Around the table" : "Board reactions"}
              </div>
              <div className="space-y-2">
                {members.map((m) => {
                  const mood = moodForConfidence(m.confidence ?? 50);
                  const archetype = BOARD_PERSONALITIES[m.personality];
                  return (
                    <div
                      key={m.role}
                      className="rounded-xl p-3"
                      style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[12px] font-semibold text-atext">{m.name}</span>
                        <span className="text-[10px] text-atext-mute font-mono uppercase tracking-wider">{m.role}</span>
                        {archetype && (
                          <span
                            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--A-bg-2)", border: "1px solid var(--A-line-2)", color: "var(--A-accent)" }}
                            title={archetype.blurb}
                          >
                            {archetype.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-atext-mute leading-snug italic">
                        “{boardMemberFlavor(m, { mood, topic })}”
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
