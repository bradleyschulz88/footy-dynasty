// ---------------------------------------------------------------------------
// TutorialOverlay (Spec Section 1)
// Guided steps: highlight the next destination, block other navigation and
// ADVANCE until the step is done. SKIP TUTORIAL is always available.
// ---------------------------------------------------------------------------
import React from "react";
import { motion } from "motion/react";
import { ChevronRight, X } from "lucide-react";
import { css } from "./primitives.jsx";
import { TUTORIAL_STEPS } from "../lib/tutorialConstants.js";

export { TUTORIAL_STEPS };

/** Effective Squad sub-tab (matches SquadScreen default). */
export function squadEffectiveTab(career, tab) {
  const playerR = (career.pendingRenewals || []).filter((r) => !r._handled).length;
  const staffR = (career.pendingStaffRenewals || []).filter((r) => !r._handled).length;
  const total = playerR + staffR;
  return tab || (total > 0 ? 'renewals' : 'players');
}

/** Club screen default when `tab` is unset — Overview hub ( Finances / Sponsors are explicit for tutorial steps). */
export function clubEffectiveTab(tab) {
  return tab == null ? "overview" : tab;
}

/** Whether navigating to `nextScreen` is allowed during this tutorial step. */
export function tutorialAllowsNavigation(step, nextScreen) {
  if (step < 0 || step >= TUTORIAL_STEPS.length) return true;
  if (nextScreen === "hub") return true;
  if (nextScreen === "settings") return true;
  const row = TUTORIAL_STEPS[step];
  if (row.step === 0) return false;
  if (row.step === 6) return false;
  if (row.step === 1 || row.step === 2 || row.step === 5) {
    return nextScreen === "squad";
  }
  if (row.step === 3 || row.step === 4) {
    return nextScreen === "club";
  }
  return true;
}

/** Mid-flow steps (1–5) auto-advance when their target screen/tab — and extras — are met. */
export function tutorialMidStepCompleted(step, screen, tab, career) {
  if (step <= 0 || step >= 6) return false;
  const row = TUTORIAL_STEPS[step];
  if (screen !== row.targetScreen) return false;
  if (row.targetScreen === "squad") {
    if (squadEffectiveTab(career, tab) !== row.targetTab) return false;
  } else if (row.targetScreen === "club") {
    if (clubEffectiveTab(tab) !== row.targetTab) return false;
  }
  if (row.requiresSponsor && (!(career.sponsors || []).length)) return false;
  return true;
}

export function tutorialHighlightScreen(step) {
  const row = TUTORIAL_STEPS[step];
  return row?.targetScreen ?? null;
}

export function tutorialHighlightTab(step) {
  const row = TUTORIAL_STEPS[step];
  return row?.targetTab ?? null;
}

/** Block main ADVANCE until step 6 (calendar) while tutorial is active. */
export function tutorialLocksAdvanceButton(career) {
  if (career.tutorialComplete) return false;
  const step = career.tutorialStep ?? 0;
  return step < 6;
}

export default function TutorialOverlay({ step, onNext, onSkip }) {
  const data = TUTORIAL_STEPS.find((s) => s.step === step) || TUTORIAL_STEPS[0];
  const isFinal = step >= TUTORIAL_STEPS.length - 1;
  const showNext = data.advanceWithNext;
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-[70] max-w-sm"
      style={{ pointerEvents: "auto" }}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--A-panel)",
          border: "2px solid var(--A-accent)",
          boxShadow: "0 20px 60px rgba(0, 224, 255, 0.25)",
        }}
      >
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, var(--A-accent), #0099b0)", color: "#001520" }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
              Step {step + 1} of {TUTORIAL_STEPS.length}
            </span>
          </div>
          <button type="button" onClick={onSkip} title="Skip tutorial" className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="font-display text-xl tracking-wide mb-1 text-atext">{data.title}</div>
          <div className="text-xs text-atext-dim italic mb-2">{data.intro}</div>
          <div className="text-sm text-atext leading-snug">{data.instruction}</div>
          {!showNext && (
            <div className="mt-3 text-[11px] font-mono text-aaccent leading-snug">
              Follow the pulsing highlight. Other nav and ADVANCE stay locked until this step is done — or skip anytime.
            </div>
          )}
        </div>
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--A-line)", background: "var(--A-panel-2)" }}
        >
          <button type="button" onClick={onSkip} className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute hover:text-atext">
            SKIP TUTORIAL
          </button>
          {showNext ? (
            <button type="button" onClick={onNext} className={`${css.btnPrimary} text-[11px] py-2 px-4 flex items-center gap-1.5`}>
              {isFinal ? "GOT IT" : "NEXT"} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-atext-mute uppercase tracking-widest text-right max-w-[200px] leading-snug">
              Next: highlighted control
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Final completion card — shown briefly after step 6 fires
export function TutorialCompleteCard({ onClose }) {
  return (
    <motion.div
      className="fixed bottom-4 right-4 z-[70] max-w-sm"
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--A-panel)", border: "2px solid #4AE89A", boxShadow: "0 20px 60px rgba(74,232,154,0.25)" }}
      >
        <div className="px-4 py-2" style={{ background: "linear-gradient(90deg, #4AE89A, #2EC97A)", color: "#001f10" }}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Tutorial Complete</span>
        </div>
        <div className="px-4 py-4">
          <div className="font-display text-xl tracking-wide mb-1 text-atext">YOU KNOW ENOUGH</div>
          <div className="text-sm text-atext leading-snug">The rest you&apos;ll learn by doing. Your club needs you — get to work.</div>
        </div>
        <div className="px-4 py-3 flex justify-end" style={{ borderTop: "1px solid var(--A-line)", background: "var(--A-panel-2)" }}>
          <button type="button" onClick={onClose} className={`${css.btnPrimary} text-[11px] py-2 px-4`}>
            LET&apos;S GO →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
