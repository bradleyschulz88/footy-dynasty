import React from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { findClub } from "../data/pyramid.js";
import {
  TRAINING_INFO,
  formatDate,
  formatMonth,
  daysInMonth,
  startOfMonth,
  getDayOfWeek,
  prevMonth,
  nextMonth,
  addDays,
} from "../lib/calendar.js";
import { css } from "../components/primitives.jsx";
import { ClubBadge } from "../components/ClubBadge.jsx";

// Compute ladder position map: clubId -> position (1-based)
function ladderPositionMap(ladder) {
  if (!ladder || !ladder.length) return {};
  const sorted = [...ladder].sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0) || (b.pct ?? 0) - (a.pct ?? 0) || (b.F ?? 0) - (a.F ?? 0));
  const map = {};
  sorted.forEach((row, i) => { map[row.id] = i + 1; });
  return map;
}

function difficultyPill(pos) {
  if (!pos) return null;
  if (pos <= 4) return { label: "TOUGH", color: "#E84A6F" };
  if (pos <= 8) return { label: "HARD", color: "#FFB347" };
  return { label: "OK", color: "#4ADE80" };
}

// Days until a date string from today
function daysUntil(dateStr, today) {
  const d1 = new Date(today);
  const d2 = new Date(dateStr);
  return Math.round((d2 - d1) / 86400000);
}

