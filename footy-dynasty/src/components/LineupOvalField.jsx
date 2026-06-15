import React, { useCallback, useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  LINEUP_CAP,
  LINEUP_FIELD_COUNT,
  LINEUP_FOLLOWERS_COUNT,
  LINEUP_INTERCHANGE_COUNT,
  LINEUP_OVAL_SLOT_COUNT,
} from "../lib/lineupHelpers.js";
import { css } from "./primitives.jsx";

// AFL position labels for each of the 15 field slots (rows B→HB→C→HF→F, cols L/C/R)
const SLOT_LABELS = [
  "BP",  "FB",  "BP",   // B  row  slots 0-2
  "HBF", "CHB", "HBF",  // HB row  slots 3-5
  "WG",  "C",   "WG",   // C  row  slots 6-8
  "HFF", "CHF", "HFF",  // HF row  slots 9-11
  "FP",  "FF",  "FP",   // F  row  slots 12-14
];

const ROWS_BACK_TO_FWD = [
  { key: "B",  label: "B"  },
  { key: "HB", label: "HB" },
  { key: "C",  label: "C"  },
  { key: "HF", label: "HF" },
  { key: "F",  label: "F"  },
];

// Zone tints are used for non-oval slots (followers / IC)
function zoneTintBg(zone) {
  switch (zone) {
    case "B":    return "rgba(74,232,154,0.08)";
    case "HB":   return "rgba(74,232,154,0.04)";
    case "C":    return "color-mix(in srgb, var(--A-accent) 6%, transparent)";
    case "HF":   return "rgba(232,212,74,0.04)";
    case "F":    return "rgba(232,74,111,0.08)";
    case "RUCK": return "rgba(167,139,250,0.07)";
    default:     return "transparent";
  }
}

const ZONE_POSITIONS = {
  B:    new Set(["KB", "UT"]),
  HB:   new Set(["HB", "KB", "WG", "UT"]),
  C:    new Set(["C", "R", "WG", "UT"]),
  HF:   new Set(["HF", "KF", "WG", "UT"]),
  F:    new Set(["KF", "HF", "UT"]),
  RUCK: new Set(["RU", "KB", "UT"]),
  IC:   null,
};

function positionFitsZone(position, zone) {
  if (!zone || zone === "IC") return true;
  const allowed = ZONE_POSITIONS[zone];
  if (!allowed) return true;
  return allowed.has(position);
}

const FOLLOWER_ROLES = ["Ruck", "Rover", "Ruck-Rover"];

function ratingColor(ovr) {
  if (ovr >= 85) return "#4AE89A";
  if (ovr >= 75) return "#4ADBE8";
  if (ovr >= 65) return "var(--A-accent)";
  if (ovr >= 55) return "#E8D44A";
  return "#E84A6F";
}

function formBorderColor(form) {
  if (form >= 70) return "rgba(74,232,154,0.80)";
  if (form >= 45) return "rgba(255,255,255,0.38)";
  return "rgba(232,212,74,0.80)";
}

