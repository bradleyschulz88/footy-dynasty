import React, { useCallback, useMemo, useState } from "react";
import { GripVertical, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  pointerWithin,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatPositionSlash } from "../lib/playerGen.js";
import {
  LINEUP_CAP,
  lineupPlayerCount,
  lineupHasPlayer,
  lineupSlotIndexFromId,
  lineupToFixedSlots,
  lineupPlayerSlotIndex,
  removeIdFromLineup,
  insertIdAtLineupSlot,
  placeOrSwapLineupSlot,
  swapLineupSlots,
  dedupeLineup,
} from "../lib/lineupHelpers.js";
import { StarRating, css } from "./primitives.jsx";
import { LineupOvalField, formBorderColor } from "./LineupOvalField.jsx";
import { useCareer, useUpdateCareer } from "../lib/careerStore.js";

const BENCH_TRAY_ID = "bench-tray";

function posBadgeStyle(pos) {
  if (pos === 'KF' || pos === 'HF') return {background:'color-mix(in srgb,#E84A6F 14%,transparent)',color:'#E84A6F',border:'1px solid color-mix(in srgb,#E84A6F 30%,transparent)'};
  if (pos === 'HB' || pos === 'KB') return {background:'color-mix(in srgb,#60A5FA 14%,transparent)',color:'#60A5FA',border:'1px solid color-mix(in srgb,#60A5FA 30%,transparent)'};
  if (pos === 'RU') return {background:'color-mix(in srgb,#A78BFA 14%,transparent)',color:'#A78BFA',border:'1px solid color-mix(in srgb,#A78BFA 30%,transparent)'};
  if (pos === 'C' || pos === 'R' || pos === 'WG') return {background:'color-mix(in srgb,var(--A-accent) 14%,transparent)',color:'var(--A-accent)',border:'1px solid color-mix(in srgb,var(--A-accent) 30%,transparent)'};
  return {background:'color-mix(in srgb,#9CA3AF 14%,transparent)',color:'#9CA3AF',border:'1px solid color-mix(in srgb,#9CA3AF 30%,transparent)'};
}

function pName(p) {
  return p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || "Player");
}

