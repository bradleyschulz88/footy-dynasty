import React, { useCallback, useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  LINEUP_CAP,
  LINEUP_FIELD_COUNT,
  LINEUP_OVAL_SLOT_COUNT,
} from "../lib/lineupHelpers.js";
import { css } from "./primitives.jsx";

/** Club-app style: backs toward top of oval, forwards toward bottom (five rows × three). */
const ROWS_BACK_TO_FWD = [
  { key: "B", label: "B" },
  { key: "HB", label: "HB" },
  { key: "C", label: "C" },
  { key: "HF", label: "HF" },
  { key: "F", label: "F" },
];

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

/** Deterministic pseudo jumper when no `number` on player. */
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

function EmptyLineupSlot({ slotIndex, stitch, compact }) {
  const dropId = `lineup-slot-${slotIndex}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.65)] shadow-[0_0_12px_rgba(200,255,61,0.2)]"
      : "border-[rgba(200,255,61,0.35)]"
    : isOver
      ? "border-aaccent ring-2 ring-aaccent/35"
      : "border-aline/60";
  const h = compact ? "min-h-[62px]" : "min-h-[72px]";
  return (
    <div
      ref={setNodeRef}
      className={`${h} min-w-0 max-w-full rounded-lg border-2 ${border} touch-manipulation flex flex-col justify-center items-center ${
        stitch ? "bg-[rgba(8,12,8,0.55)]" : "bg-[var(--A-panel-2)]"
      }`}
    >
      <span
        className={`text-[9px] font-black uppercase tracking-wide ${stitch ? "text-[rgba(200,255,61,0.45)]" : "text-atext-mute"}`}
      >
        Empty
      </span>
    </div>
  );
}

function FilledLineupSlot({ slotIndex, player, stitch, onSelectPlayer, compact }) {
  const dropId = `lineup-slot-${slotIndex}`;
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropId });
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: String(player.id) });
  const setRefs = mergeRefs(setDropRef, setDragRef);

  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.65)] shadow-[0_0_12px_rgba(200,255,61,0.2)]"
      : "border-[rgba(200,255,61,0.45)]"
    : isOver
      ? "border-aaccent ring-2 ring-aaccent/35"
      : "border-aline/70";

  const num = squadNumberDisplay(player);
  const dragging = isDragging ? "opacity-55 scale-[0.98]" : "";

  const nameCell = (
    <span
      className={`flex-1 min-w-0 self-stretch py-0.5 font-semibold leading-tight text-left border-l flex ${
        compact ? "px-0.5 items-start pt-0.5 text-[8px] sm:text-[9px] min-h-[2.25rem] sm:min-h-[2.5rem]" : "items-center px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-[11px] min-h-[34px] sm:min-h-[36px]"
      } ${stitch ? "text-white/95 border-[rgba(200,255,61,0.2)]" : "text-slate-900 border-aline/20"}`}
    >
      <span className="line-clamp-2 break-words hyphens-auto w-full [overflow-wrap:anywhere]">{shortName(player)}</span>
    </span>
  );

  if (stitch) {
    const headH = compact ? "h-9" : "h-11";
    const numW = compact ? "w-6 text-[9px]" : "w-8 text-[10px]";
    return (
      <div
        ref={setRefs}
        className={`min-w-0 max-w-full rounded-lg border-2 ${border} overflow-hidden shadow-inner touch-manipulation ${dragging} bg-[rgba(12,18,12,0.95)]`}
      >
        <button
          type="button"
          className="w-full min-w-0 cursor-grab active:cursor-grabbing text-left overflow-hidden"
          {...listeners}
          {...attributes}
          onClick={() => onSelectPlayer?.(player)}
        >
          <div
            className={`${headH} flex items-center justify-center bg-[rgba(25,35,28,0.9)] border-b border-[rgba(200,255,61,0.2)]`}
          >
            <span className={`font-black text-white tracking-wide ${compact ? "text-xs" : "text-sm"}`}>{initials(player)}</span>
          </div>
          <div className="flex items-stretch min-w-0">
            <span
              className={`${numW} flex-shrink-0 flex items-center justify-center bg-[rgba(90,60,120,0.95)] font-black text-white border-r border-[rgba(200,255,61,0.25)]`}
            >
              {num}
            </span>
            {nameCell}
          </div>
        </button>
      </div>
    );
  }

  const headH = compact ? "h-10" : "h-12";
  const numW = compact ? "w-7 text-[10px]" : "w-9 text-[11px]";
  return (
    <div ref={setRefs} className={`min-w-0 max-w-full rounded-lg border ${border} overflow-hidden bg-white shadow-sm touch-manipulation ${dragging}`}>
      <button
        type="button"
        className="w-full min-w-0 cursor-grab active:cursor-grabbing text-left overflow-hidden"
        {...listeners}
        {...attributes}
        onClick={() => onSelectPlayer?.(player)}
      >
        <div className={`${headH} flex items-center justify-center bg-gradient-to-b from-[#e8eef2] to-[#d4dde6] border-b border-aline/40`}>
          <span className={`font-black text-slate-700 tracking-wide ${compact ? "text-xs" : "text-sm"}`}>{initials(player)}</span>
        </div>
        <div className="flex items-stretch min-w-0 bg-white">
          <span className={`${numW} flex-shrink-0 flex items-center justify-center bg-[#3d1f4d] font-black text-white`}>{num}</span>
          {nameCell}
        </div>
      </button>
    </div>
  );
}

