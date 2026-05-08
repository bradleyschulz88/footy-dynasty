// ---------------------------------------------------------------------------
// First-day arrival: chairman welcome + optional presser (new job only).
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { Handshake, Mic } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { clamp } from "../lib/format.js";

export default function ArrivalBriefingFlow({ career, club, league, onComplete }) {
  const [step, setStep] = useState(0);
  const tierLabel = league?.tier === 1 ? "AFL" : league?.tier === 2 ? "state league" : "community league";

  const finishPress = (journalistDelta, boardDelta) => {
    const j = career.journalist || { name: "Press", satisfaction: 50, tone: "neutral" };
    onComplete({
      arrivalBriefing: null,
      journalist: { ...j, satisfaction: clamp((j.satisfaction ?? 50) + journalistDelta, 0, 100) },
      finance: {
        ...career.finance,
        boardConfidence: clamp((career.finance?.boardConfidence ?? 55) + boardDelta, 0, 100),
      },
      news: [
        {
          week: career.week ?? 0,
          type: "info",
          text: "🎙️ Press conference wrapped — the market has a read on how you'll coach this list.",
        },
        ...(career.news || []),
      ].slice(0, 20),
    });
  };

  if (step === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #07101F 0%, #1E293B 100%)" }}>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-xl w-full anim-in text-center">
            <Handshake className="w-10 h-10 mx-auto text-aaccent mb-4" />
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute mb-2">Day one</div>
            <h1 className="font-display text-4xl sm:text-5xl text-atext mb-4 leading-none">WELCOME TO {club?.short}</h1>
            <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}>
              <p className="text-atext leading-relaxed text-sm">
                You&apos;re stepping into a <strong>{tierLabel}</strong> dressing room. The chair wants a steady hand;
                the members want to see intent before Round 1. Take a moment with the chairman, then front the press
                on how you&apos;ll shape the year.
              </p>
            </div>
            <button type="button" onClick={() => setStep(1)} className={`${css.btnPrimary} px-8 py-3`}>
              FRONT THE MEDIA →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #07101F 0%, #1E293B 100%)" }}>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-xl w-full anim-in">
          <Mic className="w-10 h-10 mx-auto text-aaccent mb-4" />
          <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center mb-2">Opening presser</div>
          <h2 className="font-display text-3xl text-atext mb-4 text-center leading-none">FIRST MESSAGE TO THE MARKET</h2>
          <p className="text-sm text-atext-dim text-center mb-6">
            {career.managerName}, how do you open your tenure at {club?.name}?
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => finishPress(4, 3)}
              className={`${css.btnPrimary} w-full text-left text-[13px] py-3 px-4`}
            >
              <strong>Bold vision</strong>
              <span className="block text-[11px] text-atext-mute font-normal mt-1">Sell the climb — members love it; press will test you.</span>
            </button>
            <button
              type="button"
              onClick={() => finishPress(1, 5)}
              className={`${css.btnPrimary} w-full text-left text-[13px] py-3 px-4`}
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)", color: "var(--A-text)" }}
            >
              <strong>Measured rebuild</strong>
              <span className="block text-[11px] text-atext-mute font-normal mt-1">Boring is safe — board breathes easier; headlines stay smaller.</span>
            </button>
            <button
              type="button"
              onClick={() => finishPress(-2, 6)}
              className={`${css.btnPrimary} w-full text-left text-[13px] py-3 px-4`}
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)", color: "var(--A-text)" }}
            >
              <strong>Underdog grit</strong>
              <span className="block text-[11px] text-atext-mute font-normal mt-1">Lean into the chip on the shoulder — fans lean in; suits stay wary.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
