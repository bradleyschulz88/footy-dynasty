// ---------------------------------------------------------------------------
// TutorialOverlay (Spec Section 1)
// Renders a non-blocking instructional card on top of the main layout when
// career.tutorialStep < 6 and !career.tutorialComplete.
// SKIP TUTORIAL is always visible.
// ---------------------------------------------------------------------------
import React from "react";
import { ChevronRight, X } from "lucide-react";
import { css } from "./primitives.jsx";

export const TUTORIAL_STEPS = [
  {
    step: 0,
    title: 'WELCOME TO FOOTY DYNASTY',
    intro: 'You\'re the new coach. Take this place from where it is to where it deserves to be.',
    instruction: 'Tap NEXT to begin your first week.',
    targetScreen: 'hub',
    autoAdvance: false,
  },
  {
    step: 1,
    title: 'MEET YOUR SQUAD',
    intro: 'These are your players.',
    instruction: 'Open the Squad tab from the side nav. Tap any player card to see their full profile — attributes, form, fitness and contract.',
    targetScreen: 'squad',
    autoAdvance: false,
  },
  {
    step: 2,
    title: 'SET YOUR TRAINING',
    intro: 'How they train shapes how they play.',
    instruction: 'Open the Training tab inside Squad. Move the intensity slider and pick a focus. Higher intensity = more development but more injuries.',
    targetScreen: 'squad',
    autoAdvance: false,
  },
  {
    step: 3,
    title: 'CHECK YOUR FINANCES',
    intro: 'Know your numbers.',
    instruction: 'Open the Club tab → Finances. This is what you have to spend, what\'s coming in, and what\'s going out. Stay in the black.',
    targetScreen: 'club',
    autoAdvance: false,
  },
  {
    step: 4,
    title: 'SIGN A SPONSOR',
    intro: 'Sponsors keep the lights on.',
    instruction: 'Open Club → Sponsors. Accept a deal that suits your situation. Bigger results unlock better deals.',
    targetScreen: 'club',
    autoAdvance: false,
  },
  {
    step: 5,
    title: 'PICK YOUR BEST 22',
    intro: 'Selection is a coach\'s sharpest tool.',
    instruction: 'Open Squad → Tactics. Build your match-day 22 and choose a tactic.',
    targetScreen: 'squad',
    autoAdvance: false,
  },
  {
    step: 6,
    title: 'PLAY YOUR FIRST MATCH',
    intro: 'Round 1 is calling.',
    instruction: 'Hit ADVANCE in the top bar to play your first game. Good luck out there.',
    targetScreen: 'hub',
    autoAdvance: false,
  },
];

export default function TutorialOverlay({ step, onNext, onSkip }) {
  const data = TUTORIAL_STEPS.find(s => s.step === step) || TUTORIAL_STEPS[0];
  const isFinal = step >= TUTORIAL_STEPS.length - 1;
  return (
    <div className="fixed bottom-4 right-4 z-[70] max-w-sm anim-in" style={{ pointerEvents: 'auto' }}>
      <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--A-panel)', border: '2px solid var(--A-accent)', boxShadow: '0 20px 60px rgba(0, 224, 255, 0.25)' }}>
        <div className="px-4 py-2 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, var(--A-accent), #0099b0)', color: '#001520' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Step {step + 1} of {TUTORIAL_STEPS.length}</span>
          </div>
          <button onClick={onSkip} title="Skip tutorial" className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="font-display text-xl tracking-wide mb-1 text-atext">{data.title}</div>
          <div className="text-xs text-atext-dim italic mb-2">{data.intro}</div>
          <div className="text-sm text-atext leading-snug">{data.instruction}</div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderTop: '1px solid var(--A-line)', background: 'var(--A-panel-2)' }}>
          <button onClick={onSkip} className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute hover:text-atext">
            SKIP TUTORIAL
          </button>
          <button onClick={onNext} className={`${css.btnPrimary} text-[11px] py-2 px-4 flex items-center gap-1.5`}>
            {isFinal ? 'GOT IT' : 'NEXT'} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Final completion card — shown briefly after step 6 fires
export function TutorialCompleteCard({ onClose }) {
  return (
    <div className="fixed bottom-4 right-4 z-[70] max-w-sm anim-in">
      <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--A-panel)', border: '2px solid #4AE89A', boxShadow: '0 20px 60px rgba(74,232,154,0.25)' }}>
        <div className="px-4 py-2" style={{ background: 'linear-gradient(90deg, #4AE89A, #2EC97A)', color: '#001f10' }}>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Tutorial Complete</span>
        </div>
        <div className="px-4 py-4">
          <div className="font-display text-xl tracking-wide mb-1 text-atext">YOU KNOW ENOUGH</div>
          <div className="text-sm text-atext leading-snug">The rest you'll learn by doing. Your club needs you — get to work.</div>
        </div>
        <div className="px-4 py-3 flex justify-end" style={{ borderTop: '1px solid var(--A-line)', background: 'var(--A-panel-2)' }}>
          <button onClick={onClose} className={`${css.btnPrimary} text-[11px] py-2 px-4`}>LET'S GO →</button>
        </div>
      </div>
    </div>
  );
}
