import React, { useMemo, useState } from "react";
import { formatDate } from "../lib/calendar.js";

export default function MatchDayScreen({ result, league, career, club, onContinue }) {
  const [revealed, setRevealed] = useState(0);
  const [showEvents, setShowEvents] = useState(true);

  const qLabels = ["Q1", "Q2", "Q3", "Q4"];

  const { cumHome, cumAway, quarters } = useMemo(() => {
    const list = result.quarters || [];
    const cumH = [];
    const cumA = [];
    let hG = 0;
    let hB = 0;
    let aG = 0;
    let aB = 0;
    for (const q of list) {
      hG += q.homeGoals;
      hB += q.homeBehinds;
      aG += q.awayGoals;
      aB += q.awayBehinds;
      cumH.push({ g: hG, b: hB, total: hG * 6 + hB });
      cumA.push({ g: aG, b: aB, total: aG * 6 + aB });
    }
    return { cumHome: cumH, cumAway: cumA, quarters: list };
  }, [result.quarters]);

  const visibleQuarter = revealed === 0 ? 0 : Math.min(revealed, quarters.length);
  const eventFeed = (result.events || []).filter((ev) => ev.q <= visibleQuarter);

  const playerLookup = useMemo(() => {
    const map = {};
    (career.squad || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [career.squad]);

  const momentumEnd = quarters.length
    ? quarters[Math.min(visibleQuarter, quarters.length) - 1]?.momentumEnd ?? 0
    : 0;
  const momentumPct = ((momentumEnd + 1) / 2) * 100;

  const homeClub = result.isHome ? club : result.opp;
  const awayClub = result.isHome ? result.opp : club;
  const myColor = club.colors[0] || "var(--A-accent)";
  const oppColor = result.opp?.colors?.[0] || "#64748B";

  const won = result.won;
  const drew = result.drew;
  const resultLabel = won ? "WIN" : drew ? "DRAW" : "LOSS";
  const resultColor = won ? "#4AE89A" : drew ? "var(--A-accent)" : "#E84A6F";

  const commentary =
    result.isAFL
      ? [
          won
            ? `${club.name} put in a dominant performance today.`
            : drew
              ? "An even contest — both sides had their chances."
              : `A tough day at the office for ${club.name}.`,
          result.myTotal > 80
            ? "The forward line was electric, converting at a high rate."
            : result.myTotal > 60
              ? "A solid if unremarkable offensive effort."
              : "The team struggled to convert inside 50.",
          won && result.myTotal - result.oppTotal > 30
            ? "It was never in doubt from the third quarter on."
            : won
              ? "They held on for a hard-fought victory."
              : "",
          result.isPreseason
            ? "Pre-season result — ladders unaffected."
            : `${league.short} Round ${result.label.replace("Round ", "")}.`,
        ].filter(Boolean)
      : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0F172A 0%, #1E293B 100%)" }}>
      <div className="px-6 py-5 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div
          className="text-[11px] font-bold uppercase tracking-[0.3em] mb-1"
          style={{ color: result.isPreseason ? "#4ADBE8" : "var(--A-accent)" }}
        >
          {result.label} · {career.currentDate ? formatDate(career.currentDate) : ""}
          {result.isPreseason && " · Pre-Season"}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center flex-1">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-display text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg,${homeClub?.colors?.[0] || "var(--A-accent)"},${homeClub?.colors?.[1] || "#D07A2A"})`,
                color: homeClub?.colors?.[2] || "#FFF",
              }}
            >
              {homeClub?.short}
            </div>
            <div className="text-white font-bold text-sm">{homeClub?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">HOME</div>
          </div>

          <div className="text-center px-6">
            <div className="font-display text-6xl leading-none" style={{ color: resultColor }}>
              {result.homeTotal} – {result.awayTotal}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: resultColor }}>
              {resultLabel}
            </div>
          </div>

          <div className="text-center flex-1">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-display text-2xl mb-2"
              style={{
                background: `linear-gradient(135deg,${awayClub?.colors?.[0] || "#64748B"},${awayClub?.colors?.[1] || "#475569"})`,
                color: awayClub?.colors?.[2] || "#FFF",
              }}
            >
              {awayClub?.short}
            </div>
            <div className="text-white font-bold text-sm">{awayClub?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">AWAY</div>
          </div>
        </div>
      </div>

      {result.events && result.events.length > 0 && (
        <div className="px-6 py-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Momentum {visibleQuarter > 0 ? `· End of ${qLabels[visibleQuarter - 1]}` : ""}
            </div>
            <div className="text-[10px] text-slate-400">
              {momentumEnd > 0.15
                ? `${(result.isHome ? club.short : result.opp?.short) || "Home"} on top`
                : momentumEnd < -0.15
                  ? `${(result.isHome ? result.opp?.short : club.short) || "Away"} on top`
                  : "Even contest"}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div
              className="h-full"
              style={{ width: `${momentumPct}%`, background: "linear-gradient(90deg,#4ADBE8,#4AE89A)" }}
            />
            <div
              className="h-full"
              style={{ width: `${100 - momentumPct}%`, background: "linear-gradient(90deg,#E84A6F,#A78BFA)" }}
            />
          </div>
        </div>
      )}

      {result.events && result.events.length > 0 && (
        <div className="px-6 max-w-2xl mx-auto w-full">
          <button
            onClick={() => setShowEvents((s) => !s)}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-aaccent flex items-center gap-1 mb-2"
          >
            {showEvents ? "▾" : "▸"} Broadcast Feed
            {result.events.filter((e) => e.kind === "moment").length > 0 && (
              <span className="text-[9px] text-slate-400 ml-2">
                {result.events.filter((e) => e.kind === "moment").length} key moments
              </span>
            )}
          </button>
          {showEvents && (
            <div
              className="rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {eventFeed.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-3">Waiting for first quarter…</div>
              )}
              {eventFeed
                .slice()
                .reverse()
                .map((ev, i) => {
                  const player = ev.scorer
                    ? playerLookup[ev.scorer]
                    : ev.playerId
                      ? playerLookup[ev.playerId]
                      : null;
                  const sideMine = (result.isHome ? "home" : "away") === ev.side;
                  const color =
                    ev.kind === "goal"
                      ? "#4AE89A"
                      : ev.kind === "behind"
                        ? "var(--A-accent)"
                        : ev.kind === "moment"
                          ? "#A78BFA"
                          : "#64748B";
                  const icon =
                    ev.kind === "goal" ? "⚽" : ev.kind === "behind" ? "○" : ev.kind === "miss" ? "×" : "✦";
                  let label = "";
                  if (ev.kind === "goal") label = "GOAL";
                  else if (ev.kind === "behind") label = "Behind";
                  else if (ev.kind === "miss") label = "Out on the full / OOB";
                  else if (ev.kind === "moment") label = ev.text;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs py-1 px-2 rounded"
                      style={{ background: i === 0 ? `${color}10` : "transparent" }}
                    >
                      <span className="text-[9px] font-mono text-slate-500 w-12 flex-shrink-0">
                        Q{ev.q} {String(ev.minute % 25).padStart(2, "0")}
                        {"'"}
                      </span>
                      <span style={{ color }} className="font-bold w-4">
                        {icon}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider font-bold w-12 flex-shrink-0"
                        style={{ color: sideMine ? "#4AE89A" : "#E84A6F" }}
                      >
                        {sideMine ? club.short : result.opp?.short || "OPP"}
                      </span>
                      <span className="text-slate-300 flex-1 truncate">
                        {player
                          ? `${player.firstName ? player.firstName[0] + ". " : ""}${player.lastName || player.name || ""}: `
                          : ""}
                        {label}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
            Quarter by Quarter
          </div>
          {quarters.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-4">No quarter data available.</div>
          )}
          <div className="space-y-3">
            {quarters.map((q, i) => {
              const isShowing = i < revealed || revealed === quarters.length;
              const hCum = cumHome[i] || { g: 0, b: 0, total: 0 };
              const aCum = cumAway[i] || { g: 0, b: 0, total: 0 };
              const qWinner = hCum.total > aCum.total ? "home" : aCum.total > hCum.total ? "away" : "draw";
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 transition-all duration-300 ${isShowing ? "opacity-100" : "opacity-0 translate-y-2"}`}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{qLabels[i]}</div>
                    {isShowing && (
                      <div className="text-[10px] text-slate-500">
                        {q.homeGoals}.{q.homeBehinds} — {q.awayGoals}.{q.awayBehinds} (this qtr)
                      </div>
                    )}
                  </div>
                  {isShowing && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-right flex-1">
                        <span
                          className="font-display text-3xl"
                          style={{ color: result.isHome ? myColor : oppColor }}
                        >
                          {hCum.total}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {hCum.g}.{hCum.b}
                        </div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: qWinner === (result.isHome ? "home" : "away") ? "#4AE89A22" : "#64748B22",
                          color: qWinner === (result.isHome ? "home" : "away") ? "#4AE89A" : "#64748B",
                        }}
                      >
                        {qWinner === "draw" ? "=" : qWinner === (result.isHome ? "home" : "away") ? "▲" : "▼"}
                      </div>
                      <div className="text-left flex-1">
                        <span
                          className="font-display text-3xl"
                          style={{ color: result.isHome ? oppColor : myColor }}
                        >
                          {aCum.total}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {aCum.g}.{aCum.b}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {quarters.length > 0 && revealed < quarters.length && (
            <button
              onClick={() => setRevealed((r) => Math.min(r + 1, quarters.length))}
              className="mt-4 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition-all"
              style={{
                background: "rgba(232,154,74,0.15)",
                color: "var(--A-accent)",
                border: "1px solid rgba(232,154,74,0.3)",
              }}
            >
              Show {qLabels[revealed]} →
            </button>
          )}
        </div>

        {result.isAFL && commentary.length > 0 && revealed === quarters.length && (
          <div
            className="rounded-2xl p-4 mt-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
              Match Commentary
            </div>
            <div className="space-y-2">
              {commentary.map((line, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-aaccent flex-shrink-0">›</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {revealed < quarters.length && quarters.length > 0 ? (
            <button
              onClick={() => setRevealed(quarters.length)}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 uppercase tracking-widest"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Skip to Full Time
            </button>
          ) : null}
          <button
            onClick={onContinue}
            className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-white transition-all"
            style={{
              background: `linear-gradient(135deg,${resultColor}CC,${resultColor})`,
              boxShadow: `0 4px 20px ${resultColor}44`,
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
