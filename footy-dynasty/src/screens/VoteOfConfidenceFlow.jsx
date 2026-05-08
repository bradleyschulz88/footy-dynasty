// ---------------------------------------------------------------------------
// Vote of confidence — blocks play until resolved (survive vs sacked outcome).
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { Landmark, Scale } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { rollVoteOfConfidenceSurvival, voteOfConfidenceSurvivalChance } from "../lib/board.js";

const PITCHES = [
  { id: "humble", label: "Own the slide and present a clear, week-by-week fix.", bonus: 10 },
  { id: "steady", label: "Blend accountability with context — list health and draw.", bonus: 5 },
  { id: "fight", label: "Push back: the board must back the long-term plan in public.", bonus: -7 },
];

export default function VoteOfConfidenceFlow({ career, club, onComplete }) {
  const [phase, setPhase] = useState(0);
  const [pitchBonus, setPitchBonus] = useState(PITCHES[0].bonus);
  const [survived, setSurvived] = useState(null);

  const chair =
    career.board?.members?.find((m) => m.role === "Chairman")?.name || `${club?.short || ""} Chair`;
  const pSurvive = Math.round(voteOfConfidenceSurvivalChance(career, pitchBonus) * 100);

  const runVote = () => {
    const ok = rollVoteOfConfidenceSurvival(career, pitchBonus);
    setSurvived(ok);
    setPhase(2);
  };

  const finish = () => onComplete({ survived, pitchBonus });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #07101F 0%, #1E293B 100%)" }}>
      <div className="px-6 py-4 flex items-center justify-center gap-2">
        <Landmark className="w-4 h-4 text-aaccent" />
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-atext-mute">Executive board</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        {phase === 0 && (
          <div className="max-w-xl w-full anim-in text-center">
            <Scale className="w-10 h-10 mx-auto text-aaccent mb-4" />
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute mb-2">Emergency session</div>
            <h1 className="font-display text-4xl sm:text-5xl text-atext mb-4 leading-none">VOTE OF CONFIDENCE</h1>
            <div className="rounded-2xl p-6 mb-6 text-left" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}>
              <p className="text-atext leading-relaxed">
                <span className="text-aaccent">&ldquo;</span>
                {career.managerName}, the board has lost patience with where results are heading. We are formally convening
                a confidence motion. You will address directors now — then we vote. What you say matters.
                <span className="text-aaccent">&rdquo;</span>
              </p>
              <div className="text-right mt-4 text-[11px] uppercase tracking-widest text-atext-mute font-mono">— {chair}</div>
            </div>
            <button type="button" onClick={() => setPhase(1)} className={`${css.btnPrimary} px-8 py-3`}>
              ADDRESS THE BOARD →
            </button>
          </div>
        )}

        {phase === 1 && (
          <div className="max-w-xl w-full anim-in">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center mb-2">Your pitch</div>
            <h2 className="font-display text-3xl text-atext mb-6 text-center leading-none">HOW DO YOU RESPOND?</h2>
            <div className="space-y-3 mb-6">
              {PITCHES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setPitchBonus(p.bonus); }}
                  className="w-full text-left rounded-2xl p-4 transition hover:border-aaccent"
                  style={{
                    background: "var(--A-panel-2)",
                    border: `2px solid ${pitchBonus === p.bonus ? "var(--A-accent)" : "var(--A-line)"}`,
                  }}
                >
                  <div className="text-sm text-atext leading-snug">{p.label}</div>
                  <div className="text-[10px] text-atext-mute mt-2 font-mono">
                    Estimated survival odds after this tone: ~{Math.round(voteOfConfidenceSurvivalChance(career, p.bonus) * 100)}%
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center text-[11px] text-atext-dim mb-4">Current modelled odds (after pitch): ~{pSurvive}%</div>
            <div className="flex justify-center">
              <button type="button" onClick={runVote} className={`${css.btnPrimary} px-8 py-3`}>
                CALL THE VOTE →
              </button>
            </div>
          </div>
        )}

        {phase === 2 && survived != null && (
          <div className="max-w-xl w-full anim-in text-center">
            <h2 className="font-display text-4xl sm:text-5xl mb-4 leading-none" style={{ color: survived ? "#4AE89A" : "#E84A6F" }}>
              {survived ? "MOTION CARRIED" : "MOTION LOST"}
            </h2>
            <p className="text-atext-dim text-sm mb-8 leading-relaxed px-2">
              {survived
                ? "A slim majority backs you — for now. Stabilise results before this room convenes again."
                : "The vote fails. The board will move to terminate immediately."}
            </p>
            <button type="button" onClick={finish} className={`${css.btnPrimary} px-8 py-3`}>
              CONTINUE →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