export default function ScheduleScreen({ career, club: _club, league: _league, onOpenCompetition, onNavigate }) {
  const startDate = career.currentDate || `${career.season - 1}-12-01`;
  const [viewDate, setViewDate] = React.useState(startOfMonth(startDate));
  const [selectedDate, setSelectedDate] = React.useState(startDate);

  React.useEffect(() => {
    const anchor = career.currentDate || `${career.season - 1}-12-01`;
    setViewDate(startOfMonth(anchor));
    setSelectedDate(anchor);
  }, [career.season, career.currentDate]);

  const goToToday = () => {
    const anchor = career.currentDate || `${career.season - 1}-12-01`;
    setViewDate(startOfMonth(anchor));
    setSelectedDate(anchor);
  };

  const allEvents = career.eventQueue || [];
  const eventsByDate = {};
  allEvents.forEach((ev) => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  const monthStart = startOfMonth(viewDate);
  const firstDow = getDayOfWeek(monthStart);
  const totalDays = daysInMonth(viewDate);
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) {
    const y = viewDate.slice(0, 4);
    const m = viewDate.slice(5, 7);
    cells.push(`${y}-${m}-${String(d).padStart(2, "0")}`);
  }

  const today = career.currentDate || startDate;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const upcoming = allEvents.filter((e) => !e.completed && e.date >= today).slice(0, 15);

  const weekStrip = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today, i)), [today]);

  // Ladder position map for difficulty ratings
  const ladderPos = React.useMemo(() => ladderPositionMap(career.ladder), [career.ladder]);

  // Find next round event for hero card
  const nextRound = React.useMemo(() => {
    return allEvents.find((e) => !e.completed && e.date >= today && e.type === "round" &&
      (e.matches || []).some((m) => m.home === career.clubId || m.away === career.clubId));
  }, [allEvents, today, career.clubId]);

  function getMatchInfo(ev) {
    if (!ev || ev.type !== "round") return null;
    const m = (ev.matches || []).find((m2) => m2.home === career.clubId || m2.away === career.clubId);
    if (!m) return null;
    const oppId = m.home === career.clubId ? m.away : m.home;
    const opp = findClub(oppId);
    const isHome = m.home === career.clubId;
    return { opp, oppId, isHome, match: m };
  }

  function evDot(ev) {
    if (ev.type === "training") {
      const info = TRAINING_INFO[ev.subtype];
      const attrStr = info?.attrs?.length ? ` · ${info.attrs.join(", ")}` : "";
      return {
        color: info?.color || "#94A3B8",
        icon: info?.icon || "🏋️",
        label: (info?.name || ev.subtype) + attrStr,
        oppClub: null,
        trainingInfo: info || null,
      };
    }
    if (ev.type === "key_event")
      return { color: "var(--A-accent-2)", icon: "📅", label: ev.name, oppClub: null, trainingInfo: null };
    if (ev.type === "preseason_match")
      return { color: "#E84A6F", icon: "🏉", label: ev.label, oppClub: null, trainingInfo: null };
    if (ev.type === "round") {
      const mi = getMatchInfo(ev);
      const opp = mi?.opp || null;
      const isHome = mi?.isHome ?? true;
      return {
        color: "var(--A-accent)",
        icon: "🏉",
        label: opp ? `Rd ${ev.round} · ${isHome ? "Home" : "Away"}` : `Rd ${ev.round}`,
        oppClub: opp || null,
        trainingInfo: null,
      };
    }
    return { color: "#94A3B8", icon: "●", label: "Event", oppClub: null, trainingInfo: null };
  }

  // Result badge for completed rounds
  function resultBadge(ev) {
    if (!ev.completed || ev.type !== "round") return null;
    const result = ev.result; // expect "W", "L", "D" or similar
    if (!result) return null;
    const r = String(result).toUpperCase();
    if (r === "W") return { text: "W", color: "#4ADE80" };
    if (r === "L") return { text: "L", color: "#E84A6F" };
    return { text: "D", color: "#FFB347" };
  }

  // Next round hero card
  const nextRoundInfo = nextRound ? getMatchInfo(nextRound) : null;
  const nextRoundOppPos = nextRoundInfo?.oppId ? ladderPos[nextRoundInfo.oppId] : null;
  const nextRoundDiff = difficultyPill(nextRoundOppPos);
  const nextRoundDays = nextRound ? daysUntil(nextRound.date, today) : null;

  return (
    <div className="anim-in space-y-5 touch-manipulation">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={`${css.h1} text-3xl`}>SEASON CALENDAR</h1>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {typeof onOpenCompetition === "function" && (
            <button type="button" onClick={() => onOpenCompetition()} className={`${css.btnGhost} text-[11px] px-3 py-2 whitespace-nowrap`}>
              Standings & ladder →
            </button>
          )}
          <button type="button" onClick={goToToday} className={`${css.btnGhost} text-[11px] px-3 py-2 whitespace-nowrap`}>
            Today
          </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewDate(prevMonth(viewDate))}
            className={css.btnGhost + " p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-display text-xl tracking-wide text-atext min-w-[180px] text-center">
            {formatMonth(viewDate)}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(nextMonth(viewDate))}
            className={css.btnGhost + " p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"}
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        </div>
      </div>

      {/* Next Match Hero Card */}
      {nextRound && nextRoundInfo && (
        <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(135deg, var(--A-panel) 0%, var(--A-panel-2) 100%)", border: "1px solid var(--A-line)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              {nextRoundInfo.opp && (
                <div className="flex-shrink-0">
                  <ClubBadge club={nextRoundInfo.opp} size="lg" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-1">
                  Next Match · Round {nextRound.round}
                </div>
                <div className="font-display text-2xl md:text-3xl text-atext leading-tight truncate">
                  {nextRoundInfo.opp?.name || "Opponent"}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-atext-dim">
                    {nextRoundInfo.isHome ? "Home" : "Away"} · {formatDate(nextRound.date)}
                  </span>
                  {nextRoundDiff && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: `${nextRoundDiff.color}22`, color: nextRoundDiff.color, border: `1px solid ${nextRoundDiff.color}40` }}>
                      {nextRoundDiff.label}
                    </span>
                  )}
                  {nextRoundOppPos && (
                    <span className="text-[10px] font-mono text-atext-mute">#{nextRoundOppPos} on ladder</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                <div className="font-display text-3xl leading-none" style={{ color: "var(--A-accent)" }}>
                  {nextRoundDays === 0 ? "TODAY" : nextRoundDays === 1 ? "1" : String(nextRoundDays)}
                </div>
                {nextRoundDays > 1 && <div className="text-[10px] text-atext-mute font-mono uppercase tracking-wider">days away</div>}
              </div>
              {typeof onNavigate === "function" ? (
                <button type="button" onClick={() => onNavigate("squad")} className={`${css.btnGhost} text-[11px] px-3 py-2 flex items-center gap-1.5 whitespace-nowrap`}>
                  <Users className="w-3.5 h-3.5" /> View Squad →
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-atext-mute px-3 py-2 rounded-xl border" style={{ borderColor: "var(--A-line)" }}>
                  <Users className="w-3.5 h-3.5" /> View Squad →
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`${css.panel} p-3 md:p-4`}>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute mb-2">This week</div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {weekStrip.map((iso) => {
            const dayEvs = eventsByDate[iso] || [];
            const isToday = iso === today;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => { setViewDate(startOfMonth(iso)); setSelectedDate(iso); }}
                className={`flex-shrink-0 rounded-xl border px-3 py-2 min-h-[72px] min-w-[4.25rem] text-left transition-colors ${
                  isToday ? "ring-2 ring-[var(--A-accent)] border-transparent" : iso === selectedDate ? "ring-2 ring-[var(--A-accent-2)] border-transparent" : "border-[var(--A-line)]"
                }`}
                style={{
                  background: isToday ? "color-mix(in srgb, var(--A-accent) 12%, transparent)" : "var(--A-panel-2)",
                }}
              >
                <div className={`text-lg font-bold leading-none ${isToday ? "text-aaccent" : "text-atext"}`}>
                  {iso.slice(8)}
                </div>
                <div className="text-[10px] text-atext-mute mt-1 leading-tight">
                  {formatDate(iso).split(",")[0]?.trim()}
                </div>
                {dayEvs.length > 0 && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap">
                    {dayEvs.slice(0, 3).map((ev, j) => {
                      const d = evDot(ev);
                      return (
                        <span
                          key={ev.id ? `${ev.id}-${j}` : `${iso}-dot-${j}`}
                          className="w-2 h-2 rounded-full"
                          style={{ background: d.color }}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`${css.panel} lg:col-span-2 p-2 md:p-4 overflow-x-auto`}>
          <div className="min-w-[420px]">
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-bold uppercase tracking-widest text-atext-mute py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((dateStr, i) => {
                if (!dateStr) return <div key={`empty-${i}`} />;
                const dayEvs = eventsByDate[dateStr] || [];
                const isTodayCell = dateStr === today;
                const isPast = dateStr < today;
                const isSelected = dateStr === selectedDate;
                return (
                  <div
                    key={dateStr}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDate(dateStr)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedDate(dateStr); } }}
                    className={`rounded-lg p-1.5 min-h-[76px] sm:min-h-[72px] transition-all cursor-pointer ${
                      isTodayCell ? "ring-2 ring-[var(--A-accent)]" : isSelected ? "ring-2 ring-[var(--A-accent-2)]" : ""
                    }`}
                    style={{
                      background: isTodayCell
                        ? "color-mix(in srgb, var(--A-accent) 10%, transparent)"
                        : isPast && dayEvs.length
                          ? "var(--A-panel)"
                          : "var(--A-panel-2)",
                      border: "1px solid var(--A-line)",
                    }}
                  >
                    <div
                      className={`text-xs font-bold mb-1 ${
                        isTodayCell ? "text-aaccent" : "text-atext-mute"
                      }`}
                    >
                      {dateStr.slice(8)}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvs.slice(0, 3).map((ev, ei) => {
                        const dot = evDot(ev);
                        const dk = ev.id ? `${ev.id}-${ei}` : `${dateStr}-${ev.type}-${ei}`;
                        return (
                          <div
                            key={dk}
                            className="rounded-md text-[10px] font-bold px-1 py-1 leading-tight min-h-[36px] flex items-center gap-1"
                            style={{
                              background: `${dot.color}18`,
                              color: dot.color,
                              opacity: ev.completed ? 0.4 : 1,
                            }}
                          >
                            {dot.oppClub ? <ClubBadge club={dot.oppClub} size="xs" /> : <span>{dot.icon}</span>}
                            <span className="truncate min-w-0">
                              {ev.type === "training" ? (dot.trainingInfo?.name || ev.subtype) : dot.label}
                            </span>
                          </div>
                        );
                      })}
                      {dayEvs.length > 3 && (
                        <div className="text-[10px] text-atext-mute px-1">+{dayEvs.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-3" style={{ borderTop: "1px solid var(--A-line)" }}>
            {[
              { color: "#4ADE80", label: "Ball Skills" },
              { color: "#60A5FA", label: "Running" },
              { color: "#A78BFA", label: "Tactics" },
              { color: "#F97316", label: "Gym" },
              { color: "var(--A-accent)", label: "Match Day" },
              { color: "#E84A6F", label: "Pre-Season Match" },
              { color: "var(--A-accent-2)", label: "Key Event" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[11px] text-atext-dim">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
        <div className={`${css.panel} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg tracking-wide" style={{ color: "var(--A-accent-2)" }}>SELECTED DAY</h3>
            <span className="text-[11px] font-mono text-atext-mute">{formatDate(selectedDate)}</span>
          </div>
          {(eventsByDate[selectedDate] || []).length === 0 ? (
            <div className="text-sm text-atext-dim py-3 text-center">Nothing scheduled on this day.</div>
          ) : (
            <div className="space-y-2">
              {(eventsByDate[selectedDate] || []).map((ev, i) => {
                const dot = evDot(ev);
                const rb = resultBadge(ev);
                return (
                  <div key={ev.id ? `${ev.id}-${i}` : `${selectedDate}-${i}`} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)", opacity: ev.completed ? 0.7 : 1 }}>
                    {dot.oppClub ? (
                      <ClubBadge club={dot.oppClub} size="sm" className="flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 min-w-[2.25rem] rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${dot.color}18` }}>{dot.icon}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-atext leading-tight truncate">{dot.label}</div>
                      {ev.type === "training" && dot.trainingInfo?.attrs && (
                        <div className="text-[10px] text-atext-mute mt-0.5">Focus: {dot.trainingInfo.attrs.join(", ")}</div>
                      )}
                      {ev.completed && !rb && <div className="text-[10px] text-atext-mute uppercase tracking-wider">Completed</div>}
                    </div>
                    {rb && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${rb.color}22`, color: rb.color, border: `1px solid ${rb.color}40` }}>{rb.text}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`${css.panel} p-4`}>
          <h3 className="font-display text-lg tracking-wide mb-3" style={{ color: "var(--A-accent)" }}>UPCOMING EVENTS</h3>
          <div className="space-y-2">
            {upcoming.length === 0 && (
              <div className="text-sm text-atext-dim py-4 text-center">No more events this season.</div>
            )}
            {upcoming.map((ev) => {
              const dot = evDot(ev);
              const evKey = ev.id || `${ev.date}-${ev.type}-${ev.round ?? ev.name ?? ""}`;
              const rb = resultBadge(ev);

              // For round events: find opp ladder pos and difficulty
              let diffPill = null;
              let oppPos = null;
              if (ev.type === "round") {
                const mi = getMatchInfo(ev);
                if (mi?.oppId) {
                  oppPos = ladderPos[mi.oppId];
                  diffPill = difficultyPill(oppPos);
                }
              }

              return (
                <div
                  key={evKey}
                  className="flex items-start gap-3 p-3 rounded-xl min-h-[56px]"
                  style={{ background: "var(--A-panel)", border: "1px solid var(--A-line)" }}
                >
                  {dot.oppClub ? (
                    <ClubBadge club={dot.oppClub} size="sm" className="flex-shrink-0 mt-0.5" />
                  ) : (
                    <div
                      className="w-10 h-10 min-w-[2.5rem] rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: `${dot.color}18` }}
                    >
                      {dot.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: dot.color }}>
                      {formatDate(ev.date)}
                    </div>
                    <div className="text-sm font-semibold text-atext leading-tight">{dot.label}</div>
                    {ev.type === "training" && dot.trainingInfo?.attrs && (
                      <div className="text-[10px] text-atext-mute mt-0.5">
                        {dot.trainingInfo.icon} {dot.trainingInfo.attrs.join(", ")}
                      </div>
                    )}
                    {ev.type === "round" && (oppPos || diffPill) && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {oppPos && <span className="text-[10px] font-mono text-atext-mute">#{oppPos}</span>}
                        {diffPill && (
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: `${diffPill.color}22`, color: diffPill.color, border: `1px solid ${diffPill.color}40` }}>
                            {diffPill.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {rb && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5" style={{ background: `${rb.color}22`, color: rb.color, border: `1px solid ${rb.color}40` }}>{rb.text}</span>
                  )}
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
