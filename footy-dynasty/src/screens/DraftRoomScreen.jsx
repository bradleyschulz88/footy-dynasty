import React, { useEffect, useMemo, useState } from "react";
import { Clock, SkipForward, X, Award } from "lucide-react";
import { findClub } from "../data/pyramid.js";
import { POSITIONS, formatPositionSlash } from "../lib/playerGen.js";
import { fmtK } from "../lib/format.js";
import { formatDate } from "../lib/calendar.js";
import { css, Bar, RatingDot, Pill, Stat } from "../components/primitives.jsx";
import { ClubBadge } from "../components/ClubBadge.jsx";
import {
  COMBINE_SCOUT_COST,
  displayDraftOverall,
  displayDraftPotential,
  displayDraftWageEstimate,
  applyCombineScoutingRound,
  scoutRevealTier,
} from "../lib/draftScouting.js";
import {
  rookieDraftWage,
  canAffordSigning,
  leagueTierOf,
} from "../lib/finance/engine.js";
import {
  ensureDraftSeeded,
  needsDraftSeed,
  isPlayerDraftTurn,
  isDraftLive,
  isDraftScoutingPhase,
  nationalDraftDayDate,
  getOnClockPick,
  getPlayerNextPick,
  resolveNextPick,
  skipCurrentPick,
  draftProspectOnClock,
  startDraftSessionPatch,
} from "../lib/draftEngine.js";

