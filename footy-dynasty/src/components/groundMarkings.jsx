// ---------------------------------------------------------------------------
// Shared AFL ground rendering. OvalMarkings is the pure SVG (oval, centre
// square, 50m arcs, goal + behind posts, zone tints) reused by the interactive
// squad field and this read-only GroundFormation. GroundFormation shows a
// starting line-up on a large oval with no drag — used on match day so the live
// game presents the same big ground as the Squad screen.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import {
  LINEUP_SLOT_ROLES,
  LINEUP_OVAL_SLOT_COUNT,
  LINEUP_FIELD_COUNT,
  LINEUP_INTERCHANGE_COUNT,
} from "../lib/lineupHelpers.js";
import { StarRating } from "./primitives.jsx";

const ROWS_BACK_TO_FWD = ["B", "HB", "C", "HF", "F"];
const FOLLOWER_ROLES = ["Ruck", "Rover", "Ruck-Rover"];

function zoneLineColor(zone) {
  if (zone === "B" || zone === "HB") return "#2A65C8";
  if (zone === "C") return "#1A7A45";
  if (zone === "HF" || zone === "F") return "#C84040";
  if (zone === "RUCK") return "#8B60D0";
  return "rgba(255,255,255,0.3)";
}

function shortName(p) {
  const a = p.firstName?.[0] || "";
  const last = p.lastName || (p.name && String(p.name).split(/\s+/).pop()) || "";
  if (a && last) return `${a}. ${last}`;
  return p.name || "Player";
}

function squadNumberDisplay(p) {
  if (p.number != null && p.number !== "") return String(p.number);
  const s = String(p.id ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 997;
  return String((h % 44) + 1);
}

/** Pure AFL oval field markings in a 100×100 viewBox. */
export function OvalMarkings() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <ellipse cx="50" cy="50" rx="40" ry="48" fill="rgba(14,58,26,0.88)" />
      <ellipse cx="50" cy="50" rx="40" ry="48" fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="0.75" />
      <ellipse cx="50" cy="50" rx="40" ry="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
      <rect x="37" y="44.5" width="26" height="11" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" rx="0.5" />
      <ellipse cx="50" cy="50" rx="10" ry="10" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
      <circle cx="50" cy="50" r="1.4" fill="rgba(255,255,255,0.42)" />
      <path d="M12 30 Q50 39 88 30" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55" />
      <path d="M12 70 Q50 61 88 70" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55" />
      <rect x="39" y="3" width="22" height="6" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <line x1="33" y1="3.5" x2="33" y2="8" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <line x1="39" y1="2.5" x2="39" y2="9" stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
      <line x1="61" y1="2.5" x2="61" y2="9" stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
      <line x1="67" y1="3.5" x2="67" y2="8" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <rect x="39" y="91" width="22" height="6" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <line x1="33" y1="92" x2="33" y2="96.5" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <line x1="39" y1="91" x2="39" y2="97.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
      <line x1="61" y1="91" x2="61" y2="97.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
      <line x1="67" y1="92" x2="67" y2="96.5" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
      <ellipse cx="50" cy="24" rx="36" ry="18" fill="rgba(42,101,200,0.10)" />
      <ellipse cx="50" cy="76" rx="36" ry="18" fill="rgba(200,64,64,0.10)" />
    </svg>
  );
}

// Static (non-drag) player chip — guernsey number hero + star tier + name.
function ReadOnlyChip({ player, slotLabel, zone }) {
  if (!player) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded border border-dashed"
        style={{ borderColor: "rgba(255,255,255,0.18)" }}
      >
        <span className="text-[6px] font-mono uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{slotLabel}</span>
      </div>
    );
  }
  const lineCol = zoneLineColor(zone);
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden rounded"
      style={{ background: `linear-gradient(180deg, ${lineCol}55 0%, ${lineCol}28 55%, rgba(8,16,32,0.94) 100%)`, padding: "2px 3px" }}
    >
      <div className="flex items-center justify-between w-full shrink-0">
        <span className="text-[6px] font-mono font-bold uppercase leading-none tracking-wide" style={{ color: `${lineCol}DD` }}>{slotLabel}</span>
        <StarRating overall={player.overall} size={6} />
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <span
          className="font-black leading-none"
          style={{ fontSize: "clamp(16px, 4.4vh, 44px)", color: "rgba(255,255,255,0.97)", textShadow: `0 2px 12px ${lineCol}AA, 0 0 4px rgba(0,0,0,0.6)`, letterSpacing: "-0.02em" }}
        >
          {squadNumberDisplay(player)}
        </span>
      </div>
      <div className="w-full shrink-0 overflow-hidden px-0.5 mb-0.5">
        <span className="block truncate text-center leading-none font-medium" style={{ fontSize: "clamp(5px, 1.5vh, 7px)", color: "rgba(210,225,255,0.60)" }}>
          {shortName(player)}
        </span>
      </div>
    </div>
  );
}

