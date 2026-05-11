import React, { useCallback, useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { LINEUP_CAP, LINEUP_INTERCHANGE_COUNT } from "../lib/lineupHelpers.js";
import { css } from "./primitives.jsx";

/** Visual row keys top→bottom (forward 50 at top). */
const ROWS_FWD_TO_BACK = [
  { key: "F", label: "F" },
  { key: "HF", label: "HF" },
  { key: "MID", label: "MID" },
  { key: "C", label: "C" },
  { key: "HB", label: "HB" },
  { key: "B", label: "B" },
];

function initials(p) {
  const a = p.firstName?.[0] || "";
  const b = p.lastName?.[0] || "";
  return (a + b || "?").toUpperCase();
}

function mergeRefs(...refs) {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

function EmptyLineupSlot({ slotIndex, stitch }) {
  const dropId = `lineup-slot-${slotIndex}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.65)] shadow-[0_0_12px_rgba(200,255,61,0.2)]"
      : "border-[rgba(200,255,61,0.35)]"
    : isOver
      ? "border-aaccent ring-2 ring-aaccent/35"
      : "border-white/25";
  const baseCell = stitch
    ? `min-h-[52px] rounded-lg border-2 ${border} backdrop-blur-[2px] transition-colors flex flex-col justify-center px-1 py-1`
    : `min-h-[52px] rounded-lg border-2 ${border} transition-colors flex flex-col justify-center px-1 py-1 bg-[var(--A-panel)]`;
  const cellBg = stitch ? "bg-[rgba(8,12,8,0.55)]" : "bg-[rgba(0,24,32,0.35)]";
  return (
    <div
      ref={setNodeRef}
      className={`${baseCell} ${cellBg} touch-manipulation items-center justify-center`}
    >
      <span
        className={`text-[9px] font-black uppercase tracking-wide ${stitch ? "text-[rgba(200,255,61,0.45)]" : "text-atext-mute"}`}
      >
        —
      </span>
    </div>
  );
}

function FilledLineupSlot({ slotIndex, player, stitch, onSelectPlayer }) {
  const dropId = `lineup-slot-${slotIndex}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: String(player.id) });
  const setRefs = mergeRefs(setDropRef, setDragRef);

  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.65)] shadow-[0_0_12px_rgba(200,255,61,0.2)]"
      : "border-[rgba(200,255,61,0.35)]"
    : isOver
      ? "border-aaccent ring-2 ring-aaccent/35"
      : "border-white/25";
  const baseCell = stitch
    ? `min-h-[52px] rounded-lg border-2 ${border} backdrop-blur-[2px] transition-colors flex flex-col justify-center px-1 py-1`
    : `min-h-[52px] rounded-lg border-2 ${border} transition-colors flex flex-col justify-center px-1 py-1 bg-[var(--A-panel)]`;
  const cellBg = stitch
    ? isDragging
      ? "bg-[rgba(15,20,15,0.55)]"
      : "bg-[rgba(15,20,15,0.92)]"
    : isDragging
      ? "opacity-60"
      : "";

  return (
    <div ref={setRefs} className={`${baseCell} ${cellBg} shadow-inner touch-manipulation`}>
      <button
        type="button"
        className="w-full text-left cursor-grab active:cursor-grabbing"
        {...listeners}
        {...attributes}
        onClick={() => onSelectPlayer?.(player)}
      >
        <span className={`block text-center text-[10px] font-black truncate ${stitch ? "text-white" : "text-atext"}`}>
          {initials(player)}
        </span>
        <span
          className={`block text-center font-mono text-[11px] ${stitch ? "text-[rgba(200,255,61,1)]" : "text-aaccent"}`}
        >
          {player.overall ?? 0}
        </span>
      </button>
    </div>
  );
}

function LineupSlotCell({ slotIndex, player, stitch, onSelectPlayer }) {
  if (!player) {
    return <EmptyLineupSlot slotIndex={slotIndex} stitch={stitch} />;
  }
  return (
    <FilledLineupSlot
      slotIndex={slotIndex}
      player={player}
      stitch={stitch}
      onSelectPlayer={onSelectPlayer}
    />
  );
}

