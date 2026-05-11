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

/**
 * AFL club–style card: circular “headshot”, white nameplate overlapping below with [#] + name.
 * `compact` tightens sizes for the 5×3 grid inside the oval.
 */
function ClubPlayerCardBody({ player, stitch, compact, onSelectPlayer, dragProps }) {
  const { listeners, attributes } = dragProps;
  const num = squadNumberDisplay(player);

  const circle = compact
    ? "w-8 h-8 sm:w-9 sm:h-9 min-w-0 min-h-0 max-w-[2.6rem] max-h-[2.6rem]"
    : "w-12 h-12 sm:w-14 sm:h-14";
  const iniSz = compact ? "text-[9px] sm:text-[10px]" : "text-xs sm:text-sm";
  const plateText = compact ? "text-[6px] sm:text-[7px] leading-[1.15]" : "text-[8px] sm:text-[10px] leading-snug";
  const numBox = compact ? "w-[1.125rem] min-w-[1.125rem] text-[7px] sm:text-[8px]" : "w-6 sm:w-7 text-[9px] sm:text-[10px]";
  const overlap = compact ? "-mt-1.5" : "-mt-2";

  if (stitch) {
    return (
      <button
        type="button"
        className="w-full min-w-0 h-full max-h-full flex flex-col items-center justify-center py-0.5 cursor-grab active:cursor-grabbing text-left"
        {...listeners}
        {...attributes}
        onClick={() => onSelectPlayer?.(player)}
      >
        <div
          className={`relative z-[1] rounded-full border-2 border-[rgba(200,255,61,0.55)] shadow-md flex items-center justify-center bg-gradient-to-b from-[#1a2820] to-[#0d1510] ${circle}`}
        >
          <span className={`font-black text-[rgba(200,255,61,0.95)] tracking-wide ${iniSz}`}>{initials(player)}</span>
        </div>
        <div
          className={`relative z-[2] w-full min-w-0 max-w-[6.25rem] ${overlap} rounded-md border border-[rgba(200,255,61,0.35)] bg-[rgba(10,14,10,0.92)] shadow-md flex overflow-hidden`}
        >
          <span
            className={`shrink-0 flex items-center justify-center bg-[rgba(90,60,120,0.98)] font-black text-white ${numBox}`}
          >
            {num}
          </span>
          <span className={`flex-1 min-w-0 px-0.5 py-0.5 font-semibold text-white/95 ${plateText}`}>
            <span className="line-clamp-2 break-words [overflow-wrap:anywhere]">{shortName(player)}</span>
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="w-full min-w-0 h-full max-h-full flex flex-col items-center justify-center py-0.5 cursor-grab active:cursor-grabbing text-left"
      {...listeners}
      {...attributes}
      onClick={() => onSelectPlayer?.(player)}
    >
      <div
        className={`relative z-[1] rounded-full border-2 border-white shadow-md flex items-center justify-center bg-gradient-to-b from-[#f1f5f9] to-[#cbd5e1] ${circle}`}
      >
        <span className={`font-black text-slate-700 tracking-wide ${iniSz}`}>{initials(player)}</span>
      </div>
      <div
        className={`relative z-[2] w-full min-w-0 max-w-[6.25rem] ${overlap} rounded-md border border-slate-200/90 bg-white shadow-sm flex overflow-hidden`}
      >
        <span className={`shrink-0 flex items-center justify-center bg-[#3d1f4d] font-black text-white ${numBox}`}>
          {num}
        </span>
        <span className={`flex-1 min-w-0 px-0.5 py-0.5 font-semibold text-slate-900 ${plateText}`}>
          <span className="line-clamp-2 break-words [overflow-wrap:anywhere]">{shortName(player)}</span>
        </span>
      </div>
    </button>
  );
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
      : "border-white/35";

  const circle = compact
    ? "w-8 h-8 sm:w-9 sm:h-9 min-w-0 min-h-0 max-w-[2.6rem] max-h-[2.6rem]"
    : "w-12 h-12 sm:w-14 sm:h-14";

  return (
    <div
      ref={setNodeRef}
      className={`min-w-0 max-w-full h-full max-h-full flex flex-col items-center justify-center py-0.5 touch-manipulation rounded-lg border-2 border-dashed ${border} ${
        stitch ? "bg-[rgba(0,0,0,0.12)]" : "bg-white/10"
      }`}
    >
      <div className={`rounded-full border-2 border-dashed opacity-50 ${stitch ? "border-[rgba(200,255,61,0.35)]" : "border-white/50"} ${circle}`} />
      <div
        className={`w-full max-w-[6.25rem] -mt-1.5 rounded-md border border-dashed px-0.5 py-1 text-center ${
          stitch ? "border-[rgba(200,255,61,0.25)] text-[rgba(200,255,61,0.45)]" : "border-white/35 text-white/70"
        }`}
      >
        <span className="text-[7px] font-bold uppercase tracking-wide">Add</span>
      </div>
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
      ? "ring-2 ring-[rgba(200,255,61,0.55)] border-[rgba(200,255,61,0.55)]"
      : "border-[rgba(200,255,61,0.25)]"
    : isOver
      ? "ring-2 ring-aaccent border-white/60"
      : "border-white/25";

  const dragging = isDragging ? "opacity-60" : "";

  return (
    <div
      ref={setRefs}
      className={`min-w-0 max-w-full h-full min-h-0 flex rounded-lg border bg-transparent ${border} overflow-hidden touch-manipulation ${dragging}`}
    >
      <ClubPlayerCardBody
        player={player}
        stitch={stitch}
        compact={compact}
        onSelectPlayer={onSelectPlayer}
        dragProps={{ listeners, attributes }}
      />
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
      className={`text-xs sm:text-sm font-black tracking-wide mb-2 pb-1 border-b ${
        stitch ? "text-[rgba(200,255,61,0.95)] border-[rgba(200,255,61,0.2)]" : "text-aaccent border-aaccent/25"
      }`}
    >
      {children}
    </h4>
  );
}

/**
 * Club-style layout: 15 on oval (B→F) + 3 followers + 5 interchange.
 * Oval interior uses proportional row heights so cards stay inside the ellipse.
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
            <span className="text-atext font-semibold">3 followers</span>, then{" "}
            <span className="text-atext font-semibold">5 interchange</span> — same layout as a club team sheet.
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

        <div className="absolute inset-[4.5%] flex flex-col gap-0.5 sm:gap-1 min-h-0 overflow-hidden pointer-events-auto">
          {ROWS_BACK_TO_FWD.map((row, r) => (
            <div key={row.key} className="flex-1 min-h-0 flex flex-col">
              <div className="grid grid-cols-[minmax(1.25rem,1.5rem)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-1 gap-y-0 flex-1 min-h-0">
                <div
                  className={`flex items-center justify-center rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-tight self-center min-h-[1.5rem] ${
                    stitch ? "bg-[rgba(255,255,255,0.12)] text-[rgba(200,255,61,0.95)]" : "bg-white/25 text-white shadow-sm"
                  }`}
                >
                  {row.label}
                </div>
                {[0, 1, 2].map((col) => {
                  const idx = r * 3 + col;
                  const p = slotPlayer(idx);
                  return (
                    <div key={idx} className="min-h-0 min-w-0 h-full max-h-full flex">
                      <LineupSlotCell slotIndex={idx} player={p} stitch={stitch} onSelectPlayer={onSelectPlayer} />
                    </div>
                  );
                })}
              </div>
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
        <div className="grid grid-cols-3 gap-2 md:gap-3 min-h-[7rem]">
          {[0, 1, 2].map((k) => {
            const idx = LINEUP_OVAL_SLOT_COUNT + k;
            const p = slotPlayer(idx);
            return (
              <div key={idx} className="min-h-[6.5rem] flex">
                <LineupSlotCell slotIndex={idx} player={p} stitch={stitch} onSelectPlayer={onSelectPlayer} />
              </div>
            );
          })}
        </div>
      </div>

      <div className={`mt-4 border-t ${stitch ? "border-[rgba(200,255,61,0.25)]" : "border-aline"} pt-3`}>
        <SectionHeading stitch={stitch}>Interchange</SectionHeading>
        <div className="grid grid-cols-5 gap-1.5 md:gap-2 min-h-[6rem]">
          {[0, 1, 2, 3, 4].map((j) => {
            const idx = LINEUP_FIELD_COUNT + j;
            const p = slotPlayer(idx);
            return (
              <div key={idx} className="min-h-[5.5rem] flex">
                <LineupSlotCell slotIndex={idx} player={p} stitch={stitch} onSelectPlayer={onSelectPlayer} />
              </div>
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
