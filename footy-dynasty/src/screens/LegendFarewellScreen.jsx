import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';
import { POSITION_NAMES } from '../lib/playerGen.js';
import { findClub } from '../data/pyramid.js';

function fareQuote(player) {
  const games = player.careerGames ?? 0;
  const pool = games >= 250
    ? [
        `"Two-fifty games. Every one of them mattered. Every single one."`,
        `"I gave this club the best years of my life, and I'd do it all again without a second thought."`,
        `"When they play the song at the end — that's what it's all been for."`,
      ]
    : games >= 150
    ? [
        `"This club changed my life. I'm walking away a better player and a better person."`,
        `"${games} games. Not enough and everything at once."`,
        `"The memories I take from this place will stay with me forever."`,
      ]
    : [
        `"It's been the honour of my career. I gave everything I had."`,
        `"Time to hand the guernsey to the next generation. Thank you all."`,
        `"No regrets. This is exactly how I wanted it to end."`,
        `"This club, these teammates — I wouldn't trade it for anything."`,
      ];
  return pool[(player.id?.charCodeAt(0) ?? 0) % pool.length];
}

export default function LegendFarewellScreen({ onComplete }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const farewells = career.pendingFarewells || [];
  const player = farewells[idx];

  const club = findClub(career.clubId);
  const cc1 = club?.colors?.[0] ?? '#C8FF3D';

  useEffect(() => {
    if (!player) return;
    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.55 },
        colors: ['#FFD700', '#FFA500', cc1, '#ffffff'],
        scalar: 0.9,
        gravity: 0.8,
      });
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (!player) {
    onComplete();
    return null;
  }

  const isLast = idx === farewells.length - 1;
  const posLabel = POSITION_NAMES?.[player.position] ?? player.position ?? 'Player';
  const quote = fareQuote(player);
  const milestoneLabel = (player.careerGames ?? 0) >= 200 ? '200-Game Club'
    : (player.careerGames ?? 0) >= 150 ? '150-Game Veteran'
    : '100-Game Legend';

  function handleContinue() {
    setVisible(false);
    setTimeout(() => {
      if (isLast) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#FFD700', '#FFA500', cc1, '#ffffff'] });
        updateCareer(c => ({ ...c, pendingFarewells: [] }));
        onComplete();
      } else {
        setIdx(i => i + 1);
        setVisible(true);
      }
    }, 300);
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50 p-4"
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 30%, color-mix(in srgb, ${cc1} 12%, #080c0b), #080c0b)`,
      }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 inset-x-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${cc1}, transparent)` }} />

      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Milestone badge */}
            <div
              className="text-[10px] font-black uppercase tracking-[0.28em] px-3 py-1 rounded-full mb-5"
              style={{
                background: `color-mix(in srgb, ${cc1} 18%, transparent)`,
                border: `1px solid color-mix(in srgb, ${cc1} 40%, transparent)`,
                color: cc1,
              }}
            >
              {milestoneLabel}
            </div>

            {/* Big games number — jersey-style hero */}
            <div
              className="font-display leading-none tabular-nums mb-1"
              style={{
                fontSize: 'clamp(5rem, 22vw, 8rem)',
                color: cc1,
                textShadow: `0 0 60px color-mix(in srgb, ${cc1} 40%, transparent), 0 0 120px color-mix(in srgb, ${cc1} 20%, transparent)`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {player.careerGames ?? 0}
            </div>
            <div className="text-[11px] font-mono uppercase tracking-[0.3em] mb-6"
              style={{ color: `color-mix(in srgb, ${cc1} 55%, #9CA89F)` }}>
              Career games
            </div>

            {/* Player name + position */}
            <h1
              className="font-display text-center leading-none mb-1"
              style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)', color: '#F7FAF8', letterSpacing: '0.04em' }}
            >
              {player.name}
            </h1>
            <div className="flex items-center gap-2 mb-6">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#9CA89F' }}
              >
                {posLabel}
              </span>
              <span className="text-[10px] text-atext-mute">·</span>
              <span className="text-[10px] text-atext-mute">{player.age} years old</span>
            </div>

            {/* Stats grid */}
            <div
              className="w-full grid grid-cols-3 gap-px rounded-2xl overflow-hidden mb-6"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              {[
                { label: 'Games',   value: player.careerGames ?? 0 },
                { label: 'Goals',   value: player.careerGoals ?? 0 },
                { label: 'Seasons', value: player.seasons ?? Math.round((player.careerGames ?? 0) / 18) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-4"
                  style={{ background: 'rgba(10,13,12,0.92)' }}
                >
                  <div
                    className="font-display text-3xl leading-none tabular-nums"
                    style={{ color: '#F7FAF8', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {value}
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-[0.22em] mt-1"
                    style={{ color: '#5C6962' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Quote */}
            <p
              className="text-center italic leading-relaxed mb-8 px-2"
              style={{ fontSize: 13, color: '#9CA89F', maxWidth: 300 }}
            >
              {quote}
            </p>

            {/* Progress dots */}
            {farewells.length > 1 && (
              <div className="flex gap-1.5 mb-5">
                {farewells.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all"
                    style={{
                      width: i === idx ? 16 : 6,
                      height: 6,
                      background: i === idx ? cc1 : 'rgba(255,255,255,0.18)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleContinue}
              className="px-10 py-3 rounded-2xl font-display text-base uppercase tracking-[0.14em] transition-all active:scale-[0.97]"
              style={{
                background: cc1,
                color: '#0A0D0C',
                boxShadow: `0 6px 24px color-mix(in srgb, ${cc1} 35%, transparent)`,
              }}
            >
              {isLast ? 'Farewell' : 'Next'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom shimmer */}
      <div className="absolute bottom-0 inset-x-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${cc1} 35%, transparent), transparent)` }} />
    </div>
  );
}
