import React from "react";
import { motion } from "motion/react";
import { ChevronRight, Star } from "lucide-react";
import { css } from "../components/primitives.jsx";

export default function FinalsQualificationScreen({ qualification, club, onContinue }) {
  const pos = qualification?.position ?? "—";
  const suffix = pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th";

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 50% 10%, color-mix(in srgb, var(--A-accent) 8%, transparent) 0%, transparent 60%), linear-gradient(160deg, var(--A-bg) 0%, var(--A-bg-2) 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center max-w-md relative z-10">
        <motion.div
          className="text-7xl mb-4"
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
        >
          🏆
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] font-bold uppercase tracking-[0.35em] mb-3"
          style={{ color: "var(--A-accent)" }}
        >
          <Star className="w-3 h-3 inline mr-1 mb-0.5" />
          {qualification?.leagueShort} Finals
          <Star className="w-3 h-3 inline ml-1 mb-0.5" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="font-display leading-none mb-4"
          style={{
            fontSize: "clamp(3rem, 14vw, 5rem)",
            color: "var(--A-accent)",
            filter: "drop-shadow(0 0 20px color-mix(in srgb, var(--A-accent) 40%, transparent))",
          }}
        >
          YOU&apos;RE IN
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="text-lg text-atext-dim mb-2"
        >
          <span className="font-bold text-atext">{club?.name}</span> finished{" "}
          <span className="font-display text-2xl" style={{ color: "var(--A-accent)" }}>
            {pos}{suffix}
          </span>{" "}
          of {qualification?.totalTeams}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-atext-mute mb-8"
        >
          Seed #{qualification?.seed} · {qualification?.firstRoundLabel} is next on the calendar.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
          <button type="button" onClick={onContinue} className={`${css.btnPrimary} px-8 py-3`}>
            Enter finals <ChevronRight className="w-4 h-4 inline ml-1" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