/**
 * Ground map: 18 slots (6×3, forward 50 at top) + 5 interchange below — matches draggable ids `lineup-slot-0` … `lineup-slot-22`.
 */
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

  const zoneBg = stitch ? "bg-[rgba(5,8,5,0.55)]" : "bg-[rgba(0,24,32,0.55)]";

  return (
    <div
      className={`relative w-full max-w-6xl mx-auto mb-5 rounded-2xl p-3 sm:p-4 md:p-5 touch-manipulation ${stitch ? "stitch-neon-card" : ""}`}
      style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
        <div>
          <h3 className={`${css.h1} text-base md:text-lg tracking-wide`}>GROUND MAP</h3>
          <p className="text-[11px] text-atext-dim mt-1 max-w-lg leading-snug">
            <span className="text-atext font-semibold">18</span> on the oval (
            <span className="text-atext font-semibold">midfield</span> row = followers) +{" "}
            <span className="text-atext font-semibold">5 interchange</span> below. Tap or drag a chip to add or move.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-atext-dim shrink-0">
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Slots {LINEUP_CAP}</span>
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Hold · drag</span>
        </div>
      </div>

      <div className="flex justify-center mb-1">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80 drop-shadow-sm px-3 py-1 rounded-full bg-black/35 border border-white/20">
          Forward 50
        </span>
      </div>

      <div
        className="relative w-full mx-auto rounded-[50%] overflow-hidden ring-2 ring-white/15 aspect-[1.55/1] max-h-[min(76vh,720px)] min-h-[280px] sm:min-h-[340px] md:min-h-[400px] lg:min-h-[460px]"
        style={{
          background:
            "linear-gradient(178deg, rgba(52,140,72,0.55) 0%, rgba(28,100,48,0.75) 38%, rgba(22,78,40,0.8) 62%, rgba(18,70,38,0.72) 100%)",
          boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.12), 0 12px 36px rgba(0,0,0,0.35)",
          border: stitch ? "2px solid rgba(200,255,61,0.35)" : "2px solid rgba(0,0,0,0.35)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 130" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="lineGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="65" rx="96" ry="58" fill="none" stroke="url(#lineGlow)" strokeWidth="1.8" opacity="0.95" />
          <line x1="100" y1="8" x2="100" y2="122" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
          <rect x="78" y="48" width="44" height="34" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" rx="1" />
          <ellipse cx="100" cy="65" rx="14" ry="14" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.9" />
          <ellipse cx="100" cy="65" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
          <path d="M 12 38 Q 100 18 188 38" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" />
          <path d="M 12 92 Q 100 112 188 92" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" />
          <line x1="14" y1="58" x2="14" y2="72" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
          <line x1="186" y1="58" x2="186" y2="72" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
        </svg>

        <div
          className={`absolute inset-[3%] flex flex-col gap-1.5 md:gap-2 pointer-events-auto ${zoneBg} max-md:overflow-y-auto`}
        >
          {ROWS_FWD_TO_BACK.map((row, r) => (
            <div key={row.key} className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 md:gap-2 items-stretch">
              <div
                className={`flex items-center justify-center text-[10px] font-black uppercase tracking-tight ${stitch ? "text-[rgba(200,255,61,0.9)]" : "text-white/85"}`}
              >
                {row.label}
              </div>
              {[0, 1, 2].map((col) => {
                const idx = r * 3 + col;
                const p = slotPlayer(idx);
                return (
                  <LineupSlotCell
                    key={idx}
                    slotIndex={idx}
                    player={p}
                    stitch={stitch}
                    onSelectPlayer={onSelectPlayer}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 px-1">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${stitch ? "text-[rgba(200,255,61,0.9)]" : "text-atext"}`}
          >
            Interchange · {LINEUP_INTERCHANGE_COUNT}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 md:gap-2">
          {[0, 1, 2, 3, 4].map((j) => {
            const idx = LINEUP_FIELD_COUNT + j;
            const p = slotPlayer(idx);
            return (
              <LineupSlotCell
                key={idx}
                slotIndex={idx}
                player={p}
                stitch={stitch}
                onSelectPlayer={onSelectPlayer}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mt-3">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/75 drop-shadow-sm px-3 py-1 rounded-full bg-black/35 border border-white/20">
          Back 50
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-atext-dim">
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400/80 mr-1 align-middle" /> Grass = playing surface
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full border-2 border-white/50 mr-1 align-middle" /> White = boundary / centre
        </span>
      </div>
    </div>
  );
}
