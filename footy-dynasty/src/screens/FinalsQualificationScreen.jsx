import React from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { css } from "../components/primitives.jsx";

export default function FinalsQualificationScreen({ qualification, club, onContinue }) {
  const pos = qualification?.position ?? "—";
  const suffix = pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th";

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(160deg, #0a1628 0%, #0F172A 50%, #1a2744 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center max-w-md anim-in">
        <div className="text-6xl mb-4">🏆</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-aaccent mb-2">
          {qualification?.leagueShort} Finals
        </div>
        <h1 className="font-display text-4xl text-white mb-3">YOU&apos;RE IN</h1>
        <p className="text-lg text-atext-dim mb-2">
          <span className="font-bold text-white">{club?.name}</span> finished{" "}
          <span className="text-aaccent font-display text-xl">{pos}{suffix}</span> of {qualification?.totalTeams}
        </p>
        <p className="text-sm text-atext-mute mb-8">
          Seed #{qualification?.seed} · {qualification?.firstRoundLabel} is next on the calendar.
        </p>
        <button type="button" onClick={onContinue} className={`${css.btnPrimary} px-8 py-3`}>
          Enter finals <ChevronRight className="w-4 h-4 inline ml-1" />
        </button>
      </div>
    </motion.div>
  );
}
