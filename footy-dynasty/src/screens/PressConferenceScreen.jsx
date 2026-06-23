// ---------------------------------------------------------------------------
// Press conference — blocks play until resolved (choose a response, see effect).
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { Mic2 } from 'lucide-react';
import { css } from '../components/primitives.jsx';
import { PRESS_MOMENTS, applyPressResponse } from '../lib/pressEvents.js';
import { useCareer } from '../lib/careerStore.js';

function effectLabel(effect) {
  const parts = [];
  if (effect.moraleAll > 0) parts.push(`Morale lifted across the squad (+${effect.moraleAll})`);
  if (effect.moraleAll < 0) parts.push(`Morale dips across the squad (${effect.moraleAll})`);
  if (effect.boardConfidenceDelta > 0) parts.push(`Board confidence +${effect.boardConfidenceDelta}`);
  if (effect.boardConfidenceDelta < 0) parts.push(`Board confidence ${effect.boardConfidenceDelta}`);
  if (effect.pressRelations > 0) parts.push(`Media relations improved (+${effect.pressRelations})`);
  if (effect.pressRelations < 0) parts.push(`Media relations strained (${effect.pressRelations})`);
  return parts;
}

export default function PressConferenceScreen({ onComplete }) {
  const career = useCareer();
  const moment = PRESS_MOMENTS.find(m => m.id === career.pendingPressMoment?.id);
  const [selectedId, setSelectedId] = useState(null);
  const [phase, setPhase] = useState(0); // 0=prompt, 1=response cards, 2=outcome
  const [patch, setPatch] = useState(null);

  if (!moment) {
    onComplete({});
    return null;
  }

  const prompt = career.pendingPressMoment?.prompt || (typeof moment.prompt === 'function' ? moment.prompt(career) : moment.prompt);

  const confirm = () => {
    if (!selectedId) return;
    const p = applyPressResponse(career, moment.id, selectedId);
    setPatch(p);
    setPhase(2);
  };

  const selectedResponse = moment.responses.find(r => r.id === selectedId);
  const outcomeLines = selectedResponse ? effectLabel(selectedResponse.effect) : [];

  const skipPatch = {
    pendingPressMoment: null,
    lastPressWeek: career.week,
    pressFiredThisSeason: [...(career.pressFiredThisSeason || []), moment.id],
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)' }}
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-center gap-2">
        <Mic2 className="w-4 h-4 text-aaccent" />
        <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-atext-mute">
          Press Conference
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">

        {/* Phase 0: intro / set-up */}
        {phase === 0 && (
          <div className="max-w-xl w-full anim-in text-center">
            <Mic2 className="w-10 h-10 mx-auto text-aaccent mb-4" />
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute mb-2">
              {moment.label}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-atext mb-4 leading-none">
              MEDIA CALL
            </h1>
            <div
              className="rounded-2xl p-6 mb-6 text-left"
              style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)' }}
            >
              <p className="text-atext leading-relaxed">
                <span className="text-aaccent">&ldquo;</span>
                {prompt.replace(/^"|"$/g, '')}
                <span className="text-aaccent">&rdquo;</span>
              </p>
              <div className="text-right mt-4 text-[11px] uppercase tracking-widest text-atext-mute font-mono">
                — Media
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhase(1)}
              className={`${css.btnPrimary} px-8 py-3`}
            >
              Face the media →
            </button>
          </div>
        )}

        {/* Phase 1: response cards */}
        {phase === 1 && (
          <div className="max-w-xl w-full anim-in">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute text-center mb-2">
              Your response
            </div>
            <h2 className="font-display text-3xl text-atext mb-6 text-center leading-none">
              HOW DO YOU RESPOND?
            </h2>
            <div className="space-y-3 mb-6">
              {moment.responses.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className="w-full text-left rounded-2xl p-4 transition hover:border-aaccent"
                  style={{
                    background: 'var(--A-panel-2)',
                    border: `2px solid ${selectedId === r.id ? 'var(--A-accent)' : 'var(--A-line)'}`,
                  }}
                >
                  <div className="text-sm text-atext leading-snug">{r.label}</div>
                  {r.effect && (
                    <div className="text-[10px] text-atext-mute mt-2 font-mono">
                      {effectLabel(r.effect).join(' · ') || 'No direct effect'}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={confirm}
                disabled={!selectedId}
                className={`${css.btnPrimary} px-8 py-3 disabled:opacity-40`}
              >
                CONFIRM →
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: outcome */}
        {phase === 2 && patch && (
          <div className="max-w-xl w-full anim-in text-center">
            <Mic2 className="w-10 h-10 mx-auto text-aaccent mb-4" />
            <h2 className="font-display text-4xl sm:text-5xl text-atext mb-4 leading-none">
              DONE
            </h2>
            {outcomeLines.length > 0 ? (
              <div
                className="rounded-2xl p-6 mb-6 text-left"
                style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)' }}
              >
                <ul className="space-y-2">
                  {outcomeLines.map((line, i) => (
                    <li key={i} className="text-sm text-atext leading-snug">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-atext-dim text-sm mb-6 leading-relaxed px-2">
                Your words are noted. The pack moves on.
              </p>
            )}
            <button
              type="button"
              onClick={() => onComplete(patch)}
              className={`${css.btnPrimary} px-8 py-3`}
            >
              CONTINUE →
            </button>
          </div>
        )}
      </div>

      {/* Skip button */}
      <div className="px-6 pb-6 flex justify-start">
        <button
          type="button"
          onClick={() => onComplete(skipPatch)}
          className="text-[11px] text-atext-dim hover:text-atext-mute font-mono underline underline-offset-2"
        >
          Send assistant instead
        </button>
      </div>
    </div>
  );
}
