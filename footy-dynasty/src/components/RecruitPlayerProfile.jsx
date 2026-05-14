import React from "react";
import { X } from "lucide-react";
import { POSITION_NAMES } from "../lib/playerGen.js";
import { fmtK } from "../lib/format.js";
import { RatingDot, Pill } from "./primitives.jsx";

const ATTR_COLORS = {
  kicking: "#4ADBE8",
  marking: "#4AE89A",
  handball: "#A78BFA",
  tackling: "#E84A6F",
  speed: "var(--A-accent)",
  endurance: "#4AE89A",
  strength: "#E84A6F",
  decision: "#4ADBE8",
};

function statusColor(label, v) {
  if (label === "Morale") return v >= 75 ? "#4AE89A" : "var(--A-accent)";
  if (v >= 75) return "#4AE89A";
  if (v >= 55) return "var(--A-accent)";
  return "#E84A6F";
}

/** Shared recruit-market player profile (trade pool, offers, free agents). */
export default function RecruitPlayerProfile({ player, onClose, listedFee, fromClub, subtitle }) {
  if (!player) return null;
  const pName = player.firstName
    ? `${player.firstName} ${player.lastName}`
    : (player.name || "Player");
  const attrs = player.attrs || {};
  const careerLog = player.careerLog || [];
  const seller = fromClub || player.fromClub;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
      <div className="p-4" style={{ background: "linear-gradient(135deg, var(--A-panel), var(--A-panel-2))" }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-dim mb-0.5">
              {POSITION_NAMES[player.position]}
              {player.secondaryPosition ? ` · ${POSITION_NAMES[player.secondaryPosition]}` : ""}
            </div>
            <h3 className="font-display text-2xl text-atext leading-tight truncate">{pName.toUpperCase()}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-atext-dim">Age {player.age}</span>
              {player.contract != null && (
                <>
                  <span className="text-aline-2">·</span>
                  <span className="text-[11px] text-atext-dim">{player.contract}yr</span>
                </>
              )}
              <span className="text-aline-2">·</span>
              <span className="text-[11px] text-atext-dim">{fmtK(player.wage)}/yr</span>
              {seller && (
                <>
                  <span className="text-aline-2">·</span>
                  <span className="text-[11px] text-atext-dim">{seller}</span>
                </>
              )}
              {listedFee != null && <Pill color="#4ADBE8">Fee {fmtK(listedFee)}</Pill>}
            </div>
            {subtitle && <p className="text-[11px] text-atext-mute mt-1">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-atext-mute hover:text-atext hover:bg-apanel-2 border border-transparent hover:border-aline transition-colors touch-manipulation"
                aria-label="Close profile"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="flex flex-col items-center gap-1.5">
              <RatingDot value={player.overall} size="lg" />
              {player.potential != null && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#4AE89A14", color: "#4AE89A", border: "1px solid #4AE89A30" }}>
                  Pot {player.potential}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[["Form", player.form ?? 60], ["Fitness", player.fitness ?? 80], ["Morale", player.morale ?? 70]].map(([l, v]) => {
            const c = statusColor(l, v);
            return (
              <div key={l} className="rounded-xl p-2.5 text-center" style={{ background: "var(--A-panel-2)" }}>
                <div className="text-[8px] font-black uppercase tracking-widest text-atext-mute">{l}</div>
                <div className="font-display text-2xl leading-tight" style={{ color: c }}>{v}</div>
                <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "var(--A-line)" }}>
                  <div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} />
                </div>
              </div>
            );
          })}
        </div>

        {(player.injured > 0 || player.gamesPlayed > 0) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {player.gamesPlayed > 0 && <Pill color="var(--A-accent)">{player.gamesPlayed} career games</Pill>}
            {player.injured > 0 && <Pill color="#E84A6F">Injured {player.injured}w</Pill>}
          </div>
        )}
      </div>

      {Object.keys(attrs).length > 0 && (
        <div className="p-4" style={{ borderTop: "1px solid var(--A-line)" }}>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Attributes</div>
          <div className="space-y-2.5">
            {Object.entries(attrs).map(([k, v]) => {
              const color = ATTR_COLORS[k] || "var(--A-accent)";
              return (
                <div key={k} className="flex items-center gap-2">
                  <div className="text-[11px] capitalize font-semibold text-[#8A9AB8] w-20 flex-shrink-0">{k}</div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--A-line)" }}>
                    <div className="h-full rounded-full" style={{ width: `${v}%`, background: `linear-gradient(90deg,${color}88,${color})` }} />
                  </div>
                  <div className="text-[12px] font-black w-7 text-right" style={{ color }}>{v}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--A-line)", paddingTop: "1rem" }}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Season stats</div>
        <div className="grid grid-cols-4 gap-2">
          {[["G", player.goals ?? 0, "#4AE89A"], ["B", player.behinds ?? 0, "var(--A-accent)"], ["DSP", player.disposals ?? 0, "#4ADBE8"], ["M", player.marks ?? 0, "#A78BFA"]].map(([l, v, c]) => (
            <div key={l} className="rounded-xl p-2.5 text-center" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: c }}>{l}</div>
              <div className="font-display text-2xl leading-tight text-atext">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {careerLog.length > 0 && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--A-line)", paddingTop: "1rem" }}>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Career log</div>
          <div className="space-y-2">
            {careerLog.map((row) => (
              <div
                key={`${row.season}-${row.club}`}
                className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)" }}
              >
                <span className="text-atext-dim font-mono">{row.season}</span>
                <span className="text-atext font-semibold truncate mx-2">{row.club}</span>
                <span className="text-atext-mute shrink-0">{row.games}g · {row.goals}gls · {row.disposals}dsp</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
