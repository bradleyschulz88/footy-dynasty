// ---------------------------------------------------------------------------
// PlayerCard3D — premium trading-card style player header.
// Hover tilts the card in 3D with a holographic shimmer that tracks the
// cursor; click/tap flips it to reveal the full attribute sheet.
// Pure presentation: all interactivity is local, no career state touched.
// ---------------------------------------------------------------------------
import React, { useRef, useState } from "react";
import { POSITION_NAMES } from "../lib/playerGen.js";
import { fmtK } from "../lib/format.js";

const ATTRS = [
  ["kicking", "Kick"],
  ["handball", "Handball"],
  ["marking", "Marking"],
  ["speed", "Speed"],
  ["tackling", "Tackle"],
  ["endurance", "Endurance"],
  ["strength", "Strength"],
  ["decision", "Decision"],
];

function attrColor(v) {
  if (v >= 85) return "var(--A-pos)";
  if (v >= 70) return "var(--A-accent)";
  if (v >= 55) return "var(--A-accent-2)";
  return "var(--A-neg)";
}

export default function PlayerCard3D({ player, club }) {
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const holoRef = useRef(null);
  const [flipped, setFlipped] = useState(false);

  const pName = player.firstName ? `${player.firstName} ${player.lastName}` : (player.name || "Player");
  const c0 = club?.colors?.[0] ?? "#0d3060";
  const c1 = club?.colors?.[1] ?? "#06205a";
  const attrs = player.attrs || {};
  const topAttrs = ATTRS
    .map(([key, label]) => ({ key, label, value: attrs[key] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const onMove = (e) => {
    if (flipped) return;
    const card = cardRef.current;
    const holo = holoRef.current;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!card || !rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nx = x / rect.width - 0.5;
    const ny = y / rect.height - 0.5;
    card.style.transition = "transform 0.08s ease";
    card.style.transform = `perspective(900px) rotateX(${(-ny * 12).toFixed(2)}deg) rotateY(${(nx * 12).toFixed(2)}deg) scale3d(1.015,1.015,1.015)`;
    if (holo) {
      const hx = ((x / rect.width) * 100).toFixed(1);
      const hy = ((y / rect.height) * 100).toFixed(1);
      const angle = (nx * 360 + 180).toFixed(1);
      holo.style.background = `conic-gradient(from ${angle}deg at ${hx}% ${hy}%, rgba(255,0,128,0.16), rgba(255,180,0,0.14), rgba(0,255,128,0.14), rgba(0,200,255,0.14), rgba(160,0,255,0.14), rgba(255,0,128,0.16))`;
      holo.style.opacity = "1";
    }
  };

  const onLeave = () => {
    const card = cardRef.current;
    const holo = holoRef.current;
    if (card) {
      card.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
      card.style.transform = flipped ? "perspective(900px) rotateY(180deg)" : "perspective(900px)";
    }
    if (holo) holo.style.opacity = "0";
  };

  const onFlip = () => {
    const next = !flipped;
    setFlipped(next);
    const card = cardRef.current;
    if (card) {
      card.style.transition = "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)";
      card.style.transform = next ? "perspective(900px) rotateY(180deg)" : "perspective(900px)";
    }
    const holo = holoRef.current;
    if (holo) holo.style.opacity = "0";
  };

  const face = "absolute inset-0 rounded-2xl overflow-hidden border border-aline";

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFlip(); } }}
      aria-label={`${pName} player card — activate to flip`}
      className="relative w-full cursor-pointer select-none"
      style={{ height: 230, perspective: 900 }}
    >
      <div
        ref={cardRef}
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ── FRONT ── */}
        <div className={face} style={{ backfaceVisibility: "hidden", background: "var(--A-panel)" }}>
          {/* Club colour header band */}
          <div className="h-[68px] relative" style={{ background: `linear-gradient(160deg, ${c0} 0%, ${c1} 100%)` }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 80% at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
            <div
              className="absolute bottom-[-1px] left-0 right-0 h-6"
              style={{ background: "var(--A-panel)", clipPath: "polygon(0 65%, 100% 0%, 100% 100%, 0% 100%)" }}
            />
            <div className="absolute top-2.5 left-3 text-[8px] font-mono font-bold uppercase tracking-[0.18em] text-white/60">
              {club?.name ?? ""}
            </div>
          </div>

          <div className="px-4 pb-3 -mt-2 relative">
            <div className="flex items-start gap-2.5">
              <div className="font-display leading-none text-atext" style={{ fontSize: 54, letterSpacing: "-0.04em" }}>
                {player.overall}
              </div>
              <div className="flex flex-col gap-1 pt-1.5">
                <span className="inline-flex self-start px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-[0.12em]"
                  style={{ background: "color-mix(in srgb, var(--A-accent) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--A-accent) 35%, transparent)", color: "var(--A-accent)" }}>
                  {POSITION_NAMES[player.position] ?? player.position}
                </span>
                <span className="text-[7.5px] font-mono font-semibold uppercase tracking-[0.14em] text-atext-mute">Overall</span>
              </div>
            </div>

            <div className="font-display text-base text-atext leading-tight mt-0.5 truncate">{pName}</div>
            <div className="text-[10px] text-atext-dim mb-2">
              Age {player.age} · {player.contract}yr · {fmtK(player.wage)}/yr
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {topAttrs.map(({ key, label, value }) => (
                <div key={key} className="rounded-lg px-1.5 py-1 text-center" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
                  <div className="text-[7px] font-mono font-bold uppercase tracking-wider text-atext-mute truncate">{label}</div>
                  <div className="text-[13px] font-display leading-tight" style={{ color: attrColor(value) }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Holographic shimmer */}
          <div ref={holoRef} className="absolute inset-0 rounded-2xl pointer-events-none" style={{ mixBlendMode: "color-dodge", opacity: 0, transition: "opacity 0.4s" }} />

          <div className="absolute bottom-1.5 right-2.5 text-[7.5px] font-mono uppercase tracking-[0.14em] text-atext-mute opacity-70">
            Tap to flip
          </div>
        </div>

        {/* ── BACK ── */}
        <div className={face} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--A-panel)" }}>
          <div className="p-3.5 h-full flex flex-col">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <div className="font-display text-sm text-atext truncate">{pName}</div>
              <div className="text-[8px] font-mono uppercase tracking-widest text-atext-mute shrink-0">Attributes</div>
            </div>
            <div className="flex-1 flex flex-col justify-between gap-[3px]">
              {[
                ...ATTRS,
                // Specialist stats — only shown for the relevant position.
                ...(player.position === "RU" || player.secondaryPosition === "RU"
                  ? [["ruckwork", "Ruckwork"]]
                  : []),
                ...(["KF", "HF"].includes(player.position) || ["KF", "HF"].includes(player.secondaryPosition)
                  ? [["goalkicking", "Goalkicking"]]
                  : []),
              ].map(([key, label]) => {
                const v = (key === "ruckwork" ? player.ruckwork : key === "goalkicking" ? player.goalkicking : attrs[key]) ?? 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-[8px] font-mono font-bold uppercase tracking-wider text-atext-dim w-14 shrink-0">{label}</div>
                    <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: "var(--A-line)" }}>
                      <div className="h-full rounded-full" style={{ width: `${v}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${attrColor(v)} 70%, transparent), ${attrColor(v)})` }} />
                    </div>
                    <div className="text-[10px] font-display w-6 text-right" style={{ color: attrColor(v) }}>{v}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
