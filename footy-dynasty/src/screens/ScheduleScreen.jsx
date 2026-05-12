import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function ScheduleScreen({ career, club, league, onOpenCompetition }) {
  const startDate = career.currentDate || `${career.season - 1}-12-01`;
  const [viewDate, setViewDate] = React.useState(startOfMonth(startDate));

  React.useEffect(() => {
    const anchor = career.currentDate || `${career.season - 1}-12-01`;
    setViewDate(startOfMonth(anchor));
  }, [career.season, career.currentDate]);

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

  function evDot(ev) {
    if (ev.type === "training")
      return {
        color: TRAINING_INFO[ev.subtype]?.color || "#94A3B8",
        icon: TRAINING_INFO[ev.subtype]?.icon || "🏋️",
        label: TRAINING_INFO[ev.subtype]?.name || ev.subtype,
        oppClub: null,
      };
    if (ev.type === "key_event")
      return { color: "#4ADBE8", icon: "📅", label: ev.name, oppClub: null };
    if (ev.type === "preseason_match")
      return { color: "#E84A6F", icon: "⚽", label: ev.label, oppClub: null };
    if (ev.type === "round") {
      const m = (ev.matches || []).find((m2) => m2.home === career.clubId || m2.away === career.clubId);
      const opp = m ? findClub(m.home === career.clubId ? m.away : m.home) : null;
      return {
        color: "var(--A-accent)",
        icon: "🏉",
        label: opp ? `Rd ${ev.round} · ${m?.home === career.clubId ? "Home" : "Away"}` : `Rd ${ev.round}`,
        oppClub: opp || null,
      };
    }
    return { color: "#94A3B8", icon: "●", label: "Event", oppClub: null };
  }

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
                onClick={() => setViewDate(startOfMonth(iso))}
                className={`flex-shrink-0 rounded-xl border px-3 py-2 min-h-[72px] min-w-[4.25rem] text-left transition-colors ${
                  isToday ? "ring-2 ring-[var(--A-accent)] border-transparent" : "border-[var(--A-line)]"
                }`}
                style={{
                  background: isToday ? "rgba(0,224,255,0.12)" : "var(--A-panel-2)",
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
                return (
                  <div
                    key={dateStr}
                    className={`rounded-lg p-1.5 min-h-[76px] sm:min-h-[72px] transition-all ${
                      isTodayCell ? "ring-2 ring-[var(--A-accent)]" : ""
                    }`}
                    style={{
                      background: isTodayCell
                        ? "rgba(0,224,255,0.10)"
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
                            <span className="truncate min-w-0">{dot.label}</span>
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
              { color: "#4ADBE8", label: "Key Event" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[11px] text-atext-dim">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${css.panel} p-4`}>
          <h3 className="font-display text-lg text-atext tracking-wide mb-3">UPCOMING EVENTS</h3>
          <div className="space-y-2">
            {upcoming.length === 0 && (
              <div className="text-sm text-atext-dim py-4 text-center">No more events this season.</div>
            )}
            {upcoming.map((ev) => {
              const dot = evDot(ev);
              const evKey = ev.id || `${ev.date}-${ev.type}-${ev.round ?? ev.name ?? ""}`;
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
