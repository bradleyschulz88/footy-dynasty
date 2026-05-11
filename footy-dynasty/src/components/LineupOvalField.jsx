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

function OvalDropZone({ id, title, subtitle, stitch, zoneClass, zoneBg, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const border = stitch
    ? isOver
      ? "border-[rgba(200,255,61,0.65)] shadow-[0_0_12px_rgba(200,255,61,0.2)]"
      : "border-[rgba(200,255,61,0.4)]"
    : isOver
      ? "border-aaccent ring-2 ring-aaccent/35"
      : "border-white/25";

  const bg = stitch
    ? isOver
      ? "bg-[rgba(10,15,10,0.72)]"
      : "bg-[rgba(8,12,8,0.68)]"
    : isOver
      ? "bg-[rgba(0,20,28,0.75)]"
      : zoneBg;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl flex flex-col min-h-[88px] sm:min-h-[100px] md:min-h-[118px] border-2 ${border} ${bg} backdrop-blur-[2px] ${zoneClass || ""} touch-manipulation transition-colors shadow-inner`}
    >
      <div className="px-2 pt-1.5 pb-1 flex items-center justify-between gap-1">
        <span
          className={`text-[11px] md:text-xs font-black uppercase tracking-widest ${stitch ? "text-[rgba(200,255,61,0.95)]" : "text-white/90"}`}
        >
          {title}
        </span>
        {subtitle != null && (
          <span
            className={`text-[10px] font-mono font-bold tabular-nums ${stitch ? "text-[rgba(200,255,61,0.85)]" : "text-aaccent"}`}
          >
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex-1 px-2 pb-2.5 pt-0.5 flex flex-wrap content-start gap-2 justify-start">{children}</div>
    </div>
  );
}

function Chip({ player, stitch, onSelect }) {
  const ovr = player.overall ?? 0;
  return (
    <button
      type="button"
      className={`min-h-[44px] min-w-[44px] px-2 py-1.5 rounded-lg border-2 text-[10px] font-black leading-tight text-left transition-colors touch-manipulation shadow-sm ${
        stitch
          ? "border-[rgba(200,255,61,0.5)] bg-[rgba(15,20,15,0.92)] text-white hover:bg-[rgba(30,40,30,0.95)]"
          : "border-white/30 bg-[var(--A-panel)] text-atext hover:bg-apanel-2"
      }`}
      onClick={() => onSelect?.(player)}
    >
      <span className="block truncate max-w-[3.5rem]">{initials(player)}</span>
      <span className={`font-mono text-[11px] ${stitch ? "text-[rgba(200,255,61,1)]" : "text-aaccent"}`}>{ovr}</span>
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

  const zoneBg = stitch ? "bg-[rgba(5,8,5,0.55)]" : "bg-[rgba(0,24,32,0.55)]";

  return (
    <div
      className={`relative w-full max-w-6xl mx-auto mb-5 rounded-2xl p-3 sm:p-4 md:p-5 touch-manipulation ${stitch ? "stitch-neon-card" : ""}`}
      style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
        <div>
          <h3 className={`${css.h1} text-base md:text-lg tracking-wide`}>GROUND MAP</h3>
          <p className="text-[11px] text-atext-dim mt-1 max-w-md leading-snug">
            <span className="text-atext font-semibold">Top</span> = forward / scoring direction ·{" "}
            <span className="text-atext font-semibold">Bottom</span> = defensive end. Drop players onto a line to group them
            by role (order only — gameplay unchanged).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase text-atext-dim shrink-0">
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Hold · drag</span>
          <span className="rounded-md border border-aline px-2 py-1 bg-apanel-2">Tap chip · player</span>
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
          <line x1="100" y1="8" x2="100" y2="122" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x="78" y="48" width="44" height="34" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.9" rx="1" />
          <ellipse cx="100" cy="65" rx="14" ry="14" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.9" />
          <ellipse cx="100" cy="65" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.8" />
          <path d="M 12 38 Q 100 18 188 38" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" />
          <path d="M 12 92 Q 100 112 188 92" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.85" />
          <line x1="14" y1="58" x2="14" y2="72" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
          <line x1="186" y1="58" x2="186" y2="72" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" />
        </svg>

        <div className="absolute inset-[3%] flex flex-col gap-2 md:gap-2.5 pointer-events-auto">
          <OvalDropZone id="oval-fwd" title="Forwards" subtitle={groups.fwd.length} stitch={stitch} zoneBg={zoneBg} zoneClass="flex-shrink-0">
            {groups.fwd.map((p) => (
              <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
            ))}
          </OvalDropZone>

          <div className="grid grid-cols-3 gap-2 md:gap-2.5 flex-1 min-h-[120px] md:min-h-[160px]">
            <OvalDropZone
              id="oval-mid-l"
              title="Mid L"
              subtitle={midLeft.length}
              stitch={stitch}
              zoneClass="min-w-0"
              zoneBg={zoneBg}
            >
              {midLeft.map((p) => (
                <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
              ))}
            </OvalDropZone>
            <OvalDropZone id="oval-ruck" title="Ruck" subtitle={groups.ruck.length} stitch={stitch} zoneClass="min-w-0" zoneBg={zoneBg}>
              {groups.ruck.map((p) => (
                <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
              ))}
            </OvalDropZone>
            <OvalDropZone
              id="oval-mid-r"
              title="Mid R"
              subtitle={midRight.length}
              stitch={stitch}
              zoneClass="min-w-0"
              zoneBg={zoneBg}
            >
              {midRight.map((p) => (
                <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
              ))}
            </OvalDropZone>
          </div>

          <OvalDropZone id="oval-back" title="Backs" subtitle={groups.back.length} stitch={stitch} zoneClass="flex-shrink-0" zoneBg={zoneBg}>
            {groups.back.map((p) => (
              <Chip key={p.id} player={p} stitch={stitch} onSelect={onSelectPlayer} />
            ))}
          </OvalDropZone>
        </div>
      </div>

      <div className="flex justify-center mt-2">
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
