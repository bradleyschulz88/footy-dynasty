import React, { useMemo, useState } from "react";
import { GripVertical, X } from "lucide-react";
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
  removeIdFromLineup,
  addIdToLineupAt,
  insertIdAtLineupSlot,
  dedupeLineup,
} from "../lib/lineupHelpers.js";
import { countLineBucketsFromLineup } from "../lib/lineupBalance.js";
import { RatingDot, Pill, css } from "./primitives.jsx";
import { LineupOvalField } from "./LineupOvalField.jsx";

const BENCH_TRAY_ID = "bench-tray";

/** Prefer pointer target (oval zones) then fall back to list sorting. */
function lineupCollision(args) {
  const pw = pointerWithin(args);
  if (pw.length > 0) return pw;
  return closestCorners(args);
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full flex items-center gap-1 px-2 py-2.5 min-h-[48px] rounded-xl border border-aline bg-apanel mb-1 touch-manipulation"
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
          <span className="text-[9px] px-1 py-0.5 bg-aline rounded font-bold text-center flex-shrink-0 max-w-[4rem] truncate">
            {formatPositionSlash(player)}
          </span>
          <span className="text-sm font-semibold text-atext truncate">{pName(player)}</span>
          <span className="text-xs text-atext-mute ml-auto">{player.age}</span>
          <RatingDot value={player.overall} size="sm" />
        </button>
      ) : (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-[9px] px-1 py-0.5 bg-aline rounded font-bold text-center flex-shrink-0 max-w-[4rem] truncate">
            {formatPositionSlash(player)}
          </span>
          <span className="text-sm font-semibold text-atext truncate">{pName(player)}</span>
          <span className="text-xs text-atext-mute ml-auto">{player.age}</span>
          <RatingDot value={player.overall} size="sm" />
        </div>
      )}
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
      <RatingDot value={activePlayer.overall} size="sm" />
    </div>
  );
}


/**
 * Bench ↔ match squad (18 + 5) builder for Squad → Players tab.
 */
export function SquadLineupBuilder({ career, updateCareer, benchPlayerIds, stitch, onSelectPlayer }) {
  const lineup = career.lineup || [];
  const squad = career.squad || [];
  const selectedCount = lineupPlayerCount(lineup);
  const benchPlayers = useMemo(
    () => benchPlayerIds.map((id) => squad.find((p) => p.id === id)).filter(Boolean),
    [benchPlayerIds, squad],
  );
  const buckets = useMemo(() => countLineBucketsFromLineup(squad, lineup), [squad, lineup]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );
  const [activeId, setActiveId] = useState(null);
  const activePlayer = activeId ? squad.find((p) => p.id === activeId) : null;

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
    const iB = bIds.indexOf(aid);
    const oB = bIds.indexOf(oid);

    const destSlot = lineupSlotIndexFromId(oid);
    if (destSlot != null) {
      const count = lineupPlayerCount(li);
      if (iB !== -1) {
        if (count >= LINEUP_CAP && !lineupHasPlayer(li, aid)) return;
        updateCareer({ lineup: dedupeLineup(insertIdAtLineupSlot(li, aid, destSlot)) });
        return;
      }
      if (iL !== -1) {
        updateCareer({ lineup: dedupeLineup(insertIdAtLineupSlot(li, aid, destSlot)) });
        return;
      }
    }

    if (iL !== -1 && oL !== -1) {
      const to = li.findIndex((x) => x != null && String(x) === oid);
      if (to >= 0) updateCareer({ lineup: dedupeLineup(addIdToLineupAt(li, aid, to)) });
      return;
    }
    if (iB !== -1 && oB !== -1) {
      return;
    }
    if (iB !== -1 && oL !== -1) {
      const to = li.findIndex((x) => x != null && String(x) === oid);
      if (to < 0) return;
      if (lineupPlayerCount(li) >= LINEUP_CAP && !lineupHasPlayer(li, aid)) return;
      updateCareer({ lineup: dedupeLineup(addIdToLineupAt(li, aid, to)) });
      return;
    }
    if (iL !== -1 && oB !== -1) {
      updateCareer({ lineup: removeIdFromLineup(li, aid) });
      return;
    }
    if (iL !== -1 && oid === BENCH_TRAY_ID) {
      updateCareer({ lineup: removeIdFromLineup(li, aid) });
      return;
    }
  }

  function onDragCancel() {
    setActiveId(null);
  }

  const autoSelect = () => {
    updateCareer({
      lineup: [...squad].sort((a, b) => b.overall - a.overall).slice(0, LINEUP_CAP).map((p) => p.id),
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={lineupCollision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <LineupOvalField
        squad={squad}
        lineupIds={lineup}
        stitch={stitch}
        onSelectPlayer={onSelectPlayer}
      />
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5`}>
        <div
          className={`rounded-2xl p-4 ${stitch ? "stitch-neon-card" : ""}`}
          style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className={`${css.h1} text-lg tracking-wide`}>MATCH SQUAD</h3>
            <Pill color={selectedCount >= LINEUP_CAP ? "#4AE89A" : "var(--A-accent)"}>
              {selectedCount}/{LINEUP_CAP}
            </Pill>
          </div>
          <p className="text-[11px] text-atext-dim mb-3 leading-snug">
            Ground map: <span className="text-atext font-semibold">15 + 3</span> on-field (oval + followers) +{" "}
            <span className="text-atext font-semibold">5 interchange</span>. Drag from the bench onto a slot, or move
            chips between slots.
          </p>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-mono text-atext-dim uppercase">
            <span>Fwd {buckets.fwd}</span>
            <span>·</span>
            <span>Mid {buckets.mid}</span>
            <span>·</span>
            <span>Back {buckets.back}</span>
            <span>·</span>
            <span>Ruck {buckets.ruck}</span>
          </div>
        </div>

        <div
          className={`rounded-2xl p-4 ${stitch ? "stitch-neon-card" : ""}`}
          style={stitch ? undefined : { border: "1px solid var(--A-line)", background: "var(--A-panel)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${css.h1} text-lg tracking-wide`}>BENCH</h3>
            <span className="text-[10px] text-atext-mute font-mono">{benchPlayers.length} available</span>
          </div>
          <p className="text-[11px] text-atext-dim mb-3">
            Drag onto a map slot (max {LINEUP_CAP}). Drag back here to remove from the match squad.
          </p>
          <SortableContext items={benchPlayerIds} strategy={verticalListSortingStrategy}>
            <div className="max-h-[42vh] overflow-y-auto min-h-[120px] pr-1">
              {benchPlayers.map((p) => (
                <SortablePlayerRow
                  key={p.id}
                  player={p}
                  stitch={stitch}
                  onSelect={onSelectPlayer}
                  variant="bench"
                />
              ))}
              <TrayDropArea
                id={BENCH_TRAY_ID}
                label="Drop to remove from squad"
                isEmpty={benchPlayers.length === 0}
                stitch={stitch}
              />
            </div>
          </SortableContext>
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={autoSelect}
          className={stitch ? "stitch-mock-slant-btn" : `${css.btnGhost} text-xs px-4 py-2`}
        >
          Auto-select match squad (by rating)
        </button>
      </div>

      <DragOverlay>{activePlayer ? dragSummary(activePlayer) : null}</DragOverlay>
    </DndContext>
  );
}

/**
 * Reorder-only sortable list for Tactics tab (same lineup order as career).
 */
export function LineupSortablePanel({ career, updateCareer, stitch }) {
  const full = career.lineup || [];
  const squad = career.squad || [];
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
  const activePlayer = activeId ? squad.find((p) => p.id === activeId) : null;

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