function initials(p) {
  const a = p.firstName?.[0] || "";
  const b = p.lastName?.[0] || "";
  return (a + b || "?").toUpperCase();
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

function mergeRefs(...refs) {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

// ── Compact ground position chip (oval slots 0-14) ─────────────────────────────

function GroundPlayerChip({ player, stitch, slotLabel, onSelectPlayer, dragProps }) {
  const { listeners, attributes } = dragProps;
  const num = squadNumberDisplay(player);
  const ovrColor = ratingColor(player.overall);
  const fBorder = formBorderColor(player.form ?? 60);

  return (
    <button
      type="button"
      className="w-full h-full flex flex-col cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        background: stitch ? "rgba(4,12,6,0.85)" : "rgba(6,12,20,0.82)",
        borderLeft: `3px solid ${fBorder}`,
        paddingLeft: "4px",
        paddingRight: "3px",
        paddingTop: "3px",
        paddingBottom: "3px",
      }}
      {...listeners}
      {...attributes}
      onClick={() => onSelectPlayer?.(player)}
    >
      {/* Position label + OVR badge */}
      <div className="flex items-center justify-between w-full shrink-0">
        <span
          className="text-[6px] font-mono font-bold uppercase leading-none tracking-wide"
          style={{ color: stitch ? "rgba(200,255,61,0.42)" : "rgba(255,255,255,0.36)" }}
        >
          {slotLabel}
        </span>
        <span
          className="text-[7px] font-mono font-black leading-none"
          style={{ color: ovrColor }}
        >
          {player.overall}
        </span>
      </div>
      {/* Large initials */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <span
          className="font-black leading-none tracking-tight"
          style={{
            fontSize: "clamp(13px, 4.5vw, 18px)",
            color: stitch ? "rgba(200,255,61,0.92)" : "rgba(255,255,255,0.92)",
          }}
        >
          {initials(player)}
        </span>
      </div>
      {/* Squad number + short name */}
      <div className="flex items-center gap-0.5 w-full shrink-0 overflow-hidden">
        <span
          className="font-bold shrink-0 leading-none"
          style={{ fontSize: "clamp(5px, 1.5vw, 6px)", color: "rgba(176,140,230,0.88)" }}
        >
          #{num}
        </span>
        <span
          className="truncate leading-none font-semibold"
          style={{
            fontSize: "clamp(5px, 1.8vw, 7px)",
            color: stitch ? "rgba(200,255,61,0.54)" : "rgba(255,255,255,0.60)",
          }}
        >
          {shortName(player)}
        </span>
      </div>
    </button>
  );
}

// ── Large card body for followers / interchange ────────────────────────────────

function LargePlayerCardBody({ player, stitch, onSelectPlayer, dragProps }) {
  const { listeners, attributes } = dragProps;
  const num = squadNumberDisplay(player);
  const ovrColor = ratingColor(player.overall);
  const fBorder = formBorderColor(player.form ?? 60);
  const circle = "w-12 h-12 sm:w-14 sm:h-14";

  if (stitch) {
    return (
      <button
        type="button"
        className="w-full min-w-0 h-full flex flex-col items-center justify-center py-0.5 cursor-grab active:cursor-grabbing text-left"
        {...listeners}
        {...attributes}
        onClick={() => onSelectPlayer?.(player)}
      >
        <div className="relative shrink-0">
          <div
            className={`relative z-[1] rounded-full border-2 shadow-md flex items-center justify-center bg-gradient-to-b from-[#1a2820] to-[#0d1510] ${circle}`}
            style={{ borderColor: fBorder }}
          >
            <span className="font-black text-[rgba(200,255,61,0.95)] tracking-wide text-xs sm:text-sm">{initials(player)}</span>
          </div>
          <span
            className="absolute -top-1 -right-1 z-[3] text-[7px] font-black leading-none px-0.5 rounded"
            style={{ background: `${ovrColor}22`, color: ovrColor, border: `1px solid ${ovrColor}55` }}
          >
            {player.overall}
          </span>
        </div>
        <div
          className="relative z-[2] w-full min-w-0 -mt-2 rounded-md border border-[rgba(200,255,61,0.35)] bg-[rgba(10,14,10,0.92)] shadow-md flex overflow-hidden max-w-[6.25rem]"
        >
          <span className="shrink-0 flex items-center justify-center self-stretch bg-[rgba(90,60,120,0.98)] font-black text-white w-6 sm:w-7 text-[9px] sm:text-[10px]">
            {num}
          </span>
          <span className="flex-1 min-w-0 px-0.5 py-0.5 font-semibold text-white/95 text-[8px] sm:text-[10px] leading-snug">
            <span className="line-clamp-2 break-words [overflow-wrap:anywhere]">{shortName(player)}</span>
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="w-full min-w-0 h-full flex flex-col items-center justify-center py-0.5 cursor-grab active:cursor-grabbing text-left"
      {...listeners}
      {...attributes}
      onClick={() => onSelectPlayer?.(player)}
    >
      <div className="relative shrink-0">
        <div
          className={`relative z-[1] rounded-full border-2 shadow-md flex items-center justify-center bg-gradient-to-b from-[#f1f5f9] to-[#cbd5e1] ${circle}`}
          style={{ borderColor: fBorder }}
        >
          <span className="font-black text-slate-700 tracking-wide text-xs sm:text-sm">{initials(player)}</span>
        </div>
        <span
          className="absolute -top-1 -right-1 z-[3] text-[7px] font-black leading-none px-0.5 rounded"
          style={{ background: `${ovrColor}22`, color: ovrColor, border: `1px solid ${ovrColor}55` }}
        >
          {player.overall}
        </span>
      </div>
      <div className="relative z-[2] w-full min-w-0 -mt-2 rounded-md border border-slate-200/90 bg-white shadow-sm flex overflow-hidden max-w-[6.25rem]">
        <span className="shrink-0 flex items-center justify-center self-stretch bg-[#3d1f4d] font-black text-white w-6 sm:w-7 text-[9px] sm:text-[10px]">
          {num}
        </span>
        <span className="flex-1 min-w-0 px-0.5 py-0.5 font-semibold text-slate-900 text-[8px] sm:text-[10px] leading-snug">
          <span className="line-clamp-2 break-words [overflow-wrap:anywhere]">{shortName(player)}</span>
        </span>
      </div>
    </button>
  );
}

// ── Empty slot ─────────────────────────────────────────────────────────────────

const EmptyLineupSlot = React.memo(function EmptyLineupSlot({ slotIndex, stitch, compact, zone, slotLabel }) {
  const dropId = `lineup-slot-${slotIndex}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        className="w-full h-full flex flex-col items-center justify-center rounded border border-dashed gap-0.5 touch-manipulation"
        style={{
          borderColor: isOver
            ? (stitch ? "rgba(200,255,61,0.65)" : "var(--A-accent)")
            : (stitch ? "rgba(200,255,61,0.26)" : "rgba(255,255,255,0.26)"),
          background: isOver ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.20)",
        }}
      >
        <span
          className="text-[7px] font-mono font-bold uppercase leading-none tracking-wide"
          style={{ color: stitch ? "rgba(200,255,61,0.35)" : "rgba(255,255,255,0.35)" }}
        >
          {slotLabel}
        </span>
        <span
          className="text-[10px] font-light leading-none"
          style={{ color: stitch ? "rgba(200,255,61,0.25)" : "rgba(255,255,255,0.25)" }}
        >
          +
        </span>
      </div>
    );
  }

  // Non-compact (followers / IC)
  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.65)] shadow-[0_0_12px_rgba(200,255,61,0.2)]"
      : "border-[rgba(200,255,61,0.35)]"
    : isOver
      ? "border-aaccent ring-2 ring-aaccent/35"
      : "border-white/35";

  return (
    <div
      ref={setNodeRef}
      className={`min-w-0 max-w-full h-full max-h-full flex flex-col items-center justify-center py-0.5 touch-manipulation rounded-lg border-2 border-dashed ${border}`}
      style={{ background: stitch ? "rgba(0,0,0,0.12)" : zoneTintBg(zone) }}
    >
      <div className={`rounded-full border-2 border-dashed opacity-50 w-12 h-12 sm:w-14 sm:h-14 ${stitch ? "border-[rgba(200,255,61,0.35)]" : "border-white/50"}`} />
      <div
        className={`w-full max-w-[6.25rem] -mt-1.5 rounded-md border border-dashed px-0.5 py-1 text-center ${
          stitch ? "border-[rgba(200,255,61,0.25)] text-[rgba(200,255,61,0.45)]" : "border-white/35 text-white/70"
        }`}
      >
        <span className="text-[7px] font-bold uppercase tracking-wide">Add</span>
      </div>
    </div>
  );
});

// ── Filled slot ────────────────────────────────────────────────────────────────

const FilledLineupSlot = React.memo(function FilledLineupSlot({
  slotIndex, player, stitch, onSelectPlayer, compact, zone, slotLabel,
}) {
  const dropId = `lineup-slot-${slotIndex}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: String(player.id) });
  const setRefs = mergeRefs(setDropRef, setDragRef);

  const outOfPos = zone && zone !== "IC" && player.position
    ? !positionFitsZone(player.position, zone)
    : false;

  if (compact) {
    return (
      <div
        ref={setRefs}
        className="relative w-full h-full rounded overflow-hidden touch-manipulation"
        style={{
          outline: isOver ? `2px solid ${stitch ? "rgba(200,255,61,0.6)" : "var(--A-accent)"}` : undefined,
          outlineOffset: "1px",
          opacity: isDragging ? 0.5 : 1,
          background: outOfPos ? "rgba(232,212,74,0.08)" : undefined,
        }}
      >
        <GroundPlayerChip
          player={player}
          stitch={stitch}
          slotLabel={slotLabel}
          onSelectPlayer={onSelectPlayer}
          dragProps={{ listeners, attributes }}
        />
        {outOfPos && (
          <span
            className="absolute top-0 right-0 z-[4] text-[7px] leading-none px-0.5 pointer-events-none"
            style={{ color: "#E8D44A" }}
            aria-label={`${player.position} is out of position`}
          >
            ⚠
          </span>
        )}
      </div>
    );
  }

  // Non-compact (followers / IC)
  const border = stitch
    ? isOver
      ? "ring-2 ring-[rgba(200,255,61,0.55)] border-[rgba(200,255,61,0.55)]"
      : "border-[rgba(200,255,61,0.25)]"
    : isOver
      ? "ring-2 ring-aaccent border-white/60"
      : "border-white/25";

  return (
    <div
      ref={setRefs}
      className={`relative min-w-0 max-w-full h-full min-h-0 flex rounded-lg border ${border} overflow-hidden touch-manipulation ${isDragging ? "opacity-60" : ""}`}
      style={{ background: stitch ? undefined : zoneTintBg(zone) }}
    >
      <LargePlayerCardBody
        player={player}
        stitch={stitch}
        onSelectPlayer={onSelectPlayer}
        dragProps={{ listeners, attributes }}
      />
      {outOfPos && (
        <span
          className="absolute top-0 left-0 z-[4] text-[8px] leading-none px-0.5 py-0.5 rounded-br pointer-events-none"
          style={{
            background: "rgba(232,212,74,0.22)",
            color: "#E8D44A",
            border: "1px solid rgba(232,212,74,0.45)",
            borderTop: "none",
            borderLeft: "none",
          }}
          aria-label={`${player.position} is out of position for this zone`}
        >
          ⚠
        </span>
      )}
    </div>
  );
});

