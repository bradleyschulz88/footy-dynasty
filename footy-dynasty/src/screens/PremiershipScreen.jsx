import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { Trophy, Star } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { fmtK } from "../lib/format.js";
import { PRIZE_MONEY } from "../lib/finance/constants.js";
import { playCrowdCheer, playSiren, soundEnabled } from "../lib/sound.js";
import { useCareer } from "../lib/careerStore.js";

function GoldParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: Math.random() * 2 + 0.5,
      size: Math.random() * 5 + 2,
      color: Math.random() > 0.5 ? "#FFD700" : "#C8FF3D",
      alpha: Math.random() * 0.8 + 0.2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
    }));

    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}

export default function PremiershipScreen({ moment, club, onContinue }) {
  const career = useCareer();
  const tier = moment?.leagueTier ?? 1;
  const prize = PRIZE_MONEY[tier]?.premiership ?? 0;

  // The biggest celebration in the game — a sustained confetti barrage from both
  // bottom corners over ~2.5s, plus the crowd roar and the final siren. Mount-only.
  useEffect(() => {
    const colors = ["#FFD700", "#FFF176", "#C8FF3D"];
    const bursts = [0, 350, 700, 1100, 1600, 2200];
    const timers = bursts.map((delay, i) =>
      setTimeout(() => {
        confetti({ particleCount: 140, spread: 75, startVelocity: 55, origin: { x: 0.1, y: 0.7 }, angle: 60, colors });
        confetti({ particleCount: 140, spread: 75, startVelocity: 55, origin: { x: 0.9, y: 0.7 }, angle: 120, colors });
        if (i === 0) {
          confetti({ particleCount: 90, spread: 120, startVelocity: 45, origin: { x: 0.5, y: 0.4 }, colors });
        }
      }, delay)
    );
    if (soundEnabled(career)) {
      playCrowdCheer(1.0);
      playSiren();
    }
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(255,215,0,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(200,255,61,0.06) 0%, transparent 50%), linear-gradient(165deg, #160f02 0%, var(--A-bg) 50%, var(--A-bg-2) 100%)",
      }}
    >
      <GoldParticles />

      {/* atmospheric ring */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 30%, rgba(255,215,0,0.08) 0%, transparent 100%)",
        }}
      />

      <motion.div
        className="relative text-center max-w-lg z-10"
        initial={{ scale: 0.88, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* trophy */}
        <motion.div
          className="text-8xl mb-6 block"
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.7, type: "spring", stiffness: 200 }}
        >
          🏆
        </motion.div>

        {/* league label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-[11px] font-bold uppercase tracking-[0.35em] mb-4"
          style={{ color: "#FFD700" }}
        >
          <Star className="w-3 h-3 inline mr-1 mb-0.5" />
          {moment?.leagueShort} · Season {moment?.season}
          <Star className="w-3 h-3 inline ml-1 mb-0.5" />
        </motion.div>

        {/* PREMIERS headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="font-display leading-none mb-3"
          style={{
            fontSize: "clamp(4rem, 16vw, 6rem)",
            background: "linear-gradient(135deg, #FFD700 0%, #FFF176 45%, #FFD700 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(0 0 24px rgba(255,215,0,0.5))",
          }}
        >
          PREMIERS
        </motion.h1>

        {/* club name */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="text-2xl font-display mb-2"
          style={{ color: "var(--A-accent)" }}
        >
          {club?.name || moment?.clubName}
        </motion.p>

        {/* flavour text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-atext-dim leading-relaxed mb-8 max-w-sm mx-auto"
        >
          The siren sounds. The flag is yours.{" "}
          <span className="text-atext">{moment?.leagueName}</span> champions for{" "}
          <span className="text-atext">{moment?.season}</span>.
        </motion.p>

        {/* prize money */}
        {prize > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 }}
            className="rounded-2xl px-6 py-4 mb-8 inline-block"
            style={{
              background: "rgba(255, 215, 0, 0.07)",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              boxShadow: "0 0 32px rgba(255,215,0,0.08) inset",
            }}
          >
            <div className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1">
              Prize money
            </div>
            <div
              className="font-display text-4xl"
              style={{ color: "#FFD700", filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))" }}
            >
              +{fmtK(prize)}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <button
            type="button"
            onClick={onContinue}
            className={`${css.btnPrimary} px-10 py-3 text-sm`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Continue to trade period
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
