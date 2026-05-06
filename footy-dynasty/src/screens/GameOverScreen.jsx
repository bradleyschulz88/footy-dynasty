// ---------------------------------------------------------------------------
// GameOverScreen — sacking / career-end screen. Pure leaf, no inner state.
// ---------------------------------------------------------------------------
import React from "react";

export default function GameOverScreen({ career, club, onRestart, onTakeNewJob }) {
  const reason = career.gameOver?.reason || 'sacked';
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg,#0F172A 0%,#1E293B 100%)' }}>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl w-full text-center">
          <div className="text-6xl mb-4">💼</div>
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-aaccent mb-2 font-mono">Career Update</div>
          <h1 className="font-display text-5xl sm:text-6xl text-white mb-4 leading-none">
            {reason === 'sacked' ? 'YOU\'VE BEEN SACKED' : 'CAREER OVER'}
          </h1>
          <p className="text-slate-300 mb-8 leading-relaxed">
            {reason === 'sacked'
              ? `The board at ${club.name} have lost confidence and terminated your contract. ${career.gameOver?.season ? `Season ${career.gameOver.season}` : ''}${career.gameOver?.week ? ` · Round ${career.gameOver.week}` : ''}.`
              : 'Your time at the helm has come to an end.'}
          </p>
          {career.gameOver?.premiership && (
            <div className="rounded-2xl p-4 mb-6 inline-block" style={{ background: 'rgba(255,215,0,0.10)', border: '1px solid rgba(255,215,0,0.4)' }}>
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-[#FFD700] font-bold text-sm">{career.gameOver.premiership} premiership winner</div>
              <div className="text-[10px] text-slate-400 mt-1">No-one can take that away</div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button onClick={onTakeNewJob}
              className="px-6 py-3 rounded-xl font-display text-lg tracking-widest text-[#001520] transition-all"
              style={{ background: 'linear-gradient(135deg,var(--A-accent),#0099b0)', boxShadow: '0 4px 20px rgba(0,224,255,0.35)' }}>
              TAKE A LOWER JOB →
            </button>
            <button onClick={onRestart}
              className="px-6 py-3 rounded-xl font-display text-lg tracking-widest text-white transition-all"
              style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.2)' }}>
              RESTART
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
