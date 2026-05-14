import React from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { fmtK } from "../lib/format.js";
import { PRIZE_MONEY } from "../lib/finance/constants.js";

export default function PremiershipScreen({ moment, club, onContinue }) {
  const tier = moment?.leagueTier ?? 1;
  const prize = PRIZE_MONEY[tier]?.premiership ?? 0;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(165deg, #1a1208 0%, #0F172A 45%, #1E293B 100%)" }}
    >
      <motion.div
        className="text-center max-w-lg anim-in"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-7xl mb-6"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          🏆
        </motion.div>
        <div
          className="text-[11px] font-bold uppercase tracking-[0.35em] mb-3"
          style={{ color: "#FFD700" }}
        >
          {moment?.leagueShort} · Season {moment?.season}
        </div>
        <h1 className="font-display text-5xl md:text-6xl text-white mb-2">PREMIERS</h1>
        <p className="text-xl text-amber-200/90 font-semibold mb-6">{club?.name || moment?.clubName}</p>
        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          The siren sounds. The flag is yours. {moment?.leagueName} champions for {moment?.season}.
        </p>
        {prize > 0 && (
          <div
            className="rounded-2xl px-6 py-4 mb-8 inline-block"
            style={{ background: "rgba(255, 215, 0, 0.08)", border: "1px solid rgba(255, 215, 0, 0.35)" }}
          >
            <div className="text-[10px] uppercase tracking-widest text-amber-400/80">Prize money</div>
            <div className="font-display text-3xl text-[#FFD700]">+{fmtK(prize)}</div>
          </div>
        )}
        <button type="button" onClick={onContinue} className={`${css.btnPrimary} px-10 py-3 text-sm`}>
          <Trophy className="w-4 h-4 inline mr-2" />
          Continue to trade period
        </button>
      </motion.div>
    </div>
  );
}