function TrayDropArea({ id, label, isEmpty, stitch }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-11 rounded-lg flex items-center justify-center text-[10px] font-mono uppercase tracking-wider transition-colors touch-manipulation ${
        stitch
          ? `border border-dashed border-[rgba(200,255,61,0.35)] ${isOver ? "bg-[rgba(200,255,61,0.12)]" : "bg-transparent text-atext-mute"}`
          : `border border-dashed border-aline ${isOver ? "bg-aaccent/10" : "text-atext-mute"}`
      }`}
    >
      {isEmpty ? label : "Drop here to move"}
    </div>
  );
}

function SortablePlayerRow({
  player,
  stitch,
  onSelect,
  onRemove,
  variant, // 'xxii' | 'bench'
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: player.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };
  const initials = `${player.firstName?.[0] || ""}${player.lastName?.[0] || ""}`;

  // Partnership tag: show when this bench player has 20+ shared games with someone in the lineup.
  const career = useCareer();
  const hasPartnership = useMemo(() => {
    if (variant !== 'bench') return false;
    const partnerships = career.partnerships;
    if (!partnerships) return false;
    const lineupIds = career.lineup || [];
    return lineupIds.some((id) => {
      if (!id || id === player.id) return false;
      const key = [id, player.id].sort().join('_');
      return (partnerships[key] || 0) >= 20;
    });
  }, [variant, career.partnerships, career.lineup, player.id]);

  if (stitch) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`stitch-mock-player-card mb-1.5 min-h-[48px] ${variant === "xxii" ? "" : "opacity-95"}`}
      >
        <div className="stitch-mock-player-rating">{player.overall}</div>
        <div className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5">
          <button
            type="button"
            className="touch-none p-1 rounded-md hover:bg-apanel-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
            aria-label="Drag player"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-atext-mute" />
          </button>
          <div
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            className={`flex items-center gap-2 flex-1 min-w-0 text-left ${onSelect ? "cursor-pointer" : ""}`}
            onClick={onSelect ? () => onSelect(player) : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(player);
                    }
                  }
                : undefined
            }
          >
            <div className="w-8 h-8 rounded-full border border-[rgba(200,255,61,0.25)] bg-apanel-2 flex items-center justify-center text-[9px] font-bold text-atext flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[8px] font-mono text-atext-mute uppercase truncate">
                {formatPositionSlash(player)}
              </div>
              <div className="font-bold text-xs text-atext truncate">{pName(player)}</div>
            </div>
          </div>
          {onRemove && (
            <button
              type="button"
              className="p-1 rounded-md text-[#E84A6F] hover:bg-[#E84A6F]/15 flex-shrink-0"
              aria-label="Remove from match squad"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(player);
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="stitch-mock-player-tab w-1.5" aria-hidden />
      </div>
    );
  }

  const fitColor = (player.fitness ?? 85) >= 80 ? 'var(--A-pos)' : (player.fitness ?? 85) >= 55 ? 'var(--A-accent-2)' : 'var(--A-neg)';
  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderTop: '1px solid var(--A-line)',
        borderRight: '1px solid var(--A-line)',
        borderBottom: '1px solid var(--A-line)',
        borderLeft: `3px solid ${formBorderColor(player.form ?? 60)}`,
      }}
      className="w-full flex items-center gap-1 px-2 py-2.5 min-h-[48px] rounded-xl bg-apanel mb-1 touch-manipulation transition-all hover:bg-[color-mix(in_srgb,var(--A-accent)_4%,transparent)] hover:shadow-sm"
    >
      <button
        type="button"
        className="touch-none p-1 rounded-lg hover:bg-apanel-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
        aria-label="Drag player"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-atext-mute" />
      </button>
      {onSelect ? (
        <button
          type="button"
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
          onClick={() => onSelect(player)}
        >
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black text-center flex-shrink-0 uppercase tracking-wider" style={posBadgeStyle(player.position)}>
            {formatPositionSlash(player)}
          </span>
          <span className="text-sm font-semibold text-atext truncate">{pName(player)}</span>
          <span className="w-2 h-2 rounded-full flex-shrink-0 ml-auto" style={{ background: fitColor }} title={`Fitness ${player.fitness ?? '?'}%`} />
          <span className="text-xs text-atext-mute">{player.age}</span>
          <StarRating overall={player.overall} size={11} />
        </button>
      ) : (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black text-center flex-shrink-0 uppercase tracking-wider" style={posBadgeStyle(player.position)}>
            {formatPositionSlash(player)}
          </span>
          <span className="text-sm font-semibold text-atext truncate">{pName(player)}</span>
          <span className="w-2 h-2 rounded-full flex-shrink-0 ml-auto" style={{ background: fitColor }} title={`Fitness ${player.fitness ?? '?'}%`} />
          <span className="text-xs text-atext-mute">{player.age}</span>
          <StarRating overall={player.overall} size={11} />
        </div>
      )}
      {hasPartnership && (
        <span
          className="text-[9px] px-1 py-0.5 rounded font-bold flex-shrink-0"
          style={{ color: 'var(--A-accent)', background: 'color-mix(in srgb, var(--A-accent) 12%, transparent)' }}
          title="20+ games together with a current lineup player"
        >
          🤝
        </span>
      )}
      {/* Medical-sub designation lives on the Depth view (interchange players only) —
          this pool lists players OUTSIDE the 23, so a sub set here would be invalid. */}
      {onRemove && (
        <button
          type="button"
          className="p-1 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10"
          aria-label="Remove from match squad"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(player);
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function dragSummary(activePlayer) {
  if (!activePlayer) return null;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border border-aline bg-apanel"
      style={{ cursor: "grabbing" }}
    >
      <span className="font-bold text-sm text-atext">{pName(activePlayer)}</span>
      <StarRating overall={activePlayer.overall} size={11} />
    </div>
  );
}


/** Compact chip shown in the mobile horizontal bench strip. */
function MobileBenchChip({ player, stitch, onSelect }) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: player.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(isDragging ? null : undefined),
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border touch-manipulation cursor-grab active:cursor-grabbing select-none min-w-[52px] ${
        stitch
          ? "border-[rgba(200,255,61,0.3)] bg-[rgba(0,0,0,0.25)]"
          : "border-aline bg-apanel-2"
      }`}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(player)}
    >
      <span className="text-[9px] font-mono uppercase tracking-wider text-atext-mute leading-none">
        {formatPositionSlash(player)}
      </span>
      <StarRating overall={player.overall} size={9} />
      <span className="sr-only">{player.overall}</span>
      <span className="text-[8px] text-atext-dim truncate max-w-[48px]">
        {player.firstName?.[0] ?? ""}{player.firstName ? "." : ""}{player.lastName?.slice(0, 6) ?? player.name ?? ""}
      </span>
    </div>
  );
}

