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
  if (nextScreen === "hub" || nextScreen === "settings") return true;
  const lastStep = TUTORIAL_STEPS.length - 1;
  // Lock all nav only on the final step (player must use ADVANCE, not navigate away)
  if (step === lastStep) return false;
  // All other steps allow free navigation — tutorial is informational, not task-gated
  return true;
}

/** Mid-flow steps auto-advance when target screen/tab is reached. New tutorial is NEXT-driven, so always false. */
export function tutorialMidStepCompleted(_step, _screen, _tab, _career) {
  return false;
}

export function tutorialHighlightScreen(step) {
  const row = TUTORIAL_STEPS[step];
  return row?.targetScreen ?? null;
}

export function tutorialHighlightTab(step) {
  const row = TUTORIAL_STEPS[step];
  return row?.targetTab ?? null;
}

/** Block main ADVANCE until the final step while tutorial is active. */
export function tutorialLocksAdvanceButton(career) {
  if (career.tutorialComplete) return false;
  const step = career.tutorialStep ?? 0;
  return step < TUTORIAL_STEPS.length - 1;
}

const STEP_ICONS = ['👋', '⏭️', '🏉', '📊', '🏆', '🚀'];

export default function TutorialOverlay({ step, onNext, onSkip }) {
  const data = TUTORIAL_STEPS.find((s) => s.step === step) || TUTORIAL_STEPS[0];
  const isFinal = step >= TUTORIAL_STEPS.length - 1;
  const showNext = data.advanceWithNext;
  const icon = STEP_ICONS[step] ?? '📖';
  return (
    <motion.div
      key={step}
      className="fixed bottom-4 right-4 z-[70] max-w-sm w-[22rem]"
      style={{ pointerEvents: "auto" }}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--A-panel)",
          border: "1.5px solid var(--A-accent)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in srgb, var(--A-accent) 20%, transparent)",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, var(--A-accent), color-mix(in srgb, var(--A-accent) 70%, var(--A-accent-2)))", color: "#001520" }}
        >
          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="flex items-center gap-1">
              {TUTORIAL_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 14 : 5,
                    height: 5,
                    background: i <= step ? '#001520' : 'rgba(0,21,32,0.35)',
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-70 ml-1">
              {step + 1} / {TUTORIAL_STEPS.length}
            </span>
          </div>
          <button type="button" onClick={onSkip} title="Skip tutorial" className="opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl leading-none mt-0.5">{icon}</span>
            <div>
              <div className="font-display text-lg tracking-wide text-atext leading-tight">{data.title}</div>
              <div className="text-xs text-aaccent mt-0.5">{data.intro}</div>
            </div>
          </div>
          <div className="text-sm text-atext-dim leading-relaxed">{data.instruction}</div>
          {isFinal && !showNext && (
            <div className="mt-3 text-[11px] font-mono text-aaccent leading-snug">
              ↑ ADVANCE button is now active in the top bar.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2"
          style={{ borderTop: "1px solid var(--A-line)", background: "var(--A-panel-2)" }}
        >
          <button type="button" onClick={onSkip} className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute hover:text-atext transition-colors">
            Skip
          </button>
          {showNext ? (
            <button type="button" onClick={onNext} className={`${css.btnPrimary} text-[11px] py-2 px-5 flex items-center gap-1.5`}>
              {isFinal ? "GOT IT" : "NEXT"} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] font-mono text-aaccent uppercase tracking-widest">
              Use ADVANCE ↑
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
