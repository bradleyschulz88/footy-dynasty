import React, { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { lineupPlayersOrdered } from "../lib/lineupHelpers.js";
import { primaryLineBucket } from "../lib/lineupBalance.js";
import { css } from "./primitives.jsx";

function initials(p) {
  const a = p.firstName?.[0] || "";
  const b = p.lastName?.[0] || "";
  return (a + b || "?").toUpperCase();
}

function OvalDropZone({ id, title, subtitle, stitch, isCompact, children, zoneClass }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.55)] bg-[rgba(200,255,61,0.14)]"
      : "border-[rgba(200,255,61,0.28)] bg-black/15"
    : isOver
      ? "border-aaccent bg-aaccent/10"
      : "border-aline bg-apanel/40";

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl flex flex-col min-h-[72px] sm:min-h-[80px] border border-dashed ${border} ${zoneClass || ""} touch-manipulation`}
    >
      <div className={`px-2 pt-1.5 pb-1 flex items-center justify-between gap-1 ${isCompact ? "" : ""}`}>
        <span
          className={`text-[9px] font-bold uppercase tracking-widest ${stitch ? "text-[rgba(200,255,61,0.85)]" : "text-atext-mute"}`}
        >
          {title}
        </span>
        {subtitle != null && (
          <span className={`text-[9px] font-mono ${stitch ? "text-atext-dim" : "text-atext-dim"}`}>{subtitle}</span>
        )}
      </div>
      <div className={`flex-1 px-1.5 pb-2 flex flex-wrap content-start gap-1 ${isCompact ? "justify-center" : ""}`}>
        {children}
      </div>
    </div>
  );
}

function Chip({ player, stitch, onSelect }) {
  const ovr = player.overall ?? 0;
  return (
    <button
      type="button"
      className={`min-h-[40px] min-w-[40px] px-1.5 py-1 rounded-lg border text-[9px] font-bold leading-tight text-left transition-colors touch-manipulation ${
        stitch
          ? "border-[rgba(200,255,61,0.35)] bg-apanel text-atext hover:bg-[rgba(200,255,61,0.12)]"
          : "border-aline bg-apanel-2 text-atext hover:bg-apanel"
      }`}
      onClick={() => onSelect?.(player)}
    >
      <span className="block truncate max-w-[3.25rem]">{initials(player)}</span>
      <span className={`font-mono ${stitch ? "text-[rgba(200,255,61,0.9)]" : "text-aaccent"}`}>{ovr}</span>
    </button>
  );
}

/**
 * Visual Aussie-rules oval with positional drop targets (presentation — bucket order only).
 */
export function LineupOvalField({ squad, lineupIds, stitch, onSelectPlayer }) {
  const ordered = useMemo(() => lineupPlayersOrdered(squad, lineupIds), [squad, lineupIds]);
  const groups = useMemo(() => {
    const g = { fwd: [], mid: [], ruck: [], back: [] };
    for (const p of ordered) {
      const b = primaryLineBucket(p.position);
      g[b].push(p);
    }
    return g;
  }, [ordered]);

  const midSplit = Math.ceil(groups.mid.length / 2);
  const midLeft = groups.mid.slice(0, midSplit);
  const midRight = groups.mid.slice(midSplit);

  return (
    <div
      className={`relative w-full max-w-xl mx-auto mb-5 p-3 md:p-4 touch-manipulation ${stitch ? "stitch-neon-card" : ""}`}
      style={
        stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }
      }
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className={`${css.h1} text-base md:text-lg tracking-wide`}>GROUND MAP</h3>
        <span className="text-[10px] text-atext-dim font-mono uppercase max-w-[55%] text-right leading-snug">
          Drop on a line to group by position · touch & hold to drag
        </span>
      </div>

      <div
        className="relative w-full mx-auto rounded-[50%] overflow-hidden"
        style={{
          aspectRatio: "1.55 / 1",
          maxHeight: "min(42vh, 360px)",
          background:
            "linear-gradient(180deg, rgba(34,120,55,0.35) 0%, rgba(26,95,42,0.55) 40%, rgba(22,78,36,0.5) 100%)",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.08), 0 8px 28px rgba(0,0,0,0.25)",
          border: stitch ? "1px solid rgba(200,255,61,0.25)" : "1px solid var(--A-line)",
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35" viewBox="0 0 200 130" preserveAspectRatio="none">
          <ellipse cx="100" cy="65" rx="96" ry="58" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
          <line x1="100" y1="10" x2="100" y2="120" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <ellipse cx="100" cy="65" rx="22" ry="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        </svg>

        <div className="absolute inset-[5%] flex flex-col gap-1.5 pointer-events-auto">
          <OvalDropZone
            id="oval-fwd"
            title="Forwards"
            subtitle={groups.fwd.length}
            stitch={stitch}
            zoneClass="flex-shrink-0"
          >
            {groups.fwd.map((p) => (
              <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
            ))}
          </OvalDropZone>

          <div className="grid grid-cols-3 gap-1.5 flex-1 min-h-0">
            <OvalDropZone
              id="oval-mid-l"
              title="Mid L"
              subtitle={midLeft.length}
              stitch={stitch}
              isCompact
              zoneClass="min-w-0"
            >
              {midLeft.map((p) => (
                <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
              ))}
            </OvalDropZone>
            <OvalDropZone
              id="oval-ruck"
              title="Ruck"
              subtitle={groups.ruck.length}
              stitch={stitch}
              isCompact
              zoneClass="min-w-0"
            >
              {groups.ruck.map((p) => (
                <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
              ))}
            </OvalDropZone>
            <OvalDropZone
              id="oval-mid-r"
              title="Mid R"
              subtitle={midRight.length}
              stitch={stitch}
              isCompact
              zoneClass="min-w-0"
            >
              {midRight.map((p) => (
                <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
              ))}
            </OvalDropZone>
          </div>

          <OvalDropZone
            id="oval-back"
            title="Backs"
            subtitle={groups.back.length}
            stitch={stitch}
            zoneClass="flex-shrink-0"
          >
            {groups.back.map((p) => (
              <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
            ))}
          </OvalDropZone>
        </div>
      </div>
    </div>
  );
}
