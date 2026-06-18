import { useState } from 'react';
import { motion } from 'motion/react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';

export default function LegendFarewellScreen({ onComplete }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [idx, setIdx] = useState(0);

  const farewells = career.pendingFarewells || [];
  const player = farewells[idx];

  if (!player) {
    onComplete();
    return null;
  }

  const isLast = idx === farewells.length - 1;

  // Generate a simple farewell quote
  const quotes = [
    `"It's been the honour of my life. I gave everything I had."`,
    `"This club gave me everything. I'll never forget what we built together."`,
    `"${player.careerGames} games. Every single one meant the world."`,
    `"Time to hand the guernsey to the next generation. Thank you all."`,
    `"No regrets. This is exactly how I wanted it to end."`,
  ];
  const quote = quotes[player.id?.charCodeAt(0) % quotes.length] ?? quotes[0];

  function handleContinue() {
    if (isLast) {
      updateCareer(c => ({ ...c, pendingFarewells: [] }));
      onComplete();
    } else {
      setIdx(idx + 1);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 p-6"
      style={{ background: 'var(--A-bg)' }}>

      {/* Decorative — gold star or trophy */}
      <div className="text-5xl mb-4">🏆</div>

      <div className="text-[10px] font-mono uppercase tracking-widest mb-2"
        style={{ color: 'var(--A-accent)' }}>
        Legend Farewell
      </div>

      <h1 className="text-3xl font-bold text-atext text-center mb-1">{player.name}</h1>
      <div className="text-[13px] text-atext-mute mb-6">{player.position} · {player.age} years old</div>

      {/* Career stats */}
      <div className="flex gap-8 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-atext">{player.careerGames}</div>
          <div className="text-[11px] text-atext-dim">Games</div>
        </div>
        {player.careerGoals > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-atext">{player.careerGoals}</div>
            <div className="text-[11px] text-atext-dim">Goals</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-2xl font-bold text-atext">{player.seasons}</div>
          <div className="text-[11px] text-atext-dim">Seasons</div>
        </div>
      </div>

      {/* Quote */}
      <div className="max-w-sm text-center text-[13px] text-atext-mute italic mb-8 leading-relaxed px-4">
        {quote}
      </div>

      {farewells.length > 1 && (
        <div className="text-[10px] text-atext-dim mb-4">
          {idx + 1} of {farewells.length}
        </div>
      )}

      <button
        onClick={handleContinue}
        className="px-8 py-3 rounded-xl font-semibold text-[14px]"
        style={{ background: 'var(--A-accent)', color: '#000' }}>
        {isLast ? 'Farewell' : 'Next'}
      </button>
    </motion.div>
  );
}