// Small chip for followers / interchange rows below the oval.
function BenchLikeChip({ player, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-aline bg-apanel-2 px-1.5 py-1.5 min-w-0">
      <span className="text-[8px] font-mono uppercase tracking-wider text-atext-mute leading-none truncate max-w-full">{label}</span>
      {player ? (
        <>
          <span className="text-sm font-black text-atext leading-tight">{squadNumberDisplay(player)}</span>
          <span className="text-[8px] text-atext-dim truncate max-w-[64px]">{shortName(player)}</span>
          <StarRating overall={player.overall} size={7} />
        </>
      ) : (
        <span className="text-[10px] text-atext-mute">—</span>
      )}
    </div>
  );
}

/**
 * Read-only line-up on a large oval. `lineupIds[slot]` maps to a squad player;
 * slots 0–14 are the oval grid (B→F), then followers, then interchange.
 */
export function GroundFormation({ squad, lineupIds, className = "" }) {
  const byId = useMemo(() => new Map((squad || []).map((p) => [p.id, p])), [squad]);
  const slotPlayer = (idx) => {
    const raw = lineupIds?.[idx];
    if (raw == null || raw === "") return null;
    return byId.get(raw) || null;
  };

  return (
    <div className={className}>
      <div
        className="relative mx-auto rounded-xl overflow-hidden"
        style={{ aspectRatio: "4 / 5", width: "min(100%, 62vh)", background: "#0d2818" }}
      >
        <OvalMarkings />

        {/* Zone labels at left edge */}
        <div className="absolute left-0 top-[11%] bottom-[11%] w-[10%] z-[3] flex flex-col pointer-events-none" aria-hidden>
          {ROWS_BACK_TO_FWD.map((label) => (
            <div key={label} className="flex-1 flex items-center justify-center">
              <span className="text-[7px] font-mono font-black uppercase leading-none" style={{ color: "rgba(255,255,255,0.28)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* End labels */}
        <div className="absolute top-[1%] inset-x-0 flex justify-center z-[3] pointer-events-none">
          <span className="text-[7px] font-black uppercase tracking-[0.22em] px-2 py-0.5 rounded-full" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.10)" }}>Back 50</span>
        </div>
        <div className="absolute bottom-[1%] inset-x-0 flex justify-center z-[3] pointer-events-none">
          <span className="text-[7px] font-black uppercase tracking-[0.22em] px-2 py-0.5 rounded-full" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.10)" }}>Forward 50</span>
        </div>

        {/* 5×3 player grid */}
        <div className="absolute z-[2] flex flex-col gap-[3px]" style={{ top: "11%", right: "8%", bottom: "11%", left: "18%" }}>
          {ROWS_BACK_TO_FWD.map((zone, r) => (
            <div key={zone} className="flex-1 flex gap-[3px] min-h-0">
              {[0, 1, 2].map((col) => {
                const idx = r * 3 + col;
                return (
                  <div key={idx} className="flex-1 min-w-0 min-h-0">
                    <ReadOnlyChip player={slotPlayer(idx)} slotLabel={LINEUP_SLOT_ROLES[idx]} zone={zone} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Followers + interchange as compact rows below the oval */}
      <div className="mt-3">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-atext-mute mb-1">Followers</div>
        <div className="grid grid-cols-3 gap-2">
          {FOLLOWER_ROLES.map((role, k) => (
            <BenchLikeChip key={role} player={slotPlayer(LINEUP_OVAL_SLOT_COUNT + k)} label={role} />
          ))}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-atext-mute mb-1">Interchange</div>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: LINEUP_INTERCHANGE_COUNT }, (_, j) => (
            <BenchLikeChip key={j} player={slotPlayer(LINEUP_FIELD_COUNT + j)} label={`IC${j + 1}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