// ── Slot cell ──────────────────────────────────────────────────────────────────

const LineupSlotCell = React.memo(function LineupSlotCell({ slotIndex, player, stitch, onSelectPlayer, zone, slotLabel }) {
  const compact = slotIndex < LINEUP_OVAL_SLOT_COUNT;
  if (!player) {
    return <EmptyLineupSlot slotIndex={slotIndex} stitch={stitch} compact={compact} zone={zone} slotLabel={slotLabel} />;
  }
  return (
    <FilledLineupSlot
      slotIndex={slotIndex}
      player={player}
      stitch={stitch}
      onSelectPlayer={onSelectPlayer}
      compact={compact}
      zone={zone}
      slotLabel={slotLabel}
    />
  );
});

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHeading({ children, stitch, count }) {
  return (
    <h4
      className={`flex flex-wrap items-baseline gap-x-2 text-xs sm:text-sm font-black tracking-wide mb-2 pb-1 border-b ${
        stitch ? "text-[rgba(200,255,61,0.95)] border-[rgba(200,255,61,0.2)]" : "text-aaccent border-aaccent/25"
      }`}
    >
      {children}
      {count != null && (
        <span
          className={`text-[10px] sm:text-xs font-mono font-bold tabular-nums ${
            stitch ? "text-[rgba(200,255,61,0.7)]" : "text-aaccent/80"
          }`}
        >
          ({count})
        </span>
      )}
    </h4>
  );
}