function LineupSlotCell({ slotIndex, player, stitch, onSelectPlayer }) {
  const compact = slotIndex < LINEUP_OVAL_SLOT_COUNT;
  if (!player) {
    return <EmptyLineupSlot slotIndex={slotIndex} stitch={stitch} compact={compact} />;
  }
  return (
    <FilledLineupSlot
      slotIndex={slotIndex}
      player={player}
      stitch={stitch}
      onSelectPlayer={onSelectPlayer}
      compact={compact}
    />
  );
}

function SectionHeading({ children, stitch }) {
  return (
    <h4
      className={`text-xs sm:text-sm font-black tracking-wide mb-2 ${
        stitch ? "text-[rgba(200,255,61,0.95)]" : "text-aaccent"
      }`}
    >
      {children}
    </h4>
  );
}

/**
 * Club-style layout: 15 on oval (B→F top→bottom) + 3 followers + 5 interchange.
 * Draggable ids `lineup-slot-0` … `lineup-slot-22`.
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
            <span className="text-atext font-semibold">15</span> on the oval (B · HB · C · HF · F),{" "}
            <span className="text-atext font-semibold">3 followers</span> underneath, then{" "}
            <span className="text-atext font-semibold">5 interchange</span>. Drag or tap slots to build your side.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-atext-dim shrink-0">
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Slots {LINEUP_CAP}</span>
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Hold · drag</span>
        </div>
      </div>

      <div className="flex justify-center mb-1">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80 drop-shadow-sm px-3 py-1 rounded-full bg-black/35 border border-white/20">
          Back 50
        </span>
      </div>

      <div
        className="relative w-full mx-auto rounded-[50%] overflow-hidden ring-2 ring-white/15 aspect-[1.55/1] max-h-[min(76vh,720px)] min-h-[260px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[440px]"
        style={{
          background:
            "linear-gradient(178deg, rgba(52,140,72,0.55) 0%, rgba(28,100,48,0.75) 38%, rgba(22,78,40,0.8) 62%, rgba(18,70,38,0.72) 100%)",
          boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.12), 0 12px 36px rgba(0,0,0,0.35)",
          border: stitch ? "2px solid rgba(200,255,61,0.35)" : "2px solid rgba(0,0,0,0.35)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 130" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="lineGlowLm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="65" rx="96" ry="58" fill="none" stroke="url(#lineGlowLm)" strokeWidth="1.8" opacity="0.95" />
          <line x1="100" y1="8" x2="100" y2="122" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
          <rect x="78" y="48" width="44" height="34" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" rx="1" />
          <ellipse cx="100" cy="65" rx="14" ry="14" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.9" />
          <ellipse cx="100" cy="65" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
          <path d="M 12 38 Q 100 18 188 38" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" />
          <path d="M 12 92 Q 100 112 188 92" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" />
          <line x1="14" y1="58" x2="14" y2="72" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
          <line x1="186" y1="58" x2="186" y2="72" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
        </svg>

        <div className={`absolute inset-[3%] flex flex-col gap-1 md:gap-1.5 pointer-events-auto ${zoneBg} max-md:overflow-y-auto`}>
          {ROWS_BACK_TO_FWD.map((row, r) => (
            <div
              key={row.key}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 sm:gap-1.5 items-stretch"
            >
              <div
                className={`flex items-center justify-center rounded text-[10px] font-black uppercase tracking-tight ${
                  stitch ? "bg-white/10 text-[rgba(200,255,61,0.95)]" : "bg-white/20 text-white"
                }`}
              >
                {row.label}
              </div>
              {[0, 1, 2].map((col) => {
                const idx = r * 3 + col;
                const p = slotPlayer(idx);
                return (
                  <LineupSlotCell key={idx} slotIndex={idx} player={p} stitch={stitch} onSelectPlayer={onSelectPlayer} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/75 drop-shadow-sm px-3 py-1 rounded-full bg-black/35 border border-white/20">
          Forward 50
        </span>
      </div>

      <div className={`mt-4 border-t ${stitch ? "border-[rgba(200,255,61,0.25)]" : "border-aline"} pt-3`}>
        <SectionHeading stitch={stitch}>Followers</SectionHeading>
        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
          {[0, 1, 2].map((k) => {
            const idx = LINEUP_OVAL_SLOT_COUNT + k;
            const p = slotPlayer(idx);
            return (
              <LineupSlotCell key={idx} slotIndex={idx} player={p} stitch={stitch} onSelectPlayer={onSelectPlayer} />
            );
          })}
        </div>
      </div>

      <div className={`mt-4 border-t ${stitch ? "border-[rgba(200,255,61,0.25)]" : "border-aline"} pt-3`}>
        <SectionHeading stitch={stitch}>Interchange</SectionHeading>
        <div className="grid grid-cols-5 gap-1.5 md:gap-2">
          {[0, 1, 2, 3, 4].map((j) => {
            const idx = LINEUP_FIELD_COUNT + j;
            const p = slotPlayer(idx);
            return (
              <LineupSlotCell key={idx} slotIndex={idx} player={p} stitch={stitch} onSelectPlayer={onSelectPlayer} />
            );
          })}
        </div>
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
