import { useState } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';

export default function TribunalScreen({ onComplete }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [idx, setIdx] = useState(0);
  const cases = career.tribunalQueue || [];
  const current = cases[idx];

  if (!current) { onComplete(); return null; }

  function resolve(outcome) {
    const weeks =
      outcome === 'guilty'
        ? Math.max(1, current.baseWeeks - 1)
        : outcome === 'acquitted'
        ? 0
        : current.baseWeeks + (Math.random() < 0.5 ? 0 : 1);

    const isLast = idx + 1 >= cases.length;

    updateCareer((c) => {
      const player = (c.squad || []).find((p) => p.id === current.playerId);
      const updatedSquad = player
        ? c.squad.map((p) =>
            p.id === current.playerId
              ? { ...p, injuredWeeks: Math.max(p.injuredWeeks || 0, weeks) }
              : p
          )
        : c.squad;
      const newsText =
        outcome === 'acquitted'
          ? `⚖️ ${current.playerName} cleared at tribunal — no suspension.`
          : `⚖️ ${current.playerName} suspended ${weeks} week${weeks !== 1 ? 's' : ''} for ${current.charge}.`;
      return {
        ...c,
        squad: updatedSquad,
        tribunalQueue: cases.slice(idx + 1),
        news: [
          { week: c.week, type: weeks > 0 ? 'warning' : 'info', text: newsText },
          ...(c.news || []),
        ].slice(0, 25),
      };
    });

    if (isLast) {
      onComplete();
    } else {
      setIdx((i) => i + 1);
    }
  }

  const guiltyWeeks = Math.max(1, current.baseWeeks - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="w-full max-w-md mx-4 rounded-2xl p-6"
        style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line)' }}
      >
        <div
          className="text-xs font-mono uppercase tracking-widest mb-4"
          style={{ color: 'var(--A-accent)' }}
        >
          AFL Tribunal
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--A-text)' }}>
          {current.playerName}
        </h2>
        <p className="text-sm mb-1" style={{ color: 'var(--A-text-dim)' }}>
          Charge: {current.charge}
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--A-text-dim)' }}>
          Severity: {current.severity} — facing {current.baseWeeks} week{current.baseWeeks !== 1 ? 's' : ''}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => resolve('guilty')}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: 'color-mix(in srgb, var(--A-pos) 15%, transparent)',
              color: 'var(--A-pos)',
              border: '1px solid color-mix(in srgb, var(--A-pos) 30%, transparent)',
            }}
          >
            Plead Guilty (early) — {guiltyWeeks} week{guiltyWeeks !== 1 ? 's' : ''}
          </button>
          <button
            onClick={() => resolve(Math.random() < 0.5 ? 'acquitted' : 'contested_guilty')}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: 'color-mix(in srgb, var(--A-accent) 15%, transparent)',
              color: 'var(--A-accent)',
              border: '1px solid color-mix(in srgb, var(--A-accent) 30%, transparent)',
            }}
          >
            Contest at Tribunal — 50% chance acquitted, 50% full penalty
          </button>
        </div>
        {cases.length > 1 && (
          <p className="text-xs text-center mt-4" style={{ color: 'var(--A-text-mute)' }}>
            Case {idx + 1} of {cases.length}
          </p>
        )}
      </div>
    </div>
  );
}
