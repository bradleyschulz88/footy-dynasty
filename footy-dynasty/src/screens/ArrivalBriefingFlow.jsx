// ---------------------------------------------------------------------------
// First-day arrival: chairman welcome + optional presser (new job only).
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Handshake, Mic, ChevronRight } from "lucide-react";
import { clamp } from "../lib/format.js";
import { useCareer } from "../lib/careerStore.js";

export default function ArrivalBriefingFlow({ club, league, onComplete }) {
  const career = useCareer();
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

  // Club colour accent (first colour from club.colors if available)
  const clubAccent = club?.colors?.[0] ?? "var(--A-accent)";

  const presserOptions = [
    {
      label: "Bold vision",
      sub: "Sell the climb — members love it; press will test you.",
      tag: "High risk · High reward",
      tagColor: "var(--A-neg)",
      onSelect: () => finishPress(4, 3),
      primary: true,
    },
    {
      label: "Measured rebuild",
      sub: "Boring is safe — board breathes easier; headlines stay smaller.",
      tag: "Safe · Board approved",
      tagColor: "var(--A-accent)",
      onSelect: () => finishPress(1, 5),
      primary: false,
    },
    {
      label: "Underdog grit",
      sub: "Lean into the chip on the shoulder — fans lean in; suits stay wary.",
      tag: "Fan favourite · Board cautious",
      tagColor: "var(--A-accent-2)",
      onSelect: () => finishPress(-2, 6),
      primary: false,
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)" }}
    >
      {/* Club colour ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${clubAccent} 12%, transparent) 0%, transparent 55%)`,
        }}
      />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.div
              key="step-welcome"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl w-full text-center"
            >
              {/* Club badge */}
              <div
                className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${clubAccent}, ${club?.colors?.[1] ?? "var(--A-accent-2)"})`,
                  boxShadow: `0 8px 32px color-mix(in srgb, ${clubAccent} 35%, transparent)`,
                }}
              >
                <Handshake className="w-9 h-9" style={{ color: club?.colors?.[2] ?? "#fff" }} />
              </div>

              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-aaccent mb-2">Day One</div>
              <h1
                className="font-display leading-none mb-3"
                style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", letterSpacing: "0.04em" }}
              >
                WELCOME TO{" "}
                <span style={{ color: clubAccent }}>{club?.short ?? club?.name}</span>
              </h1>
              <p className="text-atext-dim text-sm mb-1 font-mono uppercase tracking-widest">
                {club?.name}
              </p>

              {/* Context card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="rounded-2xl p-5 mb-8 text-left mt-6"
                style={{
                  background: "var(--A-panel)",
                  border: "1px solid var(--A-line-2)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                }}
              >
                <p className="text-atext leading-relaxed text-sm">
                  You&apos;re stepping into a <strong>{tierLabel}</strong> dressing room. The chair wants a steady
                  hand; the members want to see intent before Round 1. Take a moment with the chairman, then front
                  the press on how you&apos;ll shape the year.
                </p>
              </motion.div>

              <motion.button
                type="button"
                onClick={() => setStep(1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 font-display text-lg tracking-widest px-10 py-4 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${clubAccent}, var(--A-accent-2))`,
                  color: "var(--fd-on-accent, #fff)",
                  boxShadow: `0 6px 24px color-mix(in srgb, ${clubAccent} 35%, transparent)`,
                }}
              >
                FRONT THE MEDIA <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step-press"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-xl w-full"
            >
              {/* Presser header */}
              <div className="text-center mb-8">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
                  style={{
                    background: "color-mix(in srgb, var(--A-accent) 15%, var(--A-panel))",
                    border: "1px solid color-mix(in srgb, var(--A-accent) 30%, var(--A-line))",
                    boxShadow: "0 4px 16px color-mix(in srgb, var(--A-accent) 15%, transparent)",
                  }}
                >
                  <Mic className="w-7 h-7 text-aaccent" />
                </div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute mb-2">
                  Opening presser
                </div>
                <h2 className="font-display text-3xl sm:text-4xl text-atext leading-none mb-2">
                  FIRST MESSAGE TO THE MARKET
                </h2>
                <p className="text-sm text-atext-dim">
                  {career.managerName}, how do you open your tenure at {club?.name}?
                </p>
              </div>

              {/* Choice cards — staggered in */}
              <div className="space-y-3">
                {presserOptions.map((opt, i) => (
                  <motion.button
                    key={opt.label}
                    type="button"
                    onClick={opt.onSelect}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.09, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left rounded-xl p-4 flex items-start gap-4 transition-colors group"
                    style={{
                      background: opt.primary
                        ? `linear-gradient(135deg, color-mix(in srgb, var(--A-accent) 12%, var(--A-panel)), var(--A-panel))`
                        : "var(--A-panel)",
                      border: opt.primary
                        ? "1px solid color-mix(in srgb, var(--A-accent) 40%, var(--A-line))"
                        : "1px solid var(--A-line-2)",
                      boxShadow: opt.primary
                        ? "0 2px 12px color-mix(in srgb, var(--A-accent) 12%, transparent)"
                        : undefined,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-lg text-atext leading-tight">{opt.label}</div>
                      <div className="text-[12px] text-atext-dim mt-1 leading-snug">{opt.sub}</div>
                      <div
                        className="text-[10px] font-mono font-bold uppercase tracking-widest mt-2"
                        style={{ color: opt.tagColor }}
                      >
                        {opt.tag}
                      </div>
                    </div>
                    <ChevronRight
                      className="w-5 h-5 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                      style={{ color: opt.primary ? "var(--A-accent)" : "var(--A-text-mute)" }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
