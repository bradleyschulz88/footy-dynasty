import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, FolderOpen, Zap, SlidersHorizontal } from "lucide-react";
import PrivacyScreen from "./PrivacyScreen.jsx";

const TAGLINES = [
  "Build a dynasty. Leave a legacy.",
  "Seven states. One flag. Your name on it.",
  "The suburban oval or the MCG — you decide.",
  "Every great dynasty started somewhere.",
];

export default function LandingScreen({ hasSaves, themeClass = 'dirV4', onQuickStart, onNewCareer, onLoadGame }) {
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
  const [ready, setReady] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (showPrivacy) {
    return (
      <div className={`${themeClass} font-sans`}>
        <PrivacyScreen onBack={() => setShowPrivacy(false)} />
      </div>
    );
  }

  return (
    <div
      className={`${themeClass} min-h-screen font-sans text-atext flex flex-col items-center justify-center relative overflow-hidden select-none`}
      style={{ background: 'var(--A-bg, #080c10)' }}
    >
      {/* Radial glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 30% 50%, color-mix(in srgb, var(--A-accent) 7%, transparent) 0%, transparent 100%),' +
            'radial-gradient(ellipse 50% 40% at 75% 60%, color-mix(in srgb, var(--A-accent-2) 5%, transparent) 0%, transparent 100%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,var(--A-line-2,#1e2a36) 0,var(--A-line-2,#1e2a36) 1px,transparent 1px,transparent 72px),' +
            'repeating-linear-gradient(90deg,var(--A-line-2,#1e2a36) 0,var(--A-line-2,#1e2a36) 1px,transparent 1px,transparent 72px)',
        }}
      />

      {/* Diagonal accent line */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(115deg, transparent 45%, color-mix(in srgb, var(--A-accent) 3%, transparent) 46%, color-mix(in srgb, var(--A-accent) 3%, transparent) 46.5%, transparent 47.5%)',
        }}
      />

      {/* Main content */}
      <AnimatePresence>
        {ready && (
          <motion.div
            className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Badge */}
            <motion.div
              className="flex items-center gap-2.5 mb-10"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))',
                  boxShadow: '0 0 24px color-mix(in srgb, var(--A-accent) 45%, transparent)',
                }}
              >
                <Trophy className="w-4 h-4" style={{ color: "var(--fd-on-accent, #0A0D0C)" }} />
              </div>
              <span className="text-[10px] uppercase tracking-[0.45em] text-aaccent font-mono font-bold">
                AFL Manager 2026
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-display leading-[0.9] mb-5"
              style={{ fontSize: 'clamp(4.5rem, 16vw, 10rem)' }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="block text-atext">FOOTY</span>
              <span
                className="block"
                style={{
                  color: 'var(--A-accent)',
                  textShadow:
                    '0 0 60px color-mix(in srgb, var(--A-accent) 35%, transparent),' +
                    '0 0 120px color-mix(in srgb, var(--A-accent) 20%, transparent)',
                }}
              >
                DYNASTY
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              className="text-atext-dim text-sm md:text-base mb-14 tracking-wide max-w-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ delay: 0.38, duration: 0.55 }}
            >
              {tagline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col gap-3 w-full max-w-xs sm:max-w-sm"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Quick Start — the hero, jumps straight into a game */}
              <motion.button
                type="button"
                onClick={onQuickStart}
                className="w-full py-4 px-6 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))',
                  color: 'var(--fd-on-accent, #0A0D0C)',
                  boxShadow:
                    '0 4px 20px color-mix(in srgb, var(--A-accent) 30%, transparent),' +
                    '0 1px 0 color-mix(in srgb, white 20%, transparent) inset',
                }}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Zap className="w-4 h-4" />
                Quick Start
              </motion.button>
              <p className="text-[10px] text-atext-mute -mt-1 mb-1 tracking-wide">
                Jump straight in with a community club — no setup.
              </p>

              {/* Secondary paths */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <motion.button
                  type="button"
                  onClick={onNewCareer}
                  className="flex-1 py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{
                    background: 'var(--A-panel, #111820)',
                    border: '1px solid var(--A-line, #1e2a36)',
                    color: 'var(--A-text, #e8edf4)',
                  }}
                  whileHover={{ scale: 1.03, y: -1, borderColor: 'var(--A-accent)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Custom Setup
                </motion.button>

                {hasSaves && (
                  <motion.button
                    type="button"
                    onClick={onLoadGame}
                    className="flex-1 py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    style={{
                      background: 'var(--A-panel, #111820)',
                      border: '1px solid var(--A-line, #1e2a36)',
                      color: 'var(--A-text, #e8edf4)',
                    }}
                    whileHover={{ scale: 1.03, y: -1, borderColor: 'var(--A-accent)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Load Game
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              className="flex items-center gap-4 mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {['7 States', 'Full Pyramid', 'AFL 2026'].map((label, i, arr) => (
                <React.Fragment key={label}>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">
                    {label}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="w-1 h-1 rounded-full bg-atext-mute opacity-50" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* Privacy Policy link */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="text-[10px] font-mono uppercase tracking-widest text-atext-mute hover:text-aaccent transition-colors"
              >
                Privacy Policy
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