// ── Main oval field ────────────────────────────────────────────────────────────

export function LineupOvalField({ squad, lineupIds, stitch, onSelectPlayer }) {
  const map = useMemo(() => new Map((squad || []).map((p) => [p.id, p])), [squad]);

  const slotPlayer = useCallback(
    (idx) => {
      const raw = lineupIds?.[idx];
      if (raw == null || raw === "") return null;
      return map.get(raw) || null;
    },
    [lineupIds, map],
  );

  const handleSelect = useCallback((p) => onSelectPlayer?.(p), [onSelectPlayer]);

  const ROW_ZONES = ["B", "HB", "C", "HF", "F"];

  return (
    <div
      role="region"
      aria-labelledby="lineup-ground-map-heading"
      className={`relative w-full max-w-6xl mx-auto mb-0 sm:mb-1 rounded-2xl p-3 sm:p-4 md:p-5 touch-manipulation ${stitch ? "stitch-neon-card" : ""}`}
      style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
        <div>
          <h3 id="lineup-ground-map-heading" className={`${css.h1} text-base md:text-lg tracking-wide`}>
            Ground Map
          </h3>
          <p className="text-[11px] text-atext-dim mt-1 max-w-xl leading-snug">
            <span className="text-atext font-semibold">15</span> on the oval ·{" "}
            <span className="text-atext font-semibold">{LINEUP_FOLLOWERS_COUNT} followers</span> ·{" "}
            <span className="text-atext font-semibold">{LINEUP_INTERCHANGE_COUNT} interchange</span>.{" "}
            Left border = form · badge = OVR · ⚠ = out of zone.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-atext-dim shrink-0">
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">{LINEUP_CAP} slots</span>
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Hold · drag</span>
        </div>
      </div>

      {/* ── Square ground container with oval SVG ── */}
      <div
        className="relative w-full max-w-[min(92vw,22rem)] mx-auto rounded-xl overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          background: stitch ? "#040c06" : "#0a1a0d",
        }}
      >
        {/* SVG field markings — drawn in a 100×100 coordinate space */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {/* Oval fill — lighter green = playable field inside */}
          <ellipse cx="50" cy="50" rx="40" ry="48"
            fill={stitch ? "rgba(6,22,10,0.92)" : "rgba(14,58,26,0.88)"} />
          {/* Oval perimeter line */}
          <ellipse cx="50" cy="50" rx="40" ry="48"
            fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="0.75" />
          {/* Subtle inner halo (depth) */}
          <ellipse cx="50" cy="50" rx="40" ry="48"
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          {/* Centre line */}
          <line x1="10" y1="50" x2="90" y2="50"
            stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
          {/* Centre square (ruck square) */}
          <rect x="37" y="44.5" width="26" height="11"
            fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" rx="0.5" />
          {/* Centre circle */}
          <ellipse cx="50" cy="50" rx="10" ry="10"
            fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.65" />
          {/* Centre spot */}
          <circle cx="50" cy="50" r="1.4" fill="rgba(255,255,255,0.42)" />
          {/* 50m arcs */}
          <path d="M12 30 Q50 39 88 30"
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55" />
          <path d="M12 70 Q50 61 88 70"
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.55" />
          {/* Goal square — back (top) */}
          <rect x="39" y="3" width="22" height="6"
            fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
          {/* Goal posts — back (4 posts: 2 behind, 2 goal) */}
          <line x1="33" y1="3.5" x2="33" y2="8"   stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
          <line x1="39" y1="2.5" x2="39" y2="9"   stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
          <line x1="61" y1="2.5" x2="61" y2="9"   stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
          <line x1="67" y1="3.5" x2="67" y2="8"   stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
          {/* Goal square — forward (bottom) */}
          <rect x="39" y="91" width="22" height="6"
            fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
          {/* Goal posts — forward */}
          <line x1="33" y1="92"  x2="33" y2="96.5" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
          <line x1="39" y1="91"  x2="39" y2="97.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
          <line x1="61" y1="91"  x2="61" y2="97.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.85" />
          <line x1="67" y1="92"  x2="67" y2="96.5" stroke="rgba(255,255,255,0.30)" strokeWidth="0.55" />
          {/* Subtle grass stripe bands */}
          <ellipse cx="50" cy="25" rx="38" ry="16" fill="rgba(255,255,255,0.018)" />
          <ellipse cx="50" cy="75" rx="38" ry="16" fill="rgba(255,255,255,0.018)" />
        </svg>

        {/* Zone labels at left edge */}
        <div className="absolute left-0 top-[11%] bottom-[11%] w-[10%] z-[3] flex flex-col pointer-events-none" aria-hidden>
          {ROWS_BACK_TO_FWD.map((row) => (
            <div key={row.key} className="flex-1 flex items-center justify-center">
              <span
                className="text-[7px] font-mono font-black uppercase leading-none"
                style={{ color: "rgba(255,255,255,0.28)", writingMode: "horizontal-tb" }}
              >
                {row.label}
              </span>
            </div>
          ))}
        </div>

        {/* End labels */}
        <div className="absolute top-[1%] inset-x-0 flex justify-center z-[3] pointer-events-none">
          <span className="text-[7px] font-black uppercase tracking-[0.22em] px-2 py-0.5 rounded-full"
            style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.10)" }}>
            Back 50
          </span>
        </div>
        <div className="absolute bottom-[1%] inset-x-0 flex justify-center z-[3] pointer-events-none">
          <span className="text-[7px] font-black uppercase tracking-[0.22em] px-2 py-0.5 rounded-full"
            style={{ color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.10)" }}>
            Forward 50
          </span>
        </div>

        {/* 5×3 player position grid — placed within the oval's horizontal bounds */}
        <div
          className="absolute z-[2] flex flex-col gap-[3px]"
          style={{ top: "11%", right: "8%", bottom: "11%", left: "18%" }}
        >
          {ROWS_BACK_TO_FWD.map((row, r) => {
            const rowZone = ROW_ZONES[r];
            return (
              <div key={row.key} className="flex-1 flex gap-[3px] min-h-0">
                {[0, 1, 2].map((col) => {
                  const idx = r * 3 + col;
                  const p = slotPlayer(idx);
                  return (
                    <div key={idx} className="flex-1 min-w-0 min-h-0">
                      <LineupSlotCell
                        slotIndex={idx}
                        player={p}
                        stitch={stitch}
                        onSelectPlayer={handleSelect}
                        zone={rowZone}
                        slotLabel={SLOT_LABELS[idx]}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Followers */}
      <div className={`mt-4 border-t ${stitch ? "border-[rgba(200,255,61,0.25)]" : "border-aline"} pt-3`}>
        <SectionHeading stitch={stitch} count={LINEUP_FOLLOWERS_COUNT}>
          Followers
        </SectionHeading>
        <div className="grid grid-cols-3 gap-2 md:gap-3 min-h-[7rem]">
          {FOLLOWER_ROLES.map((role, k) => {
            const idx = LINEUP_OVAL_SLOT_COUNT + k;
            const p = slotPlayer(idx);
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div
                  className={`text-[9px] font-mono font-bold uppercase tracking-widest text-center ${
                    stitch ? "text-[rgba(200,255,61,0.55)]" : "text-atext-mute"
                  }`}
                >
                  {role}
                </div>
                <div className="flex-1 min-h-[6rem] flex">
                  <LineupSlotCell
                    slotIndex={idx}
                    player={p}
                    stitch={stitch}
                    onSelectPlayer={handleSelect}
                    zone="RUCK"
                    slotLabel={role}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interchange */}
      <div className={`mt-4 border-t ${stitch ? "border-[rgba(200,255,61,0.25)]" : "border-aline"} pt-3`}>
        <SectionHeading stitch={stitch} count={LINEUP_INTERCHANGE_COUNT}>
          Interchange
        </SectionHeading>
        <div className="grid grid-cols-5 gap-1.5 md:gap-2 min-h-[6rem]">
          {[0, 1, 2, 3, 4].map((j) => {
            const idx = LINEUP_FIELD_COUNT + j;
            const p = slotPlayer(idx);
            return (
              <div key={idx} className="min-h-[5.5rem] flex">
                <LineupSlotCell
                  slotIndex={idx}
                  player={p}
                  stitch={stitch}
                  onSelectPlayer={handleSelect}
                  zone="IC"
                  slotLabel={`IC${j + 1}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`mt-2 pt-2 border-t text-[10px] text-atext-mute text-center ${
          stitch ? "border-[rgba(200,255,61,0.2)]" : "border-aline/60"
        }`}
      >
        Left border = form · badge = OVR · ⚠ = out of zone
      </div>
    </div>
  );
}