export default function DraftRoomScreen({ career, club, league, updateCareer, onExit }) {
  const [posFilter, setPosFilter] = useState("ALL");
  const [poolSort, setPoolSort] = useState("overall");
  const dTier = leagueTierOf(career);

  useEffect(() => {
    if (!career || !league) return;
    if (needsDraftSeed(career)) {
      const patch = ensureDraftSeeded(career, league);
      if (patch) updateCareer(patch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- seed once on mount

  const draftOrder = career.draftOrder || [];
  const scoutingPhase = isDraftScoutingPhase(career);
  const draftLive = isDraftLive(career);
  const onClock = getOnClockPick(career);
  const myNext = getPlayerNextPick(career);
  const onClockClub = onClock ? findClub(onClock.clubId) : null;
  const isMyTurn = isPlayerDraftTurn(career);
  const draftComplete = career.draftPhase === "complete";
  const draftDayLabel = formatDate(nationalDraftDayDate(career));
  const history = career.draftHistory || [];

  const basePool = useMemo(() => {
    let arr = [...(career.draftPool || [])];
    if (posFilter !== "ALL") {
      arr = arr.filter((p) => p.position === posFilter || p.secondaryPosition === posFilter);
    }
    arr.sort((a, b) => {
      if (poolSort === "overall") return b.overall - a.overall;
      if (poolSort === "potential") return (b.potential || 0) - (a.potential || 0);
      if (poolSort === "wageFit") return rookieDraftWage(a.overall, dTier) - rookieDraftWage(b.overall, dTier);
      return b.overall - a.overall;
    });
    return arr;
  }, [career.draftPool, posFilter, poolSort, dTier]);

  const startDraft = () => {
    updateCareer(startDraftSessionPatch(career, league));
  };

  const runCombineScout = () => {
    const pool = career.draftPool || [];
    if (!pool.length || (career.finance?.cash ?? 0) < COMBINE_SCOUT_COST) return;
    updateCareer({
      finance: { ...career.finance, cash: career.finance.cash - COMBINE_SCOUT_COST },
      draftPool: applyCombineScoutingRound(pool),
      news: [
        { week: career.week, type: "info", text: `🔭 Combine scouting (−${fmtK(COMBINE_SCOUT_COST)})` },
        ...(career.news || []),
      ].slice(0, 20),
    });
  };

  const nextPick = () => {
    const patch = resolveNextPick(career);
    if (patch) updateCareer(patch);
  };

  const passPick = () => {
    if (!isMyTurn) return;
    const patch = skipCurrentPick(career);
    if (patch) updateCareer(patch);
  };

  const pickProspect = (p) => {
    if (!draftLive || !isMyTurn) return;
    const result = draftProspectOnClock(career, club, p);
    if (result.error === "cap") {
      updateCareer({
        news: [
          { week: career.week, type: "loss", text: `⚖️ Cannot draft ${p.firstName} ${p.lastName} — over salary cap` },
          ...(career.news || []),
        ].slice(0, 20),
      });
      return;
    }
    if (result.error) return;
    updateCareer(result.patch);
  };

  if (needsDraftSeed(career) && !draftOrder.length) {
    return (
      <div className="anim-in max-w-lg mx-auto py-16 text-center space-y-6">
        <Award className="w-16 h-16 mx-auto text-aaccent opacity-80" />
        <div>
          <div className={`${css.h1} text-3xl`}>NATIONAL DRAFT</div>
          <p className="text-sm text-atext-dim mt-2">No draft pool is loaded for this save. Start the draft to generate prospects and pick order.</p>
        </div>
        <button type="button" onClick={startDraft} className={`${css.btnPrimary} px-8 py-3 min-h-[48px]`}>
          Start national draft
        </button>
        {onExit && (
          <button type="button" onClick={onExit} className={`${css.btnGhost} text-sm`}>
            Back to recruit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="anim-in space-y-4 touch-manipulation">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>DRAFT ROOM</div>
          <p className="text-xs text-atext-dim mt-1">
            {draftComplete
              ? "Draft complete — review results or return to recruit."
              : scoutingPhase
                ? `Combine scouting — draft opens ${draftDayLabel}. Scout prospects before picks begin.`
                : draftLive
                  ? isMyTurn
                    ? `You are on the clock — pick #${onClock?.pick} (round ${onClock?.round || 1}).`
                    : onClock
                      ? `${onClockClub?.short || onClock.clubId} on the clock — pick #${onClock.pick}.`
                      : "Waiting for draft order…"
                  : "Draft pool loading…"}
            {draftLive && myNext && !isMyTurn && ` Your next: #${myNext.pick}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExit && (
            <button type="button" onClick={onExit} className={`${css.btnGhost} text-xs px-3 py-2 min-h-[40px] flex items-center gap-1`}>
              <X className="w-4 h-4" /> Exit
            </button>
          )}
        </div>
      </div>

      {scoutingPhase && (
        <div className="rounded-2xl p-4 border border-aaccent/40" style={{ background: "rgba(0,224,255,0.06)" }}>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-aaccent mb-1">Scouting window</div>
          <div className="text-sm text-atext">Picks are locked until <span className="font-semibold">{draftDayLabel}</span>. Run combine scouting to reveal ratings, then advance to National Draft Day.</div>
        </div>
      )}

      {/* On the clock banner */}
      {draftLive && !draftComplete && onClock && (
        <div
          className={`rounded-2xl p-4 border-2 flex flex-wrap items-center justify-between gap-4 ${isMyTurn ? "border-aaccent" : "border-aline"}`}
          style={{ background: isMyTurn ? "rgba(0,224,255,0.08)" : "var(--A-panel-2)" }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMyTurn ? "bg-aaccent/20" : "bg-apanel"}`}>
              <Clock className={`w-6 h-6 ${isMyTurn ? "text-aaccent" : "text-atext-dim"}`} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute">
                {isMyTurn ? "On the clock" : "On the clock"}
              </div>
              <div className="font-display text-2xl text-atext flex items-center gap-2">
                {onClockClub ? <ClubBadge club={onClockClub} size="sm" /> : null}
                <span>{isMyTurn ? (club?.short || "YOU") : (onClockClub?.short || onClock.clubId)}</span>
                <span className="text-aaccent font-mono text-lg">#{onClock.pick}</span>
                <span className="text-xs text-atext-dim font-sans">R{onClock.round || 1}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMyTurn && (
              <button type="button" onClick={nextPick} className={`${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px] flex items-center gap-1`}>
                <SkipForward className="w-4 h-4" /> Next pick
              </button>
            )}
            {isMyTurn && (
              <button type="button" onClick={passPick} className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold border border-aline bg-apanel-2 text-atext hover:bg-apanel">
                Skip pick (pass)
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <div className="flex flex-wrap gap-2 items-center">
            <Stat label="Pool" value={basePool.length} accent="#4AE89A" />
            <Stat label="Picks left" value={draftOrder.filter((d) => !d.used).length} accent="var(--A-accent)" />
            {!draftComplete && (career.finance?.cash ?? 0) >= COMBINE_SCOUT_COST && (
              <button type="button" onClick={runCombineScout} className={`${css.btnGhost} text-xs px-3 py-2 ml-auto`}>
                Scout combine (−{fmtK(COMBINE_SCOUT_COST)})
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {["ALL", ...POSITIONS].map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosFilter(pos)}
                className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold ${posFilter === pos ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim"}`}
              >
                {pos}
              </button>
            ))}
            <select value={poolSort} onChange={(e) => setPoolSort(e.target.value)} className="ml-auto bg-apanel-2 border border-aline rounded-lg px-3 py-1.5 text-xs text-atext">
              <option value="overall">Overall</option>
              <option value="potential">Potential</option>
              <option value="wageFit">Rookie wage</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {basePool.length === 0 ? (
              <div className={`${css.panel} p-8 text-center text-sm text-atext-dim`}>No prospects left in the pool.</div>
            ) : (
              basePool.slice(0, 40).map((p, i) => {
                const st = scoutRevealTier(p);
                const rw = rookieDraftWage(p.overall, dTier);
                const capOk = canAffordSigning(career, rw);
                const oDisp = displayDraftOverall(p);
                const potDisp = displayDraftPotential(p);
                const wageDisp = displayDraftWageEstimate(rw, st);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 flex flex-wrap items-center justify-between gap-3 ${isMyTurn ? "border-aline hover:border-aaccent/50" : "border-aline opacity-90"}`}
                    style={{ background: "var(--A-panel)" }}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-aaccent font-bold">#{i + 1}</div>
                      <div className="font-semibold text-atext">{p.firstName} {p.lastName}</div>
                      <div className="text-xs text-atext-dim mt-0.5">{formatPositionSlash(p)} · age {p.age}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {st >= 3 ? <RatingDot value={p.overall} size="sm" /> : <span className="font-bold">{oDisp.label}</span>}
                      <span className="text-xs text-[#4AE89A]">Pot {st >= 3 ? p.potential : potDisp.label}</span>
                      <span className="text-xs font-mono" style={{ color: capOk ? "#4AE89A" : "#E84A6F" }}>{wageDisp.label}</span>
                      {draftLive && isMyTurn && (
                        <button type="button" onClick={() => pickProspect(p)} className={`${css.btnPrimary} text-xs px-3 py-2 min-h-[40px]`}>
                          Draft
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-3 lg:sticky lg:top-20">
          <div className={`${css.panel} p-4`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute mb-2">Pick feed</div>
            {history.length === 0 ? (
              <p className="text-xs text-atext-dim">Picks will appear here as the draft runs.</p>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {history.slice(0, 15).map((h) => (
                  <div key={`${h.pick}-${h.clubId}-${h.prospectName}`} className="text-xs flex gap-2 items-start border-b border-aline pb-2 last:border-0">
                    <span className="font-mono text-atext-mute shrink-0">#{h.pick}</span>
                    <div className="min-w-0">
                      <span className="font-semibold text-atext">{h.clubShort}</span>
                      <span className="text-atext-dim"> — </span>
                      <span className={h.skipped ? "text-atext-mute italic" : "text-atext"}>
                        {h.skipped ? "PASS" : h.prospectName}
                        {!h.skipped && h.overall != null ? ` (${h.overall})` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${css.panel} p-4`}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute mb-2">Next on board</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {draftOrder.filter((d) => !d.used).slice(0, 8).map((d) => {
                const c = findClub(d.clubId);
                const clock = d.pick === onClock?.pick;
                return (
                  <div
                    key={d.pick}
                    className="flex-shrink-0 px-2 py-2 rounded-lg text-xs"
                    style={{
                      background: d.clubId === career.clubId ? "rgba(0,224,255,0.12)" : "var(--A-panel-2)",
                      border: `1px solid ${clock ? "var(--A-accent)" : "var(--A-line)"}`,
                      minWidth: 88,
                    }}
                  >
                    <div className="font-mono text-[9px] text-atext-mute">#{d.pick} R{d.round || 1}</div>
                    <div className="font-display text-sm">{c?.short || d.clubId}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}