/**
 * Bench ↔ match squad (18 + 5) builder for Squad → Players tab.
 */
export function SquadLineupBuilder({ benchPlayerIds, stitch, onSelectPlayer }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const lineup = useMemo(() => career.lineup || [], [career.lineup]);
  const squad = useMemo(() => career.squad || [], [career.squad]);
  const benchPlayers = useMemo(
    () => benchPlayerIds.map((id) => squad.find((p) => p.id === id)).filter(Boolean),
    [benchPlayerIds, squad],
  );
  const [posFilter, setPosFilter] = useState(null);
  const benchPositions = useMemo(() => {
    const seen = new Set();
    benchPlayers.forEach(p => { seen.add(p.position); });
    return [...seen].sort();
  }, [benchPlayers]);
  const filteredBench = posFilter
    ? benchPlayers.filter(p => p.position === posFilter || p.secondaryPosition === posFilter)
    : benchPlayers;

  /** Prefer pointer targets; when dragging a match-squad player, prefer bench tray over overlapping bench rows so drops register as remove. */
  const lineupCollision = useCallback(
    (args) => {
      const pw = pointerWithin(args);
      if (pw.length > 0) {
        const aid = String(args.active.id);
        const inMatchSquad = (lineup || []).some((x) => x != null && String(x) === aid);
        if (inMatchSquad) {
          const tray = pw.find((c) => c.id === BENCH_TRAY_ID);
          if (tray) return [tray];
        }
        return pw;
      }
      return closestCorners(args);
    },
    [lineup],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );
  const [activeId, setActiveId] = useState(null);
  const activePlayer = activeId ? squad.find((p) => String(p.id) === String(activeId)) : null;

  function onDragStart({ active }) {
    setActiveId(active.id);
  }

  function onDragEnd({ active, over }) {
    setActiveId(null);
    if (!over) return;
    const aid = String(active.id);
    const oid = String(over.id);

    const li = [...lineup];
    const bIds = [...benchPlayerIds];

    const iL = li.findIndex((x) => x != null && String(x) === aid);
    const oL = li.findIndex((x) => x != null && String(x) === oid);
    const iB = bIds.findIndex((x) => x != null && String(x) === aid);
    const oB = bIds.findIndex((x) => x != null && String(x) === oid);

    const destSlot = lineupSlotIndexFromId(oid);
    if (destSlot != null) {
      const count = lineupPlayerCount(li);
      const slotArr = lineupToFixedSlots(li);
      const destOccupied = slotArr[destSlot] != null && slotArr[destSlot] !== "";
      if (iB !== -1) {
        if (count >= LINEUP_CAP && !lineupHasPlayer(li, aid)) return;
        updateCareer({ lineup: placeOrSwapLineupSlot(li, aid, destSlot) });
        return;
      }
      if (iL !== -1) {
        const fromSlot = lineupPlayerSlotIndex(li, aid);
        if (fromSlot < 0) return;
        if (destOccupied) {
          updateCareer({ lineup: swapLineupSlots(li, fromSlot, destSlot) });
        } else {
          updateCareer({ lineup: dedupeLineup(insertIdAtLineupSlot(li, aid, destSlot)) });
        }
        return;
      }
    }

    if (iL !== -1 && oL !== -1) {
      // Both in the 23: dropping onto a player's row swaps their slots — never
      // compacts, so sparse lineups from the Positions/Depth views keep every
      // player's positional slot.
      const fromSlot = lineupPlayerSlotIndex(li, aid);
      const toSlot = lineupPlayerSlotIndex(li, oid);
      if (fromSlot >= 0 && toSlot >= 0) updateCareer({ lineup: swapLineupSlots(li, fromSlot, toSlot) });
      return;
    }
    if (iB !== -1 && oB !== -1) {
      return;
    }
    if (iB !== -1 && oL !== -1) {
      // Pool player dropped onto a selected player's row: take that slot
      // (previous occupant drops to the pool); other slots stay put.
      const toSlot = lineupPlayerSlotIndex(li, oid);
      if (toSlot < 0) return;
      if (lineupPlayerCount(li) >= LINEUP_CAP && !lineupHasPlayer(li, aid)) return;
      updateCareer({ lineup: placeOrSwapLineupSlot(li, aid, toSlot) });
      return;
    }
    if (iL !== -1 && oB !== -1) {
      updateCareer({ lineup: dedupeLineup(removeIdFromLineup(li, aid)) });
      return;
    }
    if (iL !== -1 && oid === BENCH_TRAY_ID) {
      updateCareer({ lineup: dedupeLineup(removeIdFromLineup(li, aid)) });
      return;
    }
  }

  function onDragCancel() {
    setActiveId(null);
  }

  const autoSelect = () => {
    const eligible = [...squad].filter(p => !p.injured && !p.suspended);
    const sorted = eligible.sort((a, b) => {
      const fitA = Math.max(50, a.fitness ?? 85) / 100;
      const fitB = Math.max(50, b.fitness ?? 85) / 100;
      return (b.overall || 0) * fitB - (a.overall || 0) * fitA;
    });
    updateCareer({
      lineup: sorted.slice(0, LINEUP_CAP).map(p => p.id),
    });
  };

  const [benchOpen, setBenchOpen] = useState(true);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={lineupCollision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-6">
        <div className="flex-1 min-w-0">
          <LineupOvalField
            squad={squad}
            lineupIds={lineup}
            stitch={stitch}
            onSelectPlayer={onSelectPlayer}
          />
        </div>

        <aside className="w-full md:w-[min(100%,19rem)] shrink-0 md:sticky md:top-4 space-y-3">
          {/* Mobile: horizontal bench strip (hidden on md+) */}
          <div
            className={`md:hidden rounded-2xl overflow-hidden ${stitch ? "stitch-neon-card" : ""}`}
            style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setBenchOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <span className={`${css.h1} text-sm tracking-wide`}>Bench pool</span>
                <span className="text-[10px] text-atext-mute font-mono font-bold tabular-nums">
                  {benchPlayers.length}
                </span>
              </div>
              {benchOpen
                ? <ChevronUp className="w-4 h-4 text-atext-mute" />
                : <ChevronDown className="w-4 h-4 text-atext-mute" />}
            </button>
            {benchOpen && (
              <div className="px-3 pb-3">
                {benchPlayers.length === 0 ? (
                  <div className="text-[11px] text-atext-mute text-center py-4">
                    All players in the match-day {LINEUP_CAP}.
                  </div>
                ) : (
                  <div className="overflow-x-auto [scrollbar-width:thin] -mx-1 px-1 pb-1">
                    <SortableContext items={benchPlayerIds} strategy={verticalListSortingStrategy}>
                      <div className="flex gap-2 min-w-max">
                        {benchPlayers.map((p) => (
                          <MobileBenchChip
                            key={p.id}
                            player={p}
                            stitch={stitch}
                            onSelect={onSelectPlayer}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                )}
                <TrayDropArea
                  id={BENCH_TRAY_ID}
                  label="Drop here to remove from squad"
                  isEmpty={benchPlayers.length === 0}
                  stitch={stitch}
                />
              </div>
            )}
          </div>

          {/* Desktop: vertical bench list (hidden below md) */}
          <div
            className={`hidden md:block rounded-2xl p-4 ${stitch ? "stitch-neon-card" : ""}`}
            style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className={`${css.h1} text-base tracking-wide`}>Bench pool</h3>
                <p className="text-[10px] text-atext-dim mt-0.5 leading-snug">
                  Not in the {LINEUP_CAP}. Drag to a slot to add; drop here to remove.
                </p>
              </div>
              <span className="text-[10px] text-atext-mute font-mono font-bold tabular-nums whitespace-nowrap shrink-0">
                {filteredBench.length}{posFilter ? `/${benchPlayers.length}` : ''}
              </span>
            </div>
            {benchPositions.length >= 2 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {benchPositions.map(pos => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPosFilter(p => p === pos ? null : pos)}
                    className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider transition-all"
                    style={posFilter === pos ? posBadgeStyle(pos) : { background: 'var(--A-panel-2)', color: 'var(--A-text-mute)', border: '1px solid var(--A-line)' }}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            )}
            <SortableContext items={benchPlayerIds} strategy={verticalListSortingStrategy}>
              <div className="max-h-[min(52vh,28rem)] overflow-y-auto min-h-[100px] pr-0.5 [scrollbar-width:thin]">
                {benchPlayers.length === 0 ? (
                  <div className="text-[11px] text-atext-mute text-center py-6 px-2 rounded-xl border border-dashed border-aline/80 bg-apanel-2/30">
                    Your full list is already in the match-day {LINEUP_CAP}.
                  </div>
                ) : filteredBench.length === 0 ? (
                  <div className="text-[11px] text-atext-mute text-center py-4">
                    No {posFilter} players on the bench.
                  </div>
                ) : (
                  filteredBench.map((p) => (
                    <SortablePlayerRow
                      key={p.id}
                      player={p}
                      stitch={stitch}
                      onSelect={onSelectPlayer}
                      variant="bench"
                    />
                  ))
                )}
                <TrayDropArea
                  id={BENCH_TRAY_ID}
                  label="Drop to remove from squad"
                  isEmpty={benchPlayers.length === 0}
                  stitch={stitch}
                />
              </div>
            </SortableContext>
          </div>

          <button
            type="button"
            onClick={autoSelect}
            className={
              stitch
                ? "w-full stitch-mock-slant-btn text-xs"
                : "w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.12em] transition-all active:scale-[0.98]"
            }
            style={stitch ? undefined : {
              background: 'color-mix(in srgb, var(--A-accent) 15%, transparent)',
              color: 'var(--A-accent)',
              border: '1px solid color-mix(in srgb, var(--A-accent) 30%, transparent)',
            }}
          >
            Auto-select best 23
          </button>
        </aside>
      </div>

      <DragOverlay>{activePlayer ? dragSummary(activePlayer) : null}</DragOverlay>
    </DndContext>
  );
}

/**
 * Reorder-only sortable list for Tactics tab (same lineup order as career).
 */
export function LineupSortablePanel({ stitch }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const full = useMemo(() => career.lineup || [], [career.lineup]);
  const squad = useMemo(() => career.squad || [], [career.squad]);
  const lineupIds = useMemo(() => full.filter((id) => id != null && id !== ""), [full]);
  const players = useMemo(
    () => lineupIds.map((id) => squad.find((p) => p.id === id)).filter(Boolean),
    [lineupIds, squad],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );
  const [activeId, setActiveId] = useState(null);
  const activePlayer = activeId ? squad.find((p) => String(p.id) === String(activeId)) : null;

  function onDragEnd({ active, over }) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const li = [...lineupIds];
    const oldI = li.indexOf(String(active.id));
    const newI = li.indexOf(String(over.id));
    if (oldI === -1 || newI === -1) return;
    updateCareer({ lineup: arrayMove(li, oldI, newI) });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={`space-y-1.5 max-h-[60vh] overflow-y-auto ${stitch ? "pr-1" : ""}`}>
        <SortableContext items={lineupIds} strategy={verticalListSortingStrategy}>
          {players.length === 0 && (
            <div className="text-sm text-atext-dim text-center py-12">No players selected.</div>
          )}
          {players.map((p) => (
            <SortablePlayerRow
              key={p.id}
              player={p}
              stitch={stitch}
              variant="xxii"
              onSelect={null}
              onRemove={(pl) => updateCareer({ lineup: removeIdFromLineup(full, pl.id) })}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>{activePlayer ? dragSummary(activePlayer) : null}</DragOverlay>
    </DndContext>
  );
}